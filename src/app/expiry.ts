// Owns scheduling only. Each persistence owner performs its own expiry queries.
export function createExpiry(owners:{expire():Promise<void>}[]) {
 let timer:ReturnType<typeof setInterval>|undefined,work:Promise<void>|undefined;
 const run=async()=>{for(const owner of owners)await owner.expire();};
 return {
  run,
  async start(){
   await run();
   timer=setInterval(()=>{if(!work)work=run().catch(()=>{/* Retry next interval; never log driver/content diagnostics. */}).finally(()=>{work=undefined;});},60000);timer.unref();
  },
  async stop(){if(timer)clearInterval(timer);await work;},
 };
}
