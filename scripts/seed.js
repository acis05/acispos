import bcrypt from 'bcryptjs';
import { pool } from './db.js';
if(!process.env.DATABASE_URL){console.error('DATABASE_URL wajib diisi.');process.exit(1)}
const ids={tenant:'00000000-0000-4000-8000-000000000001',outlet:'00000000-0000-4000-8000-000000000002',admin:'00000000-0000-4000-8000-000000000003',roleAdmin:'00000000-0000-4000-8000-000000000004',roleKasir:'00000000-0000-4000-8000-000000000005',roleManager:'00000000-0000-4000-8000-000000000006'};
const hash=await bcrypt.hash('admin123',10);
const c=await pool.connect();
try{
 await c.query('BEGIN');
 await c.query(`INSERT INTO subscription_plans(code,name,price_monthly,max_outlets,max_users,features) VALUES
 ('STARTER','Starter',100000,1,3,'{"reports":true,"inventory":true}'::jsonb),
 ('BUSINESS','Business',200000,3,10,'{"reports":true,"inventory":true,"multiOutlet":true}'::jsonb),
 ('PRO','Pro',350000,10,50,'{"reports":true,"inventory":true,"multiOutlet":true,"prioritySupport":true}'::jsonb)
 ON CONFLICT(code) DO NOTHING`);
 await c.query(`INSERT INTO tenants(id,code,name,status) VALUES($1,'DEMO','ACIS Demo Store','active') ON CONFLICT(id) DO NOTHING`,[ids.tenant]);
 await c.query(`INSERT INTO outlets(id,tenant_id,code,name,address) VALUES($1,$2,'MAIN','Toko Utama','Jakarta, Indonesia') ON CONFLICT(id) DO NOTHING`,[ids.outlet,ids.tenant]);
 await c.query(`INSERT INTO users(id,name,username,email,password_hash,is_platform_admin) VALUES($1,'Administrator','admin','admin@acispos.local',$2,true)
 ON CONFLICT(username) DO UPDATE SET password_hash=EXCLUDED.password_hash`,[ids.admin,hash]);
 await c.query(`INSERT INTO roles(id,tenant_id,name,permissions) VALUES
 ($1,$4,'Administrator','["*"]'::jsonb),
 ($2,$4,'Kasir','["pos","sales.view","products.view"]'::jsonb),
 ($3,$4,'Manager','["dashboard","pos","products","inventory","purchases","sales","partners","reports"]'::jsonb)
 ON CONFLICT DO NOTHING`,[ids.roleAdmin,ids.roleKasir,ids.roleManager,ids.tenant]);
 await c.query(`INSERT INTO tenant_users(tenant_id,user_id,role_id,default_outlet_id) VALUES($1,$2,$3,$4) ON CONFLICT(tenant_id,user_id) DO UPDATE SET active=true`,[ids.tenant,ids.admin,ids.roleAdmin,ids.outlet]);
 await c.query(`INSERT INTO tenant_settings(tenant_id,company_name,address,receipt_footer) VALUES($1,'ACIS Demo Store','Jakarta, Indonesia','Terima kasih sudah berbelanja.') ON CONFLICT(tenant_id) DO NOTHING`,[ids.tenant]);
 const plan=(await c.query(`SELECT id FROM subscription_plans WHERE code='STARTER'`)).rows[0];
 await c.query(`INSERT INTO subscriptions(tenant_id,plan_id,status,started_at,expires_at)
 SELECT $1,$2,'trial',now(),now()+interval '14 days' WHERE NOT EXISTS(SELECT 1 FROM subscriptions WHERE tenant_id=$1)`,[ids.tenant,plan.id]);
 for(const name of ['Makanan','Minuman','Lainnya']) await c.query(`INSERT INTO categories(tenant_id,name) VALUES($1,$2) ON CONFLICT(tenant_id,name) DO NOTHING`,[ids.tenant,name]);
 for(const name of ['Pcs','Box','Botol']) await c.query(`INSERT INTO units(tenant_id,name) VALUES($1,$2) ON CONFLICT(tenant_id,name) DO NOTHING`,[ids.tenant,name]);
 const cats=Object.fromEntries((await c.query(`SELECT id,name FROM categories WHERE tenant_id=$1`,[ids.tenant])).rows.map(x=>[x.name,x.id]));
 const units=Object.fromEntries((await c.query(`SELECT id,name FROM units WHERE tenant_id=$1`,[ids.tenant])).rows.map(x=>[x.name,x.id]));
 const products=[
  ['AC001','899000001','Kopi Susu','Minuman','Botol',7000,12000,38,8],
  ['AC002','899000002','Air Mineral','Minuman','Botol',2500,5000,76,12],
  ['AC003','899000003','Roti Cokelat','Makanan','Pcs',5000,9000,21,6],
  ['AC004','899000004','Mie Goreng','Makanan','Pcs',4500,8500,5,7]
 ];
 for(const p of products){
   const r=await c.query(`INSERT INTO products(tenant_id,sku,barcode,name,category_id,unit_id,cost,price,min_stock)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT(tenant_id,sku) DO UPDATE SET name=EXCLUDED.name RETURNING id`,[ids.tenant,p[0],p[1],p[2],cats[p[3]],units[p[4]],p[5],p[6],p[8]]);
   const pid=r.rows[0].id;
   await c.query(`INSERT INTO stock_balances(tenant_id,outlet_id,product_id,quantity) VALUES($1,$2,$3,$4) ON CONFLICT(tenant_id,outlet_id,product_id) DO NOTHING`,[ids.tenant,ids.outlet,pid,p[7]]);
 }
 await c.query(`INSERT INTO partners(tenant_id,code,type,name) VALUES($1,'CUST-001','customer','Pelanggan Umum') ON CONFLICT(tenant_id,code) DO NOTHING`,[ids.tenant]);
 await c.query(`INSERT INTO partners(tenant_id,code,type,name) VALUES($1,'SUP-001','supplier','Supplier Utama') ON CONFLICT(tenant_id,code) DO NOTHING`,[ids.tenant]);
 await c.query('COMMIT');
 console.log('Seed demo SaaS selesai. Login: admin / admin123');
}catch(e){await c.query('ROLLBACK');throw e}finally{c.release();await pool.end()}
