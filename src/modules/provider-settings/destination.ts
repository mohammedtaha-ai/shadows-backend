import { BlockList, isIP } from 'node:net';

export type DestinationResolver = (host: string) => Promise<readonly { address: string; family: number }[]>;
export interface ValidatedDestination {
  origin: string;
  host: string;
  port: number;
  addresses: readonly { address: string; family: 4 | 6 }[];
}

const refused = new BlockList();
// Non-public IPv4, including metadata/link-local, reserved and special-use ranges.
// https://www.iana.org/assignments/iana-ipv4-special-registry/
for (const [network, prefix] of [
  ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8],
  ['169.254.0.0', 16], ['172.16.0.0', 12], ['192.0.0.0', 24], ['192.0.2.0', 24],
  ['192.88.99.0', 24], ['192.168.0.0', 16], ['198.18.0.0', 15], ['198.51.100.0', 24],
  ['203.0.113.0', 24], ['224.0.0.0', 4], ['240.0.0.0', 4],
] as const) refused.addSubnet(network, prefix, 'ipv4');

const publicV6 = new BlockList();
publicV6.addSubnet('2000::', 3, 'ipv6');
publicV6.addSubnet('::ffff:0:0', 96, 'ipv6');
// Only global unicast or mapped public IPv4 is eligible. Exclude special-use
// and transition prefixes that could tunnel an otherwise refused IPv4 target.
// https://www.iana.org/assignments/iana-ipv6-special-registry/
for (const [network, prefix] of [
  ['2001::', 23], ['2001:db8::', 32], ['2002::', 16], ['3fff::', 20],
] as const) refused.addSubnet(network, prefix, 'ipv6');

function publicAddress(address: string, family: number): family is 4 | 6 {
  if (address.includes('%') || isIP(address) !== family || (family !== 4 && family !== 6)) return false;
  const kind = family === 4 ? 'ipv4' : 'ipv6';
  // Node applies IPv4 subnet rules to mapped IPv6 in either dotted or hex form.
  return !refused.check(address, kind) && (family === 4 || publicV6.check(address, 'ipv6'));
}

export async function validateDestination(input: string, resolver: DestinationResolver): Promise<ValidatedDestination> {
  try {
    const authority = /^https:\/\/([^/?#]+)/i.exec(input)?.[1];
    if (!authority || authority.includes('@') || /[\u0000-\u0020\u007f\\]/.test(input)
      || input.includes('?') || input.includes('#')) throw 0;
    const url = new URL(input);
    if (url.protocol !== 'https:' || url.username || url.password || !url.hostname) throw 0;
    const host = url.hostname.replace(/^\[|\]$/g, ''), port = Number(url.port || 443);
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw 0;
    const literalFamily = isIP(host);
    const resolved = literalFamily ? [{ address: host, family: literalFamily }] : await resolver(host);
    if (!resolved.length) throw 0;
    const addresses = resolved.map(({ address, family }) => {
      if (!publicAddress(address, family)) throw 0;
      return { address, family };
    });
    return { origin: url.origin, host, port, addresses };
  } catch { throw new Error('destination_refused'); }
}
