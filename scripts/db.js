import pg from 'pg';
const { Pool } = pg;
const ssl = String(process.env.DATABASE_SSL || '').toLowerCase() === 'true'
  ? { rejectUnauthorized: false }
  : undefined;
export const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl });
export async function q(text, params=[]) { return pool.query(text, params); }
export async function tx(fn){
  const client=await pool.connect();
  try{await client.query('BEGIN');const out=await fn(client);await client.query('COMMIT');return out;}
  catch(e){await client.query('ROLLBACK');throw e}
  finally{client.release()}
}
