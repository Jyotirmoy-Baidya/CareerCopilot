import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import Redis from 'ioredis';
import dailyTasksRoute from './routes/daily-tasks';
import createTaskRoute from './routes/create-task';
import { createRoadmapRouter } from './routes/roadmap';
import { createCompleteSkillRouter } from './routes/complete-skill';

const app    = express();
const PORT   = parseInt(process.env.RECOMMENDATION_SERVICE_PORT ?? '4002', 10);
const redis  = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379');
const NOTIFICATION_URL = process.env.NOTIFICATION_SERVICE_URL ?? 'http://localhost:4006';

app.use(helmet());
app.use(cors({
  origin:      process.env.WEB_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '256kb' }));

app.use('/recommendation/roadmap',        createRoadmapRouter(redis));
app.use('/recommendation/daily-tasks',    dailyTasksRoute);
app.use('/recommendation/tasks',          createTaskRoute);
app.use('/recommendation/complete-skill', createCompleteSkillRouter(NOTIFICATION_URL, redis));

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'recommendation' }));

app.listen(PORT, () => {
  console.log(`Recommendation service running on port ${PORT}`);
});
