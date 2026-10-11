import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
export type Sealed = {ciphertext: string; keyId: string};
export class TokenVault {
 constructor(private readonly key: Buffer, private readonly keyId: string) {
  if(key.length !== 32 || !/^[a-zA-Z0-9_-]{1,64}$/.test(keyId)) throw new Error('vault_refused');
 }
 async seal(value: string, associatedData: string): Promise<Sealed> {
  const iv=randomBytes(12), cipher=createCipheriv('aes-256-gcm',this.key,iv);
  cipher.setAAD(Buffer.from(associatedData));
  const encrypted=Buffer.concat([cipher.update(value,'utf8'),cipher.final()]);
  return {ciphertext:Buffer.concat([iv,cipher.getAuthTag(),encrypted]).toString('base64url'),keyId:this.keyId};
 }
 async open(sealed: Sealed, associatedData: string): Promise<string> {
  try {
   if(sealed.keyId !== this.keyId) throw 0;
   const packed=Buffer.from(sealed.ciphertext,'base64url'); if(packed.length<28 || packed.toString('base64url') !== sealed.ciphertext) throw 0;
   const decipher=createDecipheriv('aes-256-gcm',this.key,packed.subarray(0,12));
   decipher.setAAD(Buffer.from(associatedData)); decipher.setAuthTag(packed.subarray(12,28));
   return Buffer.concat([decipher.update(packed.subarray(28)),decipher.final()]).toString('utf8');
  } catch { throw new Error('vault_refused'); }
 }
}
