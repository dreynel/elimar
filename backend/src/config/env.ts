import dotenv from 'dotenv';

dotenv.config();

const defaultClientOrigins = [
  'http://localhost:3000',
  'http://localhost:9002',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:9002',
];

const configuredClientOrigins = (
  process.env.CLIENT_URLS ||
  process.env.FRONTEND_URL ||
  process.env.CORS_ORIGIN ||
  ''
)
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_NAME: process.env.DB_NAME || 'resort_db',
  DB_PORT: parseInt(process.env.DB_PORT || '3306', 10),
  EMAIL_HOST: process.env.EMAIL_HOST || 'smtp.gmail.com',
  EMAIL_PORT: parseInt(process.env.EMAIL_PORT || '587', 10),
  EMAIL_USER: process.env.EMAIL_USER || '',
  EMAIL_PASS: process.env.EMAIL_PASS || '',
  BREVO_API_KEY: process.env.BREVO_API_KEY || '',
  EMAIL_FROM: process.env.EMAIL_FROM || '',
  EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME || 'Resort Booking',
  JWT_SECRET: process.env.JWT_SECRET || 'supersecretkey',
  CLIENT_URLS: configuredClientOrigins.length > 0 ? configuredClientOrigins : defaultClientOrigins,
};
