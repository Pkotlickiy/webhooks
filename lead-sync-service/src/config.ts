export const config = {
  port: Number(process.env.PORT ?? 3000),
  bitrixWebhookUrl: process.env.BITRIX_WEBHOOK_URL ?? '',
  bitrixAuthToken: process.env.BITRIX_AUTH_TOKEN ?? '',
};

if (!config.bitrixWebhookUrl) {
  throw new Error('Missing required environment variable: BITRIX_WEBHOOK_URL');
}

if (!config.bitrixAuthToken) {
  throw new Error('Missing required environment variable: BITRIX_AUTH_TOKEN');
}
