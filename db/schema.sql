CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code varchar(40) NOT NULL UNIQUE,
  name varchar(160) NOT NULL,
  status varchar(30) NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS outlets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  code varchar(40) NOT NULL,
  name varchar(160) NOT NULL,
  address text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, code)
);

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(160) NOT NULL,
  username varchar(100) NOT NULL UNIQUE,
  email varchar(190),
  password_hash text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  is_platform_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name varchar(80) NOT NULL,
  permissions jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, name)
);

CREATE TABLE IF NOT EXISTS tenant_users (
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id uuid REFERENCES roles(id) ON DELETE SET NULL,
  default_outlet_id uuid REFERENCES outlets(id) ON DELETE SET NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(tenant_id, user_id)
);

CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code varchar(40) NOT NULL UNIQUE,
  name varchar(100) NOT NULL,
  price_monthly numeric(15,2) NOT NULL DEFAULT 0,
  max_outlets integer NOT NULL DEFAULT 1,
  max_users integer NOT NULL DEFAULT 3,
  features jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES subscription_plans(id),
  status varchar(30) NOT NULL DEFAULT 'trial',
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  grace_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant ON subscriptions(tenant_id, expires_at DESC);

CREATE TABLE IF NOT EXISTS tenant_settings (
  tenant_id uuid PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  company_name varchar(180) NOT NULL,
  address text NOT NULL DEFAULT '',
  phone varchar(80) NOT NULL DEFAULT '',
  email varchar(190) NOT NULL DEFAULT '',
  tax_rate numeric(8,2) NOT NULL DEFAULT 0,
  receipt_footer text NOT NULL DEFAULT 'Terima kasih sudah berbelanja.',
  currency varchar(10) NOT NULL DEFAULT 'IDR',
  low_stock_threshold numeric(15,3) NOT NULL DEFAULT 5,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name varchar(100) NOT NULL,
  active boolean NOT NULL DEFAULT true,
  UNIQUE(tenant_id, name)
);
CREATE TABLE IF NOT EXISTS units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name varchar(60) NOT NULL,
  active boolean NOT NULL DEFAULT true,
  UNIQUE(tenant_id, name)
);

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  sku varchar(100) NOT NULL,
  barcode varchar(160) NOT NULL DEFAULT '',
  name varchar(180) NOT NULL,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  unit_id uuid REFERENCES units(id) ON DELETE SET NULL,
  cost numeric(15,2) NOT NULL DEFAULT 0,
  price numeric(15,2) NOT NULL DEFAULT 0,
  min_stock numeric(15,3) NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, sku)
);
CREATE INDEX IF NOT EXISTS idx_products_tenant ON products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_search ON products(tenant_id, name, sku, barcode);

CREATE TABLE IF NOT EXISTS stock_balances (
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  outlet_id uuid NOT NULL REFERENCES outlets(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity numeric(15,3) NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(tenant_id, outlet_id, product_id)
);

CREATE TABLE IF NOT EXISTS partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  code varchar(80) NOT NULL,
  type varchar(20) NOT NULL CHECK(type IN ('customer','supplier')),
  name varchar(180) NOT NULL,
  phone varchar(80) NOT NULL DEFAULT '',
  email varchar(190) NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  points integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, code)
);
CREATE INDEX IF NOT EXISTS idx_partners_tenant_type ON partners(tenant_id, type);

CREATE TABLE IF NOT EXISTS sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  outlet_id uuid NOT NULL REFERENCES outlets(id),
  invoice varchar(100) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  cashier_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  cashier_name varchar(160) NOT NULL DEFAULT '',
  customer_id uuid REFERENCES partners(id) ON DELETE SET NULL,
  payment_method varchar(40) NOT NULL DEFAULT 'cash',
  subtotal numeric(15,2) NOT NULL DEFAULT 0,
  discount numeric(15,2) NOT NULL DEFAULT 0,
  total numeric(15,2) NOT NULL DEFAULT 0,
  paid numeric(15,2) NOT NULL DEFAULT 0,
  cost_total numeric(15,2) NOT NULL DEFAULT 0,
  points_earned integer NOT NULL DEFAULT 0,
  status varchar(30) NOT NULL DEFAULT 'posted',
  UNIQUE(tenant_id, invoice)
);
CREATE INDEX IF NOT EXISTS idx_sales_tenant_date ON sales(tenant_id, created_at DESC);

CREATE TABLE IF NOT EXISTS sale_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  sale_id uuid NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  sku varchar(100) NOT NULL DEFAULT '',
  name varchar(180) NOT NULL,
  qty numeric(15,3) NOT NULL,
  price numeric(15,2) NOT NULL,
  cost numeric(15,2) NOT NULL,
  subtotal numeric(15,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  outlet_id uuid NOT NULL REFERENCES outlets(id),
  number varchar(100) NOT NULL,
  supplier_id uuid REFERENCES partners(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  total numeric(15,2) NOT NULL DEFAULT 0,
  status varchar(30) NOT NULL DEFAULT 'posted',
  note text NOT NULL DEFAULT '',
  UNIQUE(tenant_id, number)
);
CREATE TABLE IF NOT EXISTS purchase_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  purchase_id uuid NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  name varchar(180) NOT NULL,
  qty numeric(15,3) NOT NULL,
  cost numeric(15,2) NOT NULL,
  subtotal numeric(15,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS stock_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  outlet_id uuid NOT NULL REFERENCES outlets(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  at timestamptz NOT NULL DEFAULT now(),
  type varchar(40) NOT NULL,
  qty_in numeric(15,3) NOT NULL DEFAULT 0,
  qty_out numeric(15,3) NOT NULL DEFAULT 0,
  balance numeric(15,3) NOT NULL DEFAULT 0,
  reference varchar(120) NOT NULL DEFAULT '',
  note text NOT NULL DEFAULT '',
  user_id uuid REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_stock_ledger_tenant_outlet_product ON stock_ledger(tenant_id, outlet_id, product_id, at DESC);

CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  outlet_id uuid REFERENCES outlets(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  category varchar(100) NOT NULL DEFAULT 'Operasional',
  description text NOT NULL DEFAULT '',
  amount numeric(15,2) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS held_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  outlet_id uuid NOT NULL REFERENCES outlets(id) ON DELETE CASCADE,
  cashier_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  outlet_id uuid REFERENCES outlets(id) ON DELETE SET NULL,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  username varchar(100) NOT NULL DEFAULT 'system',
  action varchar(80) NOT NULL,
  entity varchar(80) NOT NULL,
  detail text NOT NULL DEFAULT '',
  at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_tenant_date ON audit_logs(tenant_id, at DESC);


-- v2.1 additions: product photos, receipt configuration, Accurate Online integration
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_data text NOT NULL DEFAULT '';
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS receipt_header text NOT NULL DEFAULT '';
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS receipt_paper_width integer NOT NULL DEFAULT 80;
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS receipt_show_logo boolean NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  provider varchar(60) NOT NULL,
  status varchar(30) NOT NULL DEFAULT 'not_connected',
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_sync_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, provider)
);

-- v2.2 additions: cashier shifts, accounting foundation, export/sync tracking
ALTER TABLE sales ADD COLUMN IF NOT EXISTS shift_id uuid;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS accurate_invoice_id varchar(120);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS accurate_receipt_id varchar(120);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS accurate_synced_at timestamptz;

CREATE TABLE IF NOT EXISTS cashier_shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  outlet_id uuid NOT NULL REFERENCES outlets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  opened_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  opening_cash numeric(15,2) NOT NULL DEFAULT 0,
  closing_cash numeric(15,2),
  notes text NOT NULL DEFAULT '',
  status varchar(20) NOT NULL DEFAULT 'open' CHECK(status IN ('open','closed'))
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_open_shift_per_user_outlet ON cashier_shifts(tenant_id,outlet_id,user_id) WHERE status='open';
CREATE INDEX IF NOT EXISTS idx_shifts_tenant_outlet_date ON cashier_shifts(tenant_id,outlet_id,opened_at DESC);

CREATE TABLE IF NOT EXISTS chart_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  code varchar(30) NOT NULL,
  name varchar(160) NOT NULL,
  category varchar(30) NOT NULL CHECK(category IN ('asset','liability','equity','revenue','cogs','expense')),
  normal_balance varchar(10) NOT NULL CHECK(normal_balance IN ('debit','credit')),
  active boolean NOT NULL DEFAULT true,
  UNIQUE(tenant_id,code)
);

CREATE TABLE IF NOT EXISTS journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  outlet_id uuid REFERENCES outlets(id) ON DELETE SET NULL,
  entry_date date NOT NULL DEFAULT current_date,
  reference varchar(120) NOT NULL,
  description text NOT NULL DEFAULT '',
  source_type varchar(40) NOT NULL DEFAULT 'manual',
  source_id uuid,
  posted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id,source_type,source_id)
);
CREATE TABLE IF NOT EXISTS journal_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  journal_id uuid NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES chart_accounts(id),
  debit numeric(15,2) NOT NULL DEFAULT 0,
  credit numeric(15,2) NOT NULL DEFAULT 0,
  memo text NOT NULL DEFAULT '',
  CHECK (debit >= 0 AND credit >= 0),
  CHECK (NOT (debit > 0 AND credit > 0))
);
CREATE INDEX IF NOT EXISTS idx_journal_tenant_date ON journal_entries(tenant_id,entry_date,posted_at);

CREATE TABLE IF NOT EXISTS accurate_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  outlet_id uuid REFERENCES outlets(id) ON DELETE SET NULL,
  sale_id uuid REFERENCES sales(id) ON DELETE SET NULL,
  entity varchar(40) NOT NULL,
  local_reference varchar(120) NOT NULL DEFAULT '',
  remote_id varchar(120) NOT NULL DEFAULT '',
  status varchar(30) NOT NULL,
  message text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE integrations ADD COLUMN IF NOT EXISTS access_token text;
ALTER TABLE integrations ADD COLUMN IF NOT EXISTS refresh_token text;
ALTER TABLE integrations ADD COLUMN IF NOT EXISTS token_expires_at timestamptz;
ALTER TABLE integrations ADD COLUMN IF NOT EXISTS remote_database_id varchar(80);
ALTER TABLE integrations ADD COLUMN IF NOT EXISTS remote_database_alias varchar(180);
ALTER TABLE integrations ADD COLUMN IF NOT EXISTS remote_host text;
ALTER TABLE integrations ADD COLUMN IF NOT EXISTS remote_session_id text;
