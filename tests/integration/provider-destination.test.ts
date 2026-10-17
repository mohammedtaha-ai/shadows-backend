import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateDestination as validate, type DestinationResolver } from '../../src/modules/provider-settings/destination.js';
const publicResolver: DestinationResolver = async () => [{ address: '93.184.216.34', family: 4 }];
const refused = { message: 'destination_refused' };

test('provider_destination_refuses_unsafe_url_shapes_before_dns', async () => {
  let calls = 0;
  const resolver: DestinationResolver = async () => { calls++; return publicResolver('ignored'); };
  for (const url of [
    'http://provider.example/v1', 'ftp://provider.example/v1', 'not a URL',
    'https://user:synthetic-key@provider.example/v1', 'https://user@provider.example/v1',
    'https://@provider.example/v1', 'https://provider.example/v1?key=synthetic',
    'https://provider.example/v1?', 'https://provider.example/v1#fragment', 'https://provider.example/v1#',
    ' https://provider.example/v1', 'https://provider.example/\npath',
    'https://provider.example\\path', 'https://provider.example:0/v1',
  ]) await assert.rejects(() => validate(url, resolver), refused);
  assert.equal(calls, 0);
});

test('provider_destination_refuses_each_unsafe_ipv4_class_and_mapped_form', async () => {
  for (const address of [
    '0.0.0.0', '0.1.2.3', '10.1.2.3', '100.64.0.1', '100.127.255.255', '127.0.0.1', '127.255.255.255',
    '169.254.1.1', '169.254.169.254', '172.16.0.1', '172.31.255.255', '192.168.1.1',
    '224.0.0.1', '239.255.255.255', '240.0.0.1', '255.255.255.255',
    '192.0.0.1', '192.0.2.1', '198.18.0.1', '198.51.100.1', '203.0.113.1',
  ]) {
    await assert.rejects(() => validate('https://provider.example/v1', async () => [{ address, family: 4 }]), refused, address);
    const mapped = `::ffff:${address}`;
    await assert.rejects(() => validate('https://provider.example/v1', async () => [{ address: mapped, family: 6 }]), refused, mapped);
  }
  for (const url of ['https://127.1/v1', 'https://2130706433/v1', 'https://0x7f000001/v1', 'https://0177.0.0.1/v1'])
    await assert.rejects(() => validate(url, publicResolver), refused, url);
});

test('provider_destination_refuses_unsafe_ipv6_and_transition_addresses', async () => {
  for (const address of [
    '::', '::1', 'fc00::1', 'fd00:ec2::254', 'fe80::1', 'febf::1', 'fec0::1', 'ff02::1',
    '::ffff:7f00:1', '::ffff:a9fe:a9fe', '::ffff:a00:1', '::127.0.0.1',
    '64:ff9b::a00:1', '64:ff9b:1::a00:1', '2002:7f00:1::1', '2001::1', '2001:db8::1',
    'fe80::1%eth0',
  ]) await assert.rejects(() => validate('https://provider.example/v1', async () => [{ address, family: 6 }]), refused, address);
  for (const url of ['https://[::1]/v1', 'https://[::ffff:7f00:1]/v1', 'https://[fd00:ec2::254]/v1'])
    await assert.rejects(() => validate(url, publicResolver), refused, url);
});

test('provider_destination_checks_every_dns_answer_and_refuses_empty_malformed_or_failed_resolution', async () => {
  for (const answers of [
    [], [{ address: '93.184.216.34', family: 4 }, { address: '10.0.0.1', family: 4 }],
    [{ address: '10.0.0.1', family: 4 }, { address: '93.184.216.34', family: 4 }],
    [{ address: '93.184.216.34', family: 4 }, { address: '::1', family: 6 }],
    [{ address: '2606:4700:4700::1111', family: 6 }, { address: '::ffff:169.254.169.254', family: 6 }],
    [{ address: '93.184.216.34', family: 6 }], [{ address: 'not-an-ip', family: 4 }],
    [{ address: '2606:4700:4700::1111', family: 4 }],
  ]) await assert.rejects(() => validate('https://provider.example/v1', async () => answers), refused);
  await assert.rejects(() => validate('https://provider.example/v1', async () => {
    throw new Error('synthetic-sensitive-dns-diagnostic');
  }), refused);
});

test('provider_destination_revalidates_each_call_without_reusing_a_previous_public_answer', async () => {
  let calls = 0;
  const resolver: DestinationResolver = async () => [{ address: calls++ === 0 ? '93.184.216.34' : '10.0.0.1', family: 4 }];
  await validate('https://provider.example/v1', resolver);
  await assert.rejects(() => validate('https://provider.example/v1', resolver), refused);
  assert.equal(calls, 2);
});

test('provider_destination_returns_public_answers_and_canonical_tls_host_port_origin', async () => {
  const answers = [{ address: '93.184.216.34', family: 4 }, { address: '2606:4700:4700::1111', family: 6 }];
  const hosts: string[] = [];
  const result = await validate('https://Provider.Example:8443/v1/', async host => { hosts.push(host); return answers; });
  assert.deepEqual(hosts, ['provider.example']);
  assert.deepEqual(result, { origin: 'https://provider.example:8443', host: 'provider.example', port: 8443, addresses: answers });
  answers[0]!.address = '10.0.0.1';
  assert.equal(result.addresses[0]!.address, '93.184.216.34');
  for (const address of ['100.63.255.255', '100.128.0.1', '172.15.255.255', '172.32.0.1', '93.184.216.34']) {
    const destination = await validate(`https://${address}/v1`, async () => { throw new Error('literal must not resolve'); });
    assert.equal(destination.port, 443);
    assert.deepEqual(destination.addresses, [{ address, family: 4 }]);
  }
  const ipv6 = await validate('https://[2606:4700:4700::1111]/v1', publicResolver);
  assert.equal(ipv6.host, '2606:4700:4700::1111');
  assert.equal(ipv6.origin, 'https://[2606:4700:4700::1111]');
  assert.deepEqual(ipv6.addresses, [{ address: '2606:4700:4700::1111', family: 6 }]);
  const mapped = await validate('https://[::ffff:5db8:d822]/v1', publicResolver);
  assert.deepEqual(mapped.addresses, [{ address: '::ffff:5db8:d822', family: 6 }]);
});
