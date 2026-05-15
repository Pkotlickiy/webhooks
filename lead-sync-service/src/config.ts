const bitrixWebhookUrl = process.env.BITRIX_WEBHOOK_URL || process.env.BITRIX_REST_URL;

export const config = {
  port: Number(process.env.PORT ?? 3000),
  bitrixWebhookUrl: bitrixWebhookUrl ?? '',
  bitrixRestMethod: process.env.BITRIX_REST_METHOD ?? '',
  bitrixAuthToken: process.env.BITRIX_AUTH_TOKEN ?? '',
};

if (!config.bitrixWebhookUrl) {
  throw new Error('Missing required environment variable: BITRIX_WEBHOOK_URL or BITRIX_REST_URL');
}
