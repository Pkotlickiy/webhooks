/**
 * Нормализация телефона к формату +7...
 */
export const normalizePhone = (phone: string): string => {
  // Убираем всё кроме цифр и +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // Обработка российских номеров
  if (/^\+7\d{10}$/.test(cleaned)) {
    return cleaned;
  }
  if (/^8\d{10}$/.test(cleaned)) {
    return `+7${cleaned.slice(1)}`;
  }
  if (/^7\d{10}$/.test(cleaned)) {
    return `+7${cleaned.slice(1)}`;
  }
  
  // Возвращаем как есть, если не российский формат
  return cleaned;
};

/**
 * Валидация телефона (минимальная)
 */
export const isValidPhone = (phone: string): boolean => {
  const normalized = normalizePhone(phone);
  return normalized.startsWith('+') && normalized.length >= 11;
};
