import express from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';

const __filename=fileURLToPath(import.meta.url), __dirname=path.dirname(__filename);
const PORT=Number(process.env.PORT||3000);
const DATA_DIR=path.resolve(process.env.DATA_DIR||path.join(__dirname,'data'));
const DB_FILE=path.join(DATA_DIR,'acis-pos.json');
const JWT_SECRET=process.env.JWT_SECRET||'acis-pos-development-secret-change-me';
const APP_NAME=process.env.APP_NAME||'ACIS POS';
fs.mkdirSync(DATA_DIR,{recursive:true});

const now=()=>new Date().toISOString();
const uid=(prefix='id')=>`${prefix}_${crypto.randomUUID()}`;
const rupiah=n=>Number(n||0);

function seedDB(){
  const adminHash=bcrypt.hashSync('admin123',10);
  return {
    meta:{version:1,createdAt:now()},
    settings:{companyName:'ACIS Demo Store',address:'Jakarta, Indonesia',phone:'',email:'',taxRate:0,receiptFooter:'Terima kasih sudah berbelanja.',currency:'IDR',lowStockThreshold:5},
    users:[{id:'u_admin',name:'Administrator',username:'admin',passwordHash:adminHash,role:'Administrator',active:true,createdAt:now()}],
    roles:[{id:'r_admin',name:'Administrator',permissions:['*']},{id:'r_cashier',name:'Kasir',permissions:['pos','sales.view','products.view']},{id:'r_manager',name:'Manager',permissions:['dashboard','pos','products','inventory','purchases','sales','partners','reports']}],
    categories:[{id:'cat_food',name:'Makanan'},{id:'cat_drink',name:'Minuman'},{id:'cat_other',name:'Lainnya'}],
    units:[{id:'unit_pcs',name:'Pcs'},{id:'unit_box',name:'Box'},{id:'unit_btl',name:'Botol'}],
    warehouses:[{id:'wh_main',name:'Gudang Utama',code:'MAIN',active:true}],
    products:[
      {id:'p1',sku:'AC001',barcode:'899000001',name:'Kopi Susu',categoryId:'cat_drink',unitId:'unit_btl',cost:7000,price:12000,stock:38,minStock:8,active:true},
      {id:'p2',sku:'AC002',barcode:'899000002',name:'Air Mineral',categoryId:'cat_drink',unitId:'unit_btl',cost:2500,price:5000,stock:76,minStock:12,active:true},
      {id:'p3',sku:'AC003',barcode:'899000003',name:'Roti Cokelat',categoryId:'cat_food',unitId:'unit_pcs',cost:5000,price:9000,stock:21,minStock:6,active:true},
      {id:'p4',sku:'AC004',barcode:'899000004',name:'Mie Goreng',categoryId:'cat_food',unitId:'unit_pcs',cost:4500,price:8500,stock:5,minStock:7,active:true}
    ],
    partners:[
      {id:'c1',code:'CUST-001',type:'customer',name:'Pelanggan Umum',phone:'',email:'',address:'',points:0},
      {id:'s1',code:'SUP-001',type:'supplier',name:'Supplier Utama',phone:'',email:'',address:'',points:0}
    ],
    sales:[],purchases:[],stockLedger:[],expenses:[],promotions:[],heldSales:[],shifts:[],audit:[],departments:[],projects:[]
  }
}

let db;
function load(){
  if(!fs.existsSync(DB_FILE)){db=seedDB();save();}
  else {try{db=JSON.parse(fs.readFileSync(DB_FILE,'utf8'));}catch{db=seedDB();save();}}
  for(const k of ['sales','purchases','stockLedger','expenses','promotions','heldSales','shifts','audit','departments','projects']) if(!Array.isArray(db[k])) db[k]=[];
}
function save(){const tmp=DB_FILE+'.tmp';fs.writeFileSync(tmp,JSON.stringify(db,null,2));fs.renameSync(tmp,DB_FILE);}
function audit(user,action,entity,detail=''){db.audit.unshift({id:uid('aud'),at:now(),user:user?.username||'system',action,entity,detail});db.audit=db.audit.slice(0,1000);save();}
load();

const app=express();
app.use(express.json({limit:'2mb'}));
app.use(express.static(path.join(__dirname,'public')));

function auth(req,res,next){
  try{const t=(req.headers.authorization||'').replace(/^Bearer\s+/i,'');const p=jwt.verify(t,JWT_SECRET);const u=db.users.find(x=>x.id===p.sub&&x.active!==false);if(!u) throw 0;req.user=u;next();}
  catch{return res.status(401).json({error:'Sesi tidak valid. Silakan login kembali.'});}
}
const safeUser=u=>({id:u.id,name:u.name,username:u.username,role:u.role,active:u.active,createdAt:u.createdAt});

app.get('/api/health',(req,res)=>res.json({status:'ok',app:APP_NAME,version:'1.0.0',time:now()}));
app.post('/api/login',(req,res)=>{const {username,password}=req.body||{};const u=db.users.find(x=>x.username===username&&x.active!==false);if(!u||!bcrypt.compareSync(String(password||''),u.passwordHash)) return res.status(401).json({error:'Username atau password salah.'});const token=jwt.sign({sub:u.id,role:u.role},JWT_SECRET,{expiresIn:'12h'});res.json({token,user:safeUser(u)});});
app.get('/api/me',auth,(req,res)=>res.json({user:safeUser(req.user)}));

app.get('/api/dashboard',auth,(req,res)=>{
  const today=new Date().toISOString().slice(0,10);const month=today.slice(0,7);
  const todaySales=db.sales.filter(s=>s.createdAt.slice(0,10)===today);
  const monthSales=db.sales.filter(s=>s.createdAt.slice(0,7)===month);
  const totalToday=todaySales.reduce((a,b)=>a+b.total,0); const totalMonth=monthSales.reduce((a,b)=>a+b.total,0);
  const low=db.products.filter(p=>p.active!==false&&p.stock<=Number(p.minStock||db.settings.lowStockThreshold||5));
  const recent=[...db.sales].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0,8);
  const daily=[];for(let i=6;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const key=d.toISOString().slice(0,10);daily.push({date:key,total:db.sales.filter(s=>s.createdAt.slice(0,10)===key).reduce((a,b)=>a+b.total,0)});}
  res.json({totalToday,transactionsToday:todaySales.length,totalMonth,products:db.products.filter(p=>p.active!==false).length,lowStock:low,recent,daily});
});

app.get('/api/master',auth,(req,res)=>res.json({categories:db.categories,units:db.units,warehouses:db.warehouses,roles:db.roles}));
app.get('/api/products',auth,(req,res)=>{let rows=db.products;const q=String(req.query.q||'').toLowerCase();if(q)rows=rows.filter(p=>[p.sku,p.barcode,p.name].some(v=>String(v||'').toLowerCase().includes(q)));res.json({items:rows});});
app.post('/api/products',auth,(req,res)=>{const b=req.body||{};if(!b.name||!b.sku)return res.status(400).json({error:'Nama dan SKU wajib diisi.'});if(db.products.some(p=>p.sku===b.sku))return res.status(409).json({error:'SKU sudah digunakan.'});const p={id:uid('prd'),sku:b.sku,barcode:b.barcode||'',name:b.name,categoryId:b.categoryId||'',unitId:b.unitId||'',cost:rupiah(b.cost),price:rupiah(b.price),stock:rupiah(b.stock),minStock:rupiah(b.minStock),active:b.active!==false};db.products.unshift(p);if(p.stock)db.stockLedger.unshift({id:uid('stk'),at:now(),productId:p.id,type:'opening',qtyIn:p.stock,qtyOut:0,balance:p.stock,reference:'OPENING',note:'Stok awal'});audit(req.user,'CREATE','product',p.sku);res.json(p);});
app.put('/api/products/:id',auth,(req,res)=>{const p=db.products.find(x=>x.id===req.params.id);if(!p)return res.status(404).json({error:'Produk tidak ditemukan.'});const old=p.stock;Object.assign(p,{...req.body,id:p.id,stock:rupiah(req.body.stock??p.stock),cost:rupiah(req.body.cost??p.cost),price:rupiah(req.body.price??p.price),minStock:rupiah(req.body.minStock??p.minStock)});if(old!==p.stock)db.stockLedger.unshift({id:uid('stk'),at:now(),productId:p.id,type:'adjustment',qtyIn:Math.max(0,p.stock-old),qtyOut:Math.max(0,old-p.stock),balance:p.stock,reference:'MANUAL',note:'Edit stok manual'});audit(req.user,'UPDATE','product',p.sku);res.json(p);});
app.delete('/api/products/:id',auth,(req,res)=>{const p=db.products.find(x=>x.id===req.params.id);if(!p)return res.status(404).json({error:'Produk tidak ditemukan.'});p.active=false;audit(req.user,'DEACTIVATE','product',p.sku);res.json({ok:true});});

app.get('/api/partners',auth,(req,res)=>{let rows=db.partners;const t=req.query.type;if(t)rows=rows.filter(x=>x.type===t);res.json({items:rows});});
app.post('/api/partners',auth,(req,res)=>{const b=req.body||{};const x={id:uid('ptn'),code:b.code||`PTN-${Date.now()}`,type:b.type||'customer',name:b.name||'Tanpa Nama',phone:b.phone||'',email:b.email||'',address:b.address||'',points:0};db.partners.unshift(x);audit(req.user,'CREATE','partner',x.code);res.json(x);});
app.put('/api/partners/:id',auth,(req,res)=>{const x=db.partners.find(p=>p.id===req.params.id);if(!x)return res.status(404).json({error:'Partner tidak ditemukan.'});Object.assign(x,{...req.body,id:x.id});audit(req.user,'UPDATE','partner',x.code);res.json(x);});

app.get('/api/stock-ledger',auth,(req,res)=>{let rows=db.stockLedger;if(req.query.productId)rows=rows.filter(x=>x.productId===req.query.productId);res.json({items:rows.slice(0,1000)});});
app.post('/api/stock-adjustments',auth,(req,res)=>{const {productId,quantity,note}=req.body||{};const p=db.products.find(x=>x.id===productId);if(!p)return res.status(404).json({error:'Produk tidak ditemukan.'});const q=Number(quantity||0);p.stock+=q;if(p.stock<0)return res.status(400).json({error:'Stok tidak boleh negatif.'});db.stockLedger.unshift({id:uid('stk'),at:now(),productId:p.id,type:'adjustment',qtyIn:q>0?q:0,qtyOut:q<0?-q:0,balance:p.stock,reference:'ADJ-'+Date.now(),note:note||'Penyesuaian stok'});audit(req.user,'ADJUST','stock',`${p.sku} ${q}`);res.json(p);});

app.get('/api/purchases',auth,(req,res)=>res.json({items:db.purchases.slice(0,500)}));
app.post('/api/purchases',auth,(req,res)=>{const b=req.body||{};if(!Array.isArray(b.items)||!b.items.length)return res.status(400).json({error:'Item pembelian kosong.'});const po={id:uid('pur'),number:`PUR-${new Date().toISOString().slice(0,10).replaceAll('-','')}-${String(db.purchases.length+1).padStart(4,'0')}`,supplierId:b.supplierId||'',createdAt:now(),items:[],total:0,status:'posted',note:b.note||''};for(const it of b.items){const p=db.products.find(x=>x.id===it.productId);if(!p)continue;const qty=Number(it.qty||0),cost=Number(it.cost??p.cost);p.stock+=qty;p.cost=cost;po.items.push({productId:p.id,name:p.name,qty,cost,subtotal:qty*cost});po.total+=qty*cost;db.stockLedger.unshift({id:uid('stk'),at:po.createdAt,productId:p.id,type:'purchase',qtyIn:qty,qtyOut:0,balance:p.stock,reference:po.number,note:'Pembelian'});}db.purchases.unshift(po);audit(req.user,'CREATE','purchase',po.number);res.json(po);});

app.get('/api/sales',auth,(req,res)=>res.json({items:db.sales.slice(0,500)}));
app.post('/api/pos/checkout',auth,(req,res)=>{const b=req.body||{};if(!Array.isArray(b.items)||!b.items.length)return res.status(400).json({error:'Keranjang kosong.'});const sale={id:uid('sale'),invoice:`INV-${new Date().toISOString().slice(0,10).replaceAll('-','')}-${String(db.sales.length+1).padStart(5,'0')}`,createdAt:now(),cashier:req.user.name,customerId:b.customerId||'',paymentMethod:b.paymentMethod||'cash',paid:Number(b.paid||0),items:[],subtotal:0,discount:Number(b.discount||0),total:0,costTotal:0};for(const it of b.items){const p=db.products.find(x=>x.id===it.productId&&x.active!==false);if(!p)return res.status(400).json({error:'Produk pada keranjang tidak valid.'});const qty=Number(it.qty||0);if(qty<=0||p.stock<qty)return res.status(400).json({error:`Stok ${p.name} tidak cukup.`});const price=Number(it.price??p.price);p.stock-=qty;sale.items.push({productId:p.id,sku:p.sku,name:p.name,qty,price,cost:p.cost,subtotal:qty*price});sale.subtotal+=qty*price;sale.costTotal+=qty*p.cost;db.stockLedger.unshift({id:uid('stk'),at:sale.createdAt,productId:p.id,type:'sale',qtyIn:0,qtyOut:qty,balance:p.stock,reference:sale.invoice,note:'Penjualan POS'});}sale.total=Math.max(0,sale.subtotal-sale.discount);if(sale.paymentMethod==='cash'&&sale.paid<sale.total)return res.status(400).json({error:'Uang bayar kurang dari total.'});const cust=db.partners.find(x=>x.id===sale.customerId&&x.type==='customer');if(cust){const earned=Math.floor(sale.total/10000);cust.points=(cust.points||0)+earned;sale.pointsEarned=earned;}db.sales.unshift(sale);audit(req.user,'CHECKOUT','sale',sale.invoice);res.json(sale);});
app.post('/api/pos/hold',auth,(req,res)=>{const h={id:uid('hold'),createdAt:now(),cashier:req.user.name,...req.body};db.heldSales.unshift(h);save();res.json(h);});
app.get('/api/pos/held',auth,(req,res)=>res.json({items:db.heldSales}));
app.delete('/api/pos/held/:id',auth,(req,res)=>{db.heldSales=db.heldSales.filter(x=>x.id!==req.params.id);save();res.json({ok:true});});

app.get('/api/expenses',auth,(req,res)=>res.json({items:db.expenses.slice(0,500)}));
app.post('/api/expenses',auth,(req,res)=>{const x={id:uid('exp'),createdAt:now(),category:req.body.category||'Operasional',description:req.body.description||'',amount:Number(req.body.amount||0)};db.expenses.unshift(x);audit(req.user,'CREATE','expense',x.description);res.json(x);});
app.get('/api/reports/summary',auth,(req,res)=>{const from=String(req.query.from||'0000-00-00'),to=String(req.query.to||'9999-99-99');const sales=db.sales.filter(x=>{const d=x.createdAt.slice(0,10);return d>=from&&d<=to});const expenses=db.expenses.filter(x=>{const d=x.createdAt.slice(0,10);return d>=from&&d<=to});const revenue=sales.reduce((a,b)=>a+b.total,0),cogs=sales.reduce((a,b)=>a+b.costTotal,0),expense=expenses.reduce((a,b)=>a+b.amount,0);const byProduct={};for(const s of sales)for(const i of s.items){byProduct[i.productId]??={name:i.name,qty:0,revenue:0};byProduct[i.productId].qty+=i.qty;byProduct[i.productId].revenue+=i.subtotal;}res.json({revenue,cogs,grossProfit:revenue-cogs,expenses:expense,netProfit:revenue-cogs-expense,transactions:sales.length,topProducts:Object.values(byProduct).sort((a,b)=>b.qty-a.qty).slice(0,10),sales});});

app.get('/api/users',auth,(req,res)=>res.json({items:db.users.map(safeUser)}));
app.post('/api/users',auth,(req,res)=>{const b=req.body||{};if(db.users.some(x=>x.username===b.username))return res.status(409).json({error:'Username sudah digunakan.'});const u={id:uid('usr'),name:b.name||b.username,username:b.username,passwordHash:bcrypt.hashSync(b.password||'123456',10),role:b.role||'Kasir',active:true,createdAt:now()};db.users.push(u);audit(req.user,'CREATE','user',u.username);res.json(safeUser(u));});
app.put('/api/users/:id',auth,(req,res)=>{const u=db.users.find(x=>x.id===req.params.id);if(!u)return res.status(404).json({error:'User tidak ditemukan.'});u.name=req.body.name??u.name;u.role=req.body.role??u.role;u.active=req.body.active??u.active;if(req.body.password)u.passwordHash=bcrypt.hashSync(req.body.password,10);audit(req.user,'UPDATE','user',u.username);res.json(safeUser(u));});
app.get('/api/settings',auth,(req,res)=>res.json(db.settings));
app.put('/api/settings',auth,(req,res)=>{db.settings={...db.settings,...req.body};audit(req.user,'UPDATE','settings','company');res.json(db.settings);});
app.get('/api/audit',auth,(req,res)=>res.json({items:db.audit.slice(0,300)}));

app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'public','index.html')));
app.listen(PORT,'0.0.0.0',()=>console.log(`${APP_NAME} running on port ${PORT}`));
