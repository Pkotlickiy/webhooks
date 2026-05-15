import { z } from 'zod';

// === Входящий лид из внешней системы ===
export const incomingLeadSchema = z.object({
  key: z.string().optional().describe('Ключ аутентификации вебхука'),
  id: z.number().int().positive().describe('ID заявки в системе-источнике'),
  phone: z.string().min(5).describe('Телефон клиента'),
  price: z.number().positive().describe('Цена заявки'),
  region: z.string().min(1).describe('Регион'),
  region_id: z.number().int().positive().describe('ID региона'),
  name: z.string().optional().describe('Имя клиента'),
  text: z.string().optional().describe('Текст заявки'),
  category: z.string().optional().describe('Категория заявки'),
  category_id: z.number().int().positive().optional().describe('ID категории'),
  type: z.enum(['Auction', 'Appointment']).describe('Тип лида'),
});

export type IncomingLead = z.infer<typeof incomingLeadSchema>;

// === Ответ API ===
export interface ApiResponse<T = unknown> {
  status: 'success' | 'error';
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
}

// === Bitrix24 payload ===
export interface BitrixLeadFields {
  TITLE: string;
  NAME?: string;
  LAST_NAME?: string;
  PHONE: Array<{ VALUE: string; VALUE_TYPE: string }>;
  CURRENCY_ID: string;
  OPPORTUNITY: number;
  STATUS_ID: string;
  COMMENTS: string;
  SOURCE_ID: string;
  SOURCE_DESCRIPTION?: string;
  CATEGORY_ID?: number;
  OPENED: 'Y' | 'N';
  ORIGINATOR_ID: string;
  ORIGIN_ID: string;
  [key: string]: unknown;
}

export interface BitrixLeadPayload {
  fields: BitrixLeadFields;
  params: {
    REGISTER_SONET_EVENT: 'Y' | 'N';
  };
}

// === Ответ Bitrix24 API ===
export interface BitrixApiResponse {
  result?: number;
  error?: string;
  error_description?: string;
  time?: string;
}
