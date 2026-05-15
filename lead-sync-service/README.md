# lead-sync-service

A lightweight service for receiving lead webhooks and forwarding them to Bitrix24.

## Project structure

```
lead-sync-service/
├── src/
│   ├── index.ts              # Точка входа
│   ├── config.ts             # Конфигурация из ENV
│   ├── types.ts              # TypeScript интерфейсы
│   ├── routes/
│   │   └── webhook.ts        # Обработчик /webhook/lead
│   ├── services/
│   │   ├── bitrix.service.ts # Логика отправки в Bitrix24
│   │   └── validator.ts      # Валидация вебхука
│   └── utils/
│       └── phone.ts          # Утилиты для телефона
├── package.json
├── tsconfig.json
├── .env.example
├── Dockerfile
└── README.md
```

## Usage

1. Copy `.env.example` to `.env` and fill in the Bitrix24 settings.
2. Install dependencies:

```bash
cd lead-sync-service
npm install
```

3. Start in development mode:

```bash
npm run dev
```

4. Build and start for production:

```bash
npm run build
npm start
```

## Endpoints

- `POST /webhook/lead` — receives lead webhooks and forwards them to the configured Bitrix24 REST webhook.
- `GET /` — health check.

## Configuration

Use `.env` or environment variables to configure the target Bitrix24 webhook:

- `BITRIX_WEBHOOK_URL` or `BITRIX_REST_URL` — base Webhook URL, for example `https://urakcept.bitrix24.ru/rest/1/fx00xfz9x9l434fh/`
- `BITRIX_REST_METHOD` — optional Bitrix24 REST method to append, e.g. `crm.lead.add`
- `BITRIX_AUTH_TOKEN` — optional bearer token if your endpoint requires authorization
