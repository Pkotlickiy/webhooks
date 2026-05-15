import express from 'express';
import webhookRouter from './routes/webhook';
import { config } from './config';

const app = express();
app.use(express.json());
app.use('/webhook', webhookRouter);

app.get('/', (_req, res) => {
  res.send('Lead sync service is running.');
});

app.listen(config.port, () => {
  console.log(`Lead sync service listening on http://localhost:${config.port}`);
});
