// NON-PRODUCT runtime configuration. Never return, log or persist credential values.
import { loadEnvFile } from 'node:process';

export function ensureApiKey({ env = process.env, loadLocal = () => loadEnvFile(new URL('../../.env', import.meta.url)) } = {}) {
  if (env.API_KEY) return; // Includes Network-secret proxy placeholders; do not validate their form.
  try { loadLocal(); } catch { /* Local .env is optional; suppress path/error details. */ }
  if (!env.API_KEY) throw new Error('B0 API_KEY unavailable (details withheld)');
}
