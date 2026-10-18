import {createDatabase} from '../../../src/platform/database/pool.js';
import {createActivity,type AccountChange} from '../../../src/modules/activity/index.js';
type SerializedChange<T=AccountChange> = T extends AccountChange ? Omit<T,'expiresAt'>&{expiresAt:string} : never;
process.once('message',async(message:{url:string;accountId:string;change:SerializedChange})=>{
 const {db}=createDatabase(message.url);
 try{await db.transaction().execute(tx=>createActivity(db).append(tx,message.accountId,[{...message.change,expiresAt:new Date(message.change.expiresAt)}]));process.send?.({result:'committed'});}
 catch{process.send?.({result:'failed'});process.exitCode=1;}
 finally{await db.destroy();process.disconnect();}
});
