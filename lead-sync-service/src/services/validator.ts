import { WebhookLeadPayload } from '../types';
import { normalizePhone } from '../utils/phone';

export function validateWebhookPayload(payload: any): { valid: boolean; error?: string } {
  if (!payload || typeof payload !== 'object') {
    return { valid: false, error: 'invalid_payload' };
  }

  if (!payload.id || typeof payload.id !== 'string') {
    return { valid: false, error: 'missing_id' };
  }

  if (!payload.name || typeof payload.name !== 'string') {
    return { valid: false, error: 'missing_name' };
  }

  if (!payload.phone || typeof payload.phone !== 'string') {
    return { valid: false, error: 'missing_phone' };
  }

  if (!normalizePhone(payload.phone)) {
    return { valid: false, error: 'invalid_phone' };
  }

  return { valid: true };
}
