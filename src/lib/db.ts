import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';

// Matches the DB_* environment variables already configured on the cPanel
// Node.js app (DB_NAME, DB_USER, DB_PASSWORD, DB_SOCKET) — connects over the
// local MySQL unix socket on shared hosting. Falls back to DB_HOST/DB_PORT
// for environments without a socket (e.g. local development).
function createPool() {
  const database = process.env.DB_NAME || 'empowerhub_app';
  const user = process.env.DB_USER || 'empowerhub_app';
  const password = process.env.DB_PASSWORD || '';
  const socketPath = process.env.DB_SOCKET;

  if (socketPath) {
    return mysql.createPool({ socketPath, user, password, database, waitForConnections: true, connectionLimit: 10 });
  }
  return mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    user, password, database,
    waitForConnections: true,
    connectionLimit: 10,
  });
}

declare global {
  // eslint-disable-next-line no-var
  var __empowerhubPool: mysql.Pool | undefined;
}

const pool = global.__empowerhubPool ?? createPool();
if (process.env.NODE_ENV !== 'production') global.__empowerhubPool = pool;

export const db = drizzle(pool, { schema, mode: 'default' });
