export function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/[^\d+]/g, '');
  if (!cleaned) {
    return '';
  }

  return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
}
