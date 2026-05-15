# Lead Sync Microservice

Репозиторий содержит сервис синхронизации лидов в Bitrix24.

Все команды и работа с проектом выполняются из папки `lead-sync-service/`.

## Быстрый старт

```bash
cd lead-sync-service
npm install
cp .env.example .env
npm run dev
```

## Структура проекта

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
├── package.json
├── package-lock.json
├── tsconfig.json
├── .env.example
├── Dockerfile
```
## Docker

```bash
docker build -t lead-sync-service lead-sync-service
```

## Примечание

Дублирующийся `README.md` внутри `lead-sync-service/` удалён — документация теперь одна, на уровне корня.
