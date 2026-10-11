export function installShutdown(stop: () => Promise<void>) {
  let stopping = false;
  const handle = () => { if (!stopping) { stopping = true; void stop().catch(() => { process.exitCode = 1; }); } };
  process.once('SIGINT', handle); process.once('SIGTERM', handle);
}
