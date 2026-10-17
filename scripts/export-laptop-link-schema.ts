import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { compile } from 'json-schema-to-typescript';
import { ClientFrame, ServerFrame } from '../src/transports/laptop-link/schema.js';

export async function laptopLinkArtifacts():Promise<{schema:string;declarations:string}> {
  const document=JSON.parse(JSON.stringify({$schema:'http://json-schema.org/draft-07/schema#',title:'LaptopLinkV1',
    oneOf:[{$ref:'#/definitions/ClientFrame'},{$ref:'#/definitions/ServerFrame'}],definitions:{ClientFrame,ServerFrame}}));
  return {schema:JSON.stringify(document,null,2)+'\n',declarations:await compile(document,'LaptopLinkV1',{
    bannerComment:'/* Generated from src/transports/laptop-link/schema.ts. Do not edit. */',style:{singleQuote:true},
  })};
}
if(process.argv[1]===fileURLToPath(import.meta.url)) {
  const artifacts=await laptopLinkArtifacts();
  await writeFile('api/laptop-link-v1.schema.json',artifacts.schema);
  await writeFile('api/laptop-link-v1.d.ts',artifacts.declarations);
}
