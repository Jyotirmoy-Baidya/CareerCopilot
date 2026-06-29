import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import Redis from 'ioredis';
import chatRoute      from './routes/chat';
import resumeRoute    from './routes/resume';
import documentRoute  from './routes/document';
import { createQuizRouter }    from './routes/quiz';
import { createSummaryRouter } from './routes/summary';
import { createAiUsageLimit }  from './middleware/aiUsageLimit';

const app   = express();
const PORT  = parseInt(process.env.AI_SERVICE_PORT ?? '4005', 10);
const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379');

app.use(helmet());
app.use(cors({ origin: process.env.WEB_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '256kb' }));

// Per-IP burst protection
const ipLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: 'Too many AI requests — please wait a moment' },
});

// Per-user free-tier limit (3 AI calls total)
const usageLimit = createAiUsageLimit(redis);

app.use('/ai/chat',           ipLimiter, usageLimit, chatRoute);
app.use('/ai/document',       ipLimiter, usageLimit, documentRoute);
app.use('/ai/quiz',           ipLimiter, usageLimit, createQuizRouter(redis));
app.use('/ai/resume-review',  ipLimiter, usageLimit, resumeRoute);
app.use('/ai/weekly-summary', ipLimiter, usageLimit, createSummaryRouter(redis));

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'ai' }));

app.listen(PORT, () => {
  console.log(`AI service running on port ${PORT}`);
});
