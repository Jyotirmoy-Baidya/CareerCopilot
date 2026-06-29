import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { startNotificationWorker } from './workers/notification.worker';
import { createEnqueueRouter } from './routes/enqueue';

const app      = express();
const PORT     = parseInt(process.env.NOTIFICATION_SERVICE_PORT ?? '4006', 10);
const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';

app.use(helmet());
app.use(cors({ origin: process.env.WEB_URL || 'http://localhost:3000' }));
app.use(express.json({ limit: '64kb' }));

app.use('/notification/enqueue', createEnqueueRouter(redisUrl));

app.get('/notification/status', async (_req, res) => {
  res.json({ status: 'ok', queue: 'notifications' });
});

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'notification' }));

startNotificationWorker(redisUrl);

app.listen(PORT, () => {
  console.log(`Notification service running on port ${PORT}`);
});
