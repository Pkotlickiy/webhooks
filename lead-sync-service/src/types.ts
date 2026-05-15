export interface WebhookLeadPayload {
  id: string;
  name: string;
  phone: string;
  email?: string;
  [key: string]: unknown;
}

export interface BitrixLead {
  TITLE: string;
  NAME: string;
  PHONE: Array<{ VALUE: string; VALUE_TYPE: string }>;
  EMAIL?: Array<{ VALUE: string; VALUE_TYPE: string }>;
}
