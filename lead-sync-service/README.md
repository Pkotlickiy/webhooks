# Lead Sync Microservice

Микросервис для синхронизации лидов из внешней системы в Bitrix24.

## 📋 Структура проекта

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
├── Dockerfile (опционально)
└── README.md
```

## 🚀 Быстрый старт

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка окружения

Скопируйте `.env.example` в `.env` и заполните необходимые переменные:

```bash
cp .env.example .env
```

**Обязательные переменные:**
- `BITRIX24_WEBHOOK_URL` — URL вебхука Bitrix24 с правом `crm.lead.add`
- `WEBHOOK_SECRET_KEY` — ключ для аутентификации входящих запросов

### 3. Запуск

**Разработка:**
```bash
npm run dev
```

**Продакшен:**
```bash
npm run build
npm start
```

## 📡 API Endpoints

### GET /health
Проверка здоровья сервиса

```json
{
  "status": "healthy",
  "service": "lead-sync-microservice",
  "version": "1.0.0",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "config": {
    "bitrixConfigured": true,
    "authEnabled": true,
    "nodeEnv": "production"
  }
}
```

### POST /webhook/lead
Приём лида из внешней системы

**Тело запроса:**
```json
{
  "key": "your-secret-key",
  "id": 12345,
  "phone": "+79991234567",
  "price": 50000,
  "region": "Москва",
  "region_id": 1,
  "name": "Иванов Иван",
  "text": "Интересует аукцион",
  "category": "Аукционы",
  "category_id": 10,
  "type": "Auction"
}
```

**Ответ при успехе (201):**
```json
{
  "status": "success",
  "data": {
    "bitrixLeadId": 456
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Ответ при ошибке (400/401/500/502):**
```json
{
  "status": "error",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request payload",
    "details": {}
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### POST /webhook/test
Тестовый эндпоинт для проверки доступности

## 🔐 Аутентификация

Ключ аутентификации можно передать двумя способами:
1. В поле `key` тела запроса
2. В заголовке `X-Webhook-Key`

## 📦 Формат лида

| Поле | Тип | Обязательное | Описание |
|------|-----|--------------|----------|
| `id` | number | ✅ | ID заявки в системе-источнике |
| `phone` | string | ✅ | Телефон клиента |
| `price` | number | ✅ | Цена заявки |
| `region` | string | ✅ | Регион |
| `region_id` | number | ✅ | ID региона |
| `type` | enum | ✅ | Тип: `Auction` или `Appointment` |
| `key` | string | ❌ | Ключ аутентификации |
| `name` | string | ❌ | Имя клиента |
| `text` | string | ❌ | Текст заявки |
| `category` | string | ❌ | Категория заявки |
| `category_id` | number | ❌ | ID категории |

## 🛠 Скрипты

- `npm run dev` — запуск в режиме разработки с hot-reload
- `npm run build` — компиляция TypeScript
- `npm start` — запуск скомпилированного приложения
- `npm run lint` — проверка кода через ESLint
- `npm run typecheck` — проверка типов без компиляции

## 🐳 Docker (опционально)

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

Сборка и запуск:
```bash
docker build -t lead-sync-service .
docker run -p 3000:3000 --env-file .env lead-sync-service
```

## 🔧 Конфигурация

| Переменная | По умолчанию | Описание |
|------------|--------------|----------|
| `PORT` | 3000 | Порт сервера |
| `NODE_ENV` | development | Окружение |
| `BITRIX24_WEBHOOK_URL` | — | URL вебхука Bitrix24 |
| `WEBHOOK_SECRET_KEY` | — | Секретный ключ |
| `BITRIX24_DEAL_STAGE` | NEW | Статус сделки в Bitrix24 |
| `ENABLE_DUPLICATE_CHECK` | true | Проверка дубликатов |
| `LOG_LEVEL` | info | Уровень логирования |

## 📝 Лицензия

MIT
