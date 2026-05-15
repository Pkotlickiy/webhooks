import { z } from 'zod';

const configSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // VibeCode / Bitrix24
  BITRIX24_WEBHOOK_URL: z.string().url().optional(),
  
  // Security
  WEBHOOK_SECRET_KEY: z.string().min(1).optional(),
  
  // Bitrix24 settings
  BITRIX24_DEAL_STAGE: z.string().default('NEW'),
  ENABLE_DUPLICATE_CHECK: z.coerce.boolean().default(true),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

export type Config = z.infer<typeof configSchema>;

const validateConfig = () => {
  const result = configSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ Config validation error:', result.error.format());
    process.exit(1);
  }
  return result.data;
};

export const config = validateConfig();
