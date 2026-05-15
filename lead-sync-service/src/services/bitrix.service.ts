import { BitrixLead, WebhookLeadPayload } from '../types';
import { config } from '../config';
import { normalizePhone } from '../utils/phone';

function buildBitrixLead(payload: WebhookLeadPayload): BitrixLead {
  const phone = normalizePhone(payload.phone);

  const lead: BitrixLead = {
    TITLE: `Lead ${payload.name}`,
    NAME: payload.name,
    PHONE: [{ VALUE: phone, VALUE_TYPE: 'WORK' }],
  };

  if (payload.email && typeof payload.email === 'string') {
    lead.EMAIL = [{ VALUE: payload.email, VALUE_TYPE: 'WORK' }];
  }

  return lead;
}

function buildRequestUrl(): string {
  if (!config.bitrixRestMethod) {
    return config.bitrixWebhookUrl;
  }

  const separator = config.bitrixWebhookUrl.endsWith('/') ? '' : '/';
  return `${config.bitrixWebhookUrl}${separator}${config.bitrixRestMethod}`;
}

export async function sendLeadToBitrix(payload: WebhookLeadPayload): Promise<void> {
  const lead = buildBitrixLead(payload);
  const url = buildRequestUrl();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (config.bitrixAuthToken) {
    headers.Authorization = `Bearer ${config.bitrixAuthToken}`;
  }

  const body = config.bitrixRestMethod === 'crm.lead.add' ? { fields: lead } : payload;

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const responseBody = await response.text();
    throw new Error(`Bitrix request failed: ${response.status} ${responseBody}`);
  }
}
