import 'dotenv/config';
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '007622',
    database: process.env.DB_NAME || 'elimardb',
    port: Number(process.env.DB_PORT) || 3306,
  });

  const sql = fs.readFileSync(path.join(process.cwd(), 'database', 'migrations', 'add_accommodation_reviews.sql'), 'utf-8');
  await connection.query(sql);
  console.log('Migration added successfully!');
  await connection.end();
}

run().catch(console.error);
