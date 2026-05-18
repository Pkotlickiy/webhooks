import { Router, Request, Response, NextFunction } from 'express';
import { incomingLeadSchema, IncomingLead, ApiResponse } from '../types';
import { validateWebhookKey } from '../services/validator';
import { bitrixService } from '../services/bitrix.service';
import { gainnetApiService } from '../gainnet/gainnet-api.service';
import { logger } from '../logger';

const router = Router();

const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
};

router.post('/lead', requestLogger, async (req: Request, res: Response<ApiResponse<{ bitrixLeadId: number }>>) => {
  try {
    logger.info('📥 Incoming webhook payload', { payload: req.body });

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

    const authKey = lead.key || (req.headers['x-webhook-key'] as string | undefined);
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

    const bitrixLeadId = await bitrixService.createLead(lead);

    return res.status(201).json({
      status: 'success',
      data: { bitrixLeadId },
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

router.post('/sync', requestLogger, async (req: Request, res: Response<ApiResponse<{ synced: number; skipped: number; errors: number }>>) => {
  try {
    const authKey = req.headers['x-webhook-key'] as string | undefined;
    if (!validateWebhookKey(authKey)) {
      logger.warn('🔐 Sync authentication failed', { key: authKey?.substring(0, 10) + '...' });
      return res.status(401).json({
        status: 'error',
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid webhook key',
        },
        timestamp: new Date().toISOString(),
      });
    }

    const limit = Number(req.body?.limit ?? 20);
    const leadStatus = String(req.body?.leadStatus ?? '101');
    const fromDate = req.body?.fromDate ? String(req.body.fromDate) : undefined;
    const toDate = req.body?.toDate ? String(req.body.toDate) : undefined;

    logger.info('🔄 Triggering Gainnet sync', { limit, leadStatus, fromDate, toDate });
    const result = await gainnetApiService.syncLeads({ limit, leadStatus, fromDate, toDate });

    return res.status(200).json({
      status: 'success',
      data: result,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logger.error('💥 Error running Gainnet sync', { error });
    if (error instanceof Error && error.message.includes('Gainnet')) {
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

router.post('/test', (_req, res) => {
  res.json({ status: 'success', message: 'Webhook endpoint is working', timestamp: new Date().toISOString() });
});

export default router;
