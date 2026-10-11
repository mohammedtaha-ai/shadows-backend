import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { getCACertificates, setDefaultCACertificates } from 'node:tls';
const exec = promisify(execFile);
export async function tlsFixture() {
  const root = resolve('.test-runtime'); await mkdir(root,{recursive:true});
  const directory = await mkdtemp(resolve(root,'tls-'));
  const keyPath=resolve(directory,'key.pem'), certPath=resolve(directory,'cert.pem');
  try {
    await exec('openssl',['req','-x509','-newkey','rsa:2048','-nodes','-days','1','-subj','/CN=127.0.0.1',
      '-addext','subjectAltName=IP:127.0.0.1','-keyout',keyPath,'-out',certPath],{timeout:15000});
    const cert=await readFile(certPath,'utf8'), key=await readFile(keyPath,'utf8'), previous=getCACertificates('default');
    setDefaultCACertificates([...previous,cert]);
    return {directory,keyPath,certPath,key,cert,async close(){setDefaultCACertificates(previous);await rm(directory,{recursive:true,force:true});}};
  } catch {await rm(directory,{recursive:true,force:true});throw new Error('tls_fixture_setup');}
}
