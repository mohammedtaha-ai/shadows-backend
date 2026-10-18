export interface ConnectionView {
  connectionId: string;
  name: string;
  format: 'openai_compatible';
  baseUrl: string;
  model: string;
  keyConfigured: boolean;
  revision: number;
  createdAt: string;
  updatedAt: string;
}
export interface ConnectionCreate {
  name: string;
  format: 'openai_compatible';
  baseUrl: string;
  model: string;
  apiKey: string;
}
export type ConnectionUpdate = Partial<ConnectionCreate>;
