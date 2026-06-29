import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import flushRoute from './routes/flush';
import { createYjsRouter } from './routes/yjs';
import versionsRoute from './routes/versions';

const app    = express();
const PORT   = parseInt(process.env.SYNC_SERVICE_PORT ?? '4003', 10);
const COLLAB = process.env.COLLABORATION_SERVICE_URL ?? 'http://localhost:4004';

app.use(helmet());
app.use(cors({ origin: process.env.WEB_URL || 'http://localhost:3000', credentials: true }));

// Hard limit on body size — first line of defence against OOM attacks
app.use(express.json({ limit: '512kb' }));

const syncLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: 'Too many sync requests — slow down' },
});

app.use('/sync/flush',    syncLimiter, flushRoute);
app.use('/sync/yjs',     syncLimiter, createYjsRouter(COLLAB));
app.use('/sync/versions', syncLimiter, versionsRoute);

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'sync' }));

app.listen(PORT, () => {
  console.log(`Sync service running on port ${PORT}`);
});
