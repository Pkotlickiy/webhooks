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

- `POST /webhook/lead` — receives lead webhooks and forwards them to Bitrix24.
- `GET /` — health check.
