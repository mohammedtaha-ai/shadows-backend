import { readConfig } from '../src/app/config.js';
import { runMigrations } from '../src/platform/database/migrate.js';
try { const config = readConfig(process.env); await runMigrations({ connectionString: config.databaseUrl }, 'up'); }
catch { console.error('migration_failed'); process.exitCode = 1; }
