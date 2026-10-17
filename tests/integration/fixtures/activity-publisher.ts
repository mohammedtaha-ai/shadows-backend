import {createDatabase} from '../../../src/platform/database/pool.js';
import {createActivity,type AccountChange} from '../../../src/modules/activity/index.js';
process.once('message',async(message:{url:string;accountId:string;change:Omit<AccountChange,'expiresAt'>&{expiresAt:string}})=>{
 const {db}=createDatabase(message.url);
 try{await db.transaction().execute(tx=>createActivity(db).append(tx,message.accountId,[{...message.change,expiresAt:new Date(message.change.expiresAt)}]));process.send?.({result:'committed'});}
 catch{process.send?.({result:'failed'});process.exitCode=1;}
 finally{await db.destroy();process.disconnect();}
});
