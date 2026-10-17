import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {randomUUID} from 'node:crypto';
import {mkdir,mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {resolve} from 'node:path';
import YAML from 'yaml';
import {freePort} from './postgres.js';
import type {tlsFixture} from './tls.js';

const exec=promisify(execFile),label='shadows.ingress.fixture';
async function docker(args:string[]) {
 const env={...process.env};
 for(const key of ['DOCKER_HOST','DOCKER_CONTEXT','DOCKER_TLS','DOCKER_TLS_VERIFY','DOCKER_CERT_PATH'])delete env[key];
 try{return await exec('docker',['--host=unix:///var/run/docker.sock',...args],{env,timeout:30000});}
 catch{throw new Error('ingress_fixture_docker');}
}

// The product config is copied verbatim except for owned ports and TLS paths.
export async function ingressFixture(upstream:number,tls:Awaited<ReturnType<typeof tlsFixture>>) {
 const port=await freePort(),readyPort=await freePort(),name='ingress-'+randomUUID(),owner=randomUUID();
 await mkdir(resolve('.test-runtime'),{recursive:true});
 const directory=await mkdtemp(resolve('.test-runtime/ingress-'));let created=false;
 const base=`https://127.0.0.1:${port}`;
 async function close(){
  if(created){
   const owned=(await docker(['inspect','--format',`{{ index .Config.Labels "${label}" }}`,name])).stdout.trim();
   if(owned!==owner)throw new Error('fixture_ownership');
   await docker(['rm','--force',name]);created=false;
  }
  await rm(directory,{recursive:true,force:true});
 }
 try{
  let config=await readFile('docker/nginx.conf','utf8');
  for(const [before,after] of [
   ['listen 8088;',`listen 127.0.0.1:${readyPort};`],
   ['listen 8443 ssl;',`listen 127.0.0.1:${port} ssl;`],
   ['http://127.0.0.1:3000',`http://127.0.0.1:${upstream}`],
   ['/tls/server.pem','/etc/nginx/server.pem'],['/tls/server-key.pem','/etc/nginx/server-key.pem'],
  ] as const){
   if(!config.includes(before))throw new Error('ingress_fixture_config_changed');config=config.replaceAll(before,after);
  }
  await writeFile(resolve(directory,'default.conf'),config);
  const image=YAML.parse(await readFile('compose.yaml','utf8')).services.ingress.image as string;
  const network=process.env.B1_FIXTURE_NETWORK_CONTAINER;
  if(network&&!/^[a-zA-Z0-9_-]+$/.test(network))throw new Error('fixture_network_invalid');
  await docker(['image','inspect',image]);
  await docker(['create','--name',name,'--label',`${label}=${owner}`,'--memory','128m','--cpus','1',
   '--network',network?`container:${network}`:'host','--entrypoint','nginx',image,'-g','daemon off;']);created=true;
  await docker(['cp',resolve(directory,'default.conf'),`${name}:/etc/nginx/conf.d/default.conf`]);
  await docker(['cp',tls.certPath,`${name}:/etc/nginx/server.pem`]);
  await docker(['cp',tls.keyPath,`${name}:/etc/nginx/server-key.pem`]);
  await docker(['start',name]);
  const deadline=Date.now()+10000;let ready=false;
  while(Date.now()<deadline){
   try{const r=await fetch(base+'/health',{signal:AbortSignal.timeout(1000)});if(r.ok){ready=true;break;}}catch{}
   await new Promise(r=>setTimeout(r,100));
  }
  if(!ready)throw new Error('ingress_fixture_readiness');
  return {base,close};
 }catch(error){await close();throw error;}
}
