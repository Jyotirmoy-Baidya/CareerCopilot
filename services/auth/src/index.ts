import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import registerRoute from './routes/register';
import loginRoute    from './routes/login';
import logoutRoute   from './routes/logout';
import meRoute       from './routes/me';
import refreshRoute  from './routes/refresh';
import onboardRoute  from './routes/onboard';

const app  = express();
const PORT = parseInt(process.env.AUTH_SERVICE_PORT ?? '4001', 10);

app.use(helmet());
app.use(cors({
  origin:      process.env.WEB_URL || 'http://localhost:3000',
  credentials: true,
  methods:     ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '256kb' }));
app.use(cookieParser());

app.use('/auth/register', registerRoute);
app.use('/auth/login',    loginRoute);
app.use('/auth/logout',   logoutRoute);
app.use('/auth/me',       meRoute);
app.use('/auth/refresh',  refreshRoute);
app.use('/auth/onboard',  onboardRoute);

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'auth' }));

app.listen(PORT, () => {
  console.log(`Auth service running on port ${PORT}`);
});
