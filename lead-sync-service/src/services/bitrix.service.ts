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

export async function sendLeadToBitrix(payload: WebhookLeadPayload): Promise<void> {
  const lead = buildBitrixLead(payload);

  const response = await fetch(config.bitrixWebhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.bitrixAuthToken}`,
    },
    body: JSON.stringify({ fields: lead }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Bitrix request failed: ${response.status} ${body}`);
  }
}
