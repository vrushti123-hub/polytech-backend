-- USERS
CREATE TABLE users (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  mobile      TEXT NOT NULL,
  role        TEXT NOT NULL,
  username    TEXT UNIQUE NOT NULL,
  password    TEXT NOT NULL
);

-- PRODUCTS
CREATE TABLE products (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  category    TEXT NOT NULL,
  brand       TEXT NOT NULL,
  colors      TEXT[] NOT NULL,
  image_url   TEXT DEFAULT '',
  is_active   BOOLEAN DEFAULT TRUE
);

-- INVENTORY
CREATE TABLE inventory_items (
  id                TEXT PRIMARY KEY,
  product_id        TEXT REFERENCES products(id),
  product_name      TEXT NOT NULL,
  brand             TEXT NOT NULL,
  color             TEXT NOT NULL,
  total_produced    INT DEFAULT 0,
  total_dispatched  INT DEFAULT 0
);

-- ORDERS
CREATE TABLE orders (
  id                 TEXT PRIMARY KEY,
  distributor_id     TEXT NOT NULL,
  distributor_name   TEXT NOT NULL,
  distributor_city   TEXT NOT NULL,
  order_date         TIMESTAMP NOT NULL,
  status             TEXT NOT NULL,
  remarks            TEXT
);

-- ORDER ITEMS
CREATE TABLE order_items (
  id                TEXT PRIMARY KEY,
  order_id          TEXT REFERENCES orders(id),
  product_id        TEXT NOT NULL,
  product_name      TEXT NOT NULL,
  brand             TEXT NOT NULL,
  color             TEXT NOT NULL,
  quantity          INT NOT NULL,
  dispatched_qty    INT DEFAULT 0,
  stock_available   BOOLEAN DEFAULT FALSE,
  dispatch_history  INT[] DEFAULT '{}'
);

-- PRODUCTION TASKS
CREATE TABLE production_tasks (
  id               TEXT PRIMARY KEY,
  product_id       TEXT NOT NULL,
  product_name     TEXT NOT NULL,
  brand            TEXT NOT NULL,
  color            TEXT NOT NULL,
  required_qty     INT NOT NULL,
  assigned_machine INT,
  is_completed     BOOLEAN DEFAULT FALSE,
  status           TEXT DEFAULT 'pending'
);

-- PRODUCTION ENTRIES
CREATE TABLE production_entries (
  id               TEXT PRIMARY KEY,
  machine_number   INT NOT NULL,
  product_id       TEXT NOT NULL,
  product_name     TEXT NOT NULL,
  brand            TEXT NOT NULL,
  color            TEXT NOT NULL,
  produced_qty     INT NOT NULL,
  rejected_qty     INT DEFAULT 0,
  mixed_color_qty  INT DEFAULT 0,
  date             TIMESTAMP NOT NULL
);

-- RAW MATERIALS
CREATE TABLE raw_materials (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  supplier          TEXT NOT NULL,
  current_stock_kg  FLOAT NOT NULL,
  minimum_stock_kg  FLOAT NOT NULL
);

-- GRN ENTRIES
CREATE TABLE grn_entries (
  id              TEXT PRIMARY KEY,
  material_id     TEXT REFERENCES raw_materials(id),
  material_name   TEXT NOT NULL,
  supplier        TEXT NOT NULL,
  num_bags        INT NOT NULL,
  weight_per_bag  FLOAT NOT NULL,
  date            TIMESTAMP NOT NULL
);

-- CHALLANS
CREATE TABLE challans (
  id                 TEXT PRIMARY KEY,
  order_id           TEXT REFERENCES orders(id),
  distributor_name   TEXT NOT NULL,
  distributor_city   TEXT NOT NULL,
  vehicle_number     TEXT NOT NULL,
  driver_name        TEXT NOT NULL,
  driver_phone       TEXT NOT NULL,
  dispatch_date      TIMESTAMP NOT NULL,
  truck_photo_url    TEXT
);

-- CHALLAN ITEMS
CREATE TABLE challan_items (
  id           TEXT PRIMARY KEY,
  challan_id   TEXT REFERENCES challans(id),
  product_id   TEXT NOT NULL,
  product_name TEXT NOT NULL,
  brand        TEXT NOT NULL,
  color        TEXT NOT NULL,
  quantity     INT NOT NULL
);

-- SEED USERS
INSERT INTO users VALUES
  ('u1', 'Sagar Mandhan',                 '9876500001', 'owner',       'owner',             'owner123'),
  ('u2', 'Wasim Khan',                    '9876500002', 'dispatch',    'dispatch',          'dispatch123'),
  ('u3', 'Ramesh Supervisor',             '9876500003', 'supervisor',  'supervisor',        'super123'),
  ('u4', 'Mixing Operator',               '9876500004', 'operator',    'operator',          'oper123'),
  ('d1', 'Ravi Enterprises - Nashik',     '9876501001', 'distributor', 'ravi.nashik',       'dist123'),
  ('d2', 'Shree Traders - Pune',          '9876501002', 'distributor', 'shree.pune',        'dist123'),
  ('d3', 'Ganesh Wholesale - Aurangabad', '9876501003', 'distributor', 'ganesh.aurangabad', 'dist123');