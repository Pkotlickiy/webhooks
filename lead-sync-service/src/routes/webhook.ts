import { Router, Request, Response, NextFunction } from 'express';
import { incomingLeadSchema, IncomingLead, ApiResponse } from '../types';
import { validateWebhookKey } from '../services/validator';
import { bitrixService } from '../services/bitrix.service';
import { logger } from '../index';

const router = Router();

/**
 * Middleware для логирования запросов
 */
const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
};

/**
 * Основной эндпоинт: приём лида из внешней системы
 * POST /webhook/lead
 */
router.post('/lead', requestLogger, async (req: Request, res: Response<ApiResponse<{ bitrixLeadId: number }>>) => {
  try {
    // 1. Валидация тела запроса через Zod
    const parseResult = incomingLeadSchema.safeParse(req.body);
    if (!parseResult.success) {
      logger.warn('🚫 Invalid lead payload', { errors: parseResult.error.format() });
      return res.status(400).json({
        status: 'error',
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request payload',
          details: parseResult.error.format(),
        },
        timestamp: new Date().toISOString(),
      });
    }
    const lead: IncomingLead = parseResult.data;

    // 2. Проверка ключа аутентификации
    const authKey = lead.key || req.headers['x-webhook-key'] as string | undefined;
    if (!validateWebhookKey(authKey)) {
      logger.warn('🔐 Authentication failed', { key: authKey?.substring(0, 10) + '...' });
      return res.status(401).json({
        status: 'error',
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid webhook key',
        },
        timestamp: new Date().toISOString(),
      });
    }

    // 3. Отправка в Bitrix24
    const bitrixLeadId = await bitrixService.createLead(lead);

    // 4. Успешный ответ
    return res.status(201).json({
      status: 'success',
      data: {
        bitrixLeadId,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logger.error('💥 Error processing webhook', { error });
    
    if (error instanceof Error && error.message.includes('Bitrix24')) {
      return res.status(502).json({
        status: 'error',
        error: {
          code: 'UPSTREAM_ERROR',
          message: error.message,
        },
        timestamp: new Date().toISOString(),
      });
    }

    return res.status(500).json({
      status: 'error',
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      },
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Тестовый эндпоинт
 */
router.post('/test', (_req, res) => {
  res.json({
    status: 'success',
    message: 'Webhook endpoint is working',
    timestamp: new Date().toISOString(),
  });
});

export default router;
