// NON-PRODUCT fresh backend-session verifier process; runtime config only via stdin.
import pg from 'pg';
import { authenticateFixture } from './identity-device-fixture.mjs';
let input='';for await(const part of process.stdin)input+=part;
const {pgOptions,handle}=JSON.parse(input),pool=new pg.Pool(pgOptions);
try{const authenticated=!!(await authenticateFixture(pool,handle));console.log(JSON.stringify({authenticated}));}catch{console.log(JSON.stringify({fixtureFailure:true}));process.exitCode=1;}finally{await pool.end();}
