import { config } from '../config';

/**
 * Проверка ключа аутентификации вебхука
 */
export const validateWebhookKey = (providedKey?: string): boolean => {
  // Если секрет не настроен — пропускаем все (только для dev!)
  if (!config.WEBHOOK_SECRET_KEY) {
    if (config.NODE_ENV === 'production') {
      console.warn('⚠️ WEBHOOK_SECRET_KEY not set in production!');
    }
    return true;
  }
  return providedKey === config.WEBHOOK_SECRET_KEY;
};

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
 * Парсинг ФИО на имя и фамилию
 */
export const parseFullName = (fullName?: string): { name?: string; lastName?: string } => {
  if (!fullName?.trim()) {
    return { name: undefined, lastName: undefined };
  }
  
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  
  if (parts.length === 0) {
    return { name: undefined, lastName: undefined };
  }
  if (parts.length === 1) {
    return { name: parts[0], lastName: undefined };
  }
  if (parts.length === 2) {
    return { name: parts[0], lastName: parts[1] };
  }
  
  // 3+ части: первая — имя, последняя — фамилия, середина — отчество (в name)
  return {
    name: parts.slice(0, -1).join(' '),
    lastName: parts[parts.length - 1],
  };
};
