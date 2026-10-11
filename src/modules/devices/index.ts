import { DeviceService } from './service.js';
export type { IdentityOperations, DeviceService } from './service.js';
export function createDevices(...args:ConstructorParameters<typeof DeviceService>):DeviceService {return new DeviceService(...args);}
