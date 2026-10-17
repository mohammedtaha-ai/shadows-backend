import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

export interface KeyRing {
  activeKeyId: string;
  keys: ReadonlyMap<string, Buffer>;
}
export interface CredentialAad {
  accountId: string;
  connectionId: string;
  destination: string;
  credentialRevision: number;
}
export interface SealedCredential { keyId: string; sealed: string }

function associatedData(aad: CredentialAad, keyId: string): Buffer {
  if (![aad.accountId, aad.connectionId, aad.destination].every(value => typeof value === 'string' && value.length > 0)
    || !Number.isSafeInteger(aad.credentialRevision) || aad.credentialRevision < 1) throw 0;
  // A JSON tuple preserves field boundaries, including delimiters inside values.
  return Buffer.from(JSON.stringify([keyId, aad.accountId, aad.connectionId, aad.destination, aad.credentialRevision]));
}

function keyFor(keyRing: KeyRing, keyId: string): Buffer {
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(keyId)) throw 0;
  const key = keyRing.keys.get(keyId);
  if (!Buffer.isBuffer(key) || key.length !== 32) throw 0;
  return key;
}

export function seal(keyRing: KeyRing, aad: CredentialAad, plaintext: string): SealedCredential {
  try {
    const keyId = keyRing.activeKeyId, nonce = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', keyFor(keyRing, keyId), nonce, { authTagLength: 16 });
    cipher.setAAD(associatedData(aad, keyId));
    const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    return { keyId, sealed: Buffer.concat([nonce, cipher.getAuthTag(), ciphertext]).toString('base64url') };
  } catch { throw new Error('credential_refused'); }
}

export function open(keyRing: KeyRing, aad: CredentialAad, keyId: string, sealed: string): string {
  try {
    const key = keyFor(keyRing, keyId), packed = Buffer.from(sealed, 'base64url');
    if (packed.length < 28 || packed.toString('base64url') !== sealed) throw 0;
    const decipher = createDecipheriv('aes-256-gcm', key, packed.subarray(0, 12), { authTagLength: 16 });
    decipher.setAAD(associatedData(aad, keyId));
    decipher.setAuthTag(packed.subarray(12, 28));
    return Buffer.concat([decipher.update(packed.subarray(28)), decipher.final()]).toString('utf8');
  } catch { throw new Error('credential_refused'); }
}
