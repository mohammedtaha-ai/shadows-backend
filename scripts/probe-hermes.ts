// Read-only operator probe. Keys are resolved at runtime and never projected.
import {open} from 'node:fs/promises';
import {probeHermes,readHermesTarget} from '../docker/hermes-connection.js';
async function credential(path:string|undefined):Promise<string|undefined>{
 if(!path)return undefined;
 const file=await open(path,'r');
 try{
  const info=await file.stat();if(!info.isFile()||info.size>4096)throw 0;
  const key=(await file.readFile('utf8')).trim();
  if(!key||/[\s\x00-\x1f\x7f]/.test(key))throw 0;
  return key;
 }finally{await file.close();}
}
try{
 const target=readHermesTarget(process.env),key=await credential(process.env.HERMES_API_KEY_FILE);
 const result=await probeHermes(target,key);console.log(JSON.stringify(result));
 if(result.state!=='ready')process.exitCode=1;
}catch{console.log(JSON.stringify({state:'configuration_required',modelCallMade:false}));process.exitCode=1;}
