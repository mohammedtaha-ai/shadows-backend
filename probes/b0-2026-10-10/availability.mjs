// Configuration presence only. Never reads files or prints runtime secret values.
import { writeFile, mkdir } from 'node:fs/promises';
const supportedProviderPresent = ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'GOOGLE_GENERATIVE_AI_API_KEY', 'AZURE_OPENAI_API_KEY'].some(name => Boolean(process.env[name]));
const identityPresent = Boolean(process.env.B0_OIDC_ISSUER && process.env.B0_OIDC_CLIENT_ID);
await mkdir('artifacts', { recursive: true });
const result = {
  actualProvider: { status: supportedProviderPresent ? 'UNRESOLVED' : 'BLOCKED', configurationPresent: supportedProviderPresent, cases: ['completion', 'partial failure', 'cancellation', 'tool calls'], reason: supportedProviderPresent ? 'Approved model/endpoint and invocation fixture still required; no automatic call' : 'No supported provider configuration inherited; no credentials retrieved' },
  deployedIdentity: { status: 'BLOCKED', configurationPresent: identityPresent, reason: 'No authorized identity tenant and native-browser control path established' },
  windowsSystemBrowser: { status: 'BLOCKED', reason: 'CUA inventory exposes only in-app browser and MCP Apps; native APIs disabled' },
};
await writeFile('artifacts/availability.json', JSON.stringify(result, null, 2)); console.log(JSON.stringify(result));
