export {createAssistant} from './service.js';
export type {AssistantSnapshot,AssistantConversation,AssistantTurn} from './model.js';
export type AssistantService=ReturnType<typeof import('./service.js').createAssistant>;
