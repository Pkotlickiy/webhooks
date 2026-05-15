import 'dotenv/config';
import express, { Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { createLogger, transports, format } from 'winston';

import { config } from './config';
import webhookRouter from './routes/webhook';

// === Настройка логгера ===
export const logger = createLogger({
  level: config.LOG_LEVEL,
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      ),
    }),
  ],
});

// === Инициализация Express ===
const app = express();

// Безопасность
app.use(helmet({
  contentSecurityPolicy: false, // Отключаем для API
}));
app.use(cors({
  origin: false, // Запрещаем CORS для безопасности
  methods: ['POST', 'GET'],
}));

// Парсинг JSON
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// === Роуты ===
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'lead-sync-microservice',
    version: process.env.npm_package_version || '1.0.0',
    timestamp: new Date().toISOString(),
    config: {
      bitrixConfigured: !!config.BITRIX24_WEBHOOK_URL,
      authEnabled: !!config.WEBHOOK_SECRET_KEY,
      nodeEnv: config.NODE_ENV,
    },
  });
});

app.get('/', (_req: Request, res: Response) => {
  res.json({
    service: 'Lead Sync Microservice',
    endpoints: {
      health: 'GET /health',
      webhook: 'POST /webhook/lead',
      test: 'POST /webhook/test',
    },
  });
});

// Основной роут вебхука
app.use('/webhook', webhookRouter);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
    timestamp: new Date().toISOString(),
  });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: unknown) => {
  logger.error('Unhandled error', { error: err, path: _req.path });
  res.status(500).json({
    status: 'error',
    error: {
      code: 'INTERNAL_ERROR',
      message: config.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : err.message,
    },
    timestamp: new Date().toISOString(),
  });
});

// === Запуск сервера ===
const startServer = async () => {
  try {
    // Предварительная проверка зависимостей
    if (!config.BITRIX24_WEBHOOK_URL) {
      logger.warn('⚠️ BITRIX24_WEBHOOK_URL not set — service will fail on lead creation');
    }

    app.listen(config.PORT, '0.0.0.0', () => {
      logger.info(`🚀 Server running on port ${config.PORT}`);
      logger.info(`📡 Health: http://localhost:${config.PORT}/health`);
      logger.info(`🎣 Webhook: POST http://localhost:${config.PORT}/webhook/lead`);
    });

  } catch (error) {
    logger.error('❌ Failed to start server', { error });
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer();
