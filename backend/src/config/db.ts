import mysql, { PoolOptions } from 'mysql2/promise';
import { env } from './env.js';

const buildPoolConfig = (): PoolOptions => {
  if (env.DATABASE_URL) {
    const url = new URL(env.DATABASE_URL);

    return {
      host: url.hostname,
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.replace(/^\//, ''),
      port: url.port ? parseInt(url.port, 10) : 3306,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      ssl: env.DB_SSL ? { rejectUnauthorized: false } : undefined,
    };
  }

  if (!env.DB_HOST) {
    throw new Error(
      'Database configuration is missing. Set DATABASE_URL (preferred) or DB_HOST/DB_USER/DB_PASSWORD/DB_NAME.'
    );
  }

  return {
    host: env.DB_HOST,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    port: env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: env.DB_SSL ? { rejectUnauthorized: false } : undefined,
  };
};

export const pool = mysql.createPool(buildPoolConfig());

export const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    const connectionMode = env.DATABASE_URL ? 'DATABASE_URL' : `${env.DB_HOST}:${env.DB_PORT}`;
    console.log(`Database connected successfully (${connectionMode})`);
    connection.release();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
};
