import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './db.js';
const __dirname=path.dirname(fileURLToPath(import.meta.url));
if(!process.env.DATABASE_URL){console.error('DATABASE_URL wajib diisi.');process.exit(1)}
const sql=fs.readFileSync(path.join(__dirname,'..','db','schema.sql'),'utf8');
try{
  await pool.query(sql);
  await pool.query("INSERT INTO schema_migrations(version) VALUES('2.2.0') ON CONFLICT(version) DO NOTHING");
  console.log('Database migration v2.2.0 selesai.');
}finally{await pool.end()}
