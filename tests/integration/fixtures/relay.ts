import type {identityFixture} from './identity.js';
import {createActivity} from '../../../src/modules/activity/index.js';
import {createLinks} from '../../../src/modules/links/index.js';
import {createSessions} from '../../../src/modules/sessions/index.js';
export function relayServices(f:Awaited<ReturnType<typeof identityFixture>>) {
 const activity=createActivity(f.db,()=>f.now),links=createLinks(f.db,f.identity,activity,()=>f.now);
 const sessions=createSessions(f.db,f.identity,links,activity,()=>f.now);
 return {activity,links,sessions};
}
