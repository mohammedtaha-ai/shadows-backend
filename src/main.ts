import { readConfig } from './app/config.js';
import { compose } from './app/compose.js';
import { installShutdown } from './app/shutdown.js';
try { const app = await compose(readConfig(process.env)); installShutdown(() => app.stop()); await app.start(); }
catch { console.error('startup_failed'); process.exitCode = 1; }
