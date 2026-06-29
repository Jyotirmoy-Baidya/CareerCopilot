import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,                       // 6 services × 5 = 30 total — safe for most setups
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const db = drizzle(pool, {
  schema,
  logger: process.env.NODE_ENV === 'development',
});

export type DB = typeof db;

process.on('SIGTERM', async () => {
  await pool.end();
});
