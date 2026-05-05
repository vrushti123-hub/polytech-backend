INSERT INTO raw_materials VALUES
  ('rm1',  'Rafia (Recycled Plastic)', 'Gupta Polymers',    8200, 3000),
  ('rm2',  'FC (Filler Component)',    'Shah Industries',   1800, 2000),
  ('rm3',  'FC Grade-2',               'Shah Industries',   2200, 1500),
  ('rm4',  'Moisture Absorber',        'Chem Solutions',     380,  400),
  ('rm5',  'Masterbatch Black',        'Colortech',          120,  100),
  ('rm6',  'Masterbatch Beige',        'Colortech',           85,  100),
  ('rm7',  'Masterbatch Red',          'Colortech',           60,  100),
  ('rm8',  'Masterbatch White',        'Colortech',          110,  100),
  ('rm9',  'Masterbatch Yellow',       'Colortech',           45,   80),
  ('rm10', 'Stabilizer UV',            'Chem Solutions',     220,  200),
  ('rm11', 'Antioxidant Additive',     'Chem Solutions',     180,  150),
  ('rm12', 'HDPE Granules',            'Reliance Polymers', 5500, 2000),
  ('rm13', 'PP Homopolymer',           'Reliance Polymers', 3200, 1500),
  ('rm14', 'Impact Modifier',          'Gupta Polymers',     650,  500);

INSERT INTO products VALUES
  ('p001', 'Polo Chair (Black)',        'Chairs',        'Polytech', '{Black}',  '', TRUE),
  ('p002', 'Polo Chair (Beige)',        'Chairs',        'Polytech', '{Beige}',  '', TRUE),
  ('p003', 'Executive Chair (Black)',   'Chairs',        'Polish',   '{Black}',  '', TRUE),
  ('p004', 'Executive Chair (Beige)',   'Chairs',        'Polish',   '{Beige}',  '', TRUE),
  ('p005', 'Budget Chair (Black)',      'Chairs',        'Polytech', '{Black}',  '', TRUE),
  ('p006', 'Budget Chair (Beige)',      'Chairs',        'Polytech', '{Beige}',  '', TRUE),
  ('p007', 'Kids Chair (Yellow)',       'Baby Products', 'Polytech', '{Yellow}', '', TRUE),
  ('p008', 'Kids Chair (Red)',          'Baby Products', 'Polytech', '{Red}',    '', TRUE),
  ('p009', 'Baby Stool (Pink)',         'Baby Products', 'Polytech', '{Pink}',   '', TRUE),
  ('p010', 'Center Table 3ft (Black)', 'Center Tables', 'Polish',   '{Black}',  '', TRUE),
  ('p011', 'Center Table 4ft (Beige)', 'Center Tables', 'Polish',   '{Beige}',  '', TRUE),
  ('p012', 'Dining Table 4 Seater',    'Dining Tables', 'Polytech', '{Brown}',  '', TRUE),
  ('p013', 'Dining Table 6 Seater',    'Dining Tables', 'Polytech', '{Coffee}', '', TRUE),
  ('p014', 'Round Stool (Black)',       'Stools',        'Polytech', '{Black}',  '', TRUE),
  ('p015', 'Square Stool (Beige)',      'Stools',        'Polytech', '{Beige}',  '', TRUE);

INSERT INTO inventory_items VALUES
  ('inv001', 'p001', 'Polo Chair (Black)',        'Polytech', 'Black',  1200, 800),
  ('inv002', 'p002', 'Polo Chair (Beige)',        'Polytech', 'Beige',  1000, 600),
  ('inv003', 'p003', 'Executive Chair (Black)',   'Polish',   'Black',   800, 500),
  ('inv004', 'p004', 'Executive Chair (Beige)',   'Polish',   'Beige',   600, 400),
  ('inv005', 'p005', 'Budget Chair (Black)',      'Polytech', 'Black',  1500, 900),
  ('inv006', 'p006', 'Budget Chair (Beige)',      'Polytech', 'Beige',  1100, 700),
  ('inv007', 'p007', 'Kids Chair (Yellow)',       'Polytech', 'Yellow',  500, 300),
  ('inv008', 'p008', 'Kids Chair (Red)',          'Polytech', 'Red',     400, 250),
  ('inv009', 'p009', 'Baby Stool (Pink)',         'Polytech', 'Pink',    300, 200),
  ('inv010', 'p010', 'Center Table 3ft (Black)', 'Polish',   'Black',   200, 150),
  ('inv011', 'p011', 'Center Table 4ft (Beige)', 'Polish',   'Beige',   150, 100),
  ('inv012', 'p012', 'Dining Table 4 Seater',    'Polytech', 'Brown',   100,  80),
  ('inv013', 'p013', 'Dining Table 6 Seater',    'Polytech', 'Coffee',   80,  60),
  ('inv014', 'p014', 'Round Stool (Black)',       'Polytech', 'Black',   600, 400),
  ('inv015', 'p015', 'Square Stool (Beige)',      'Polytech', 'Beige',   500, 350);

INSERT INTO orders VALUES
  ('ORD-001', 'd1', 'Ravi Enterprises - Nashik',     'Nashik',     NOW() - INTERVAL '2 hours',  'pending',    NULL),
  ('ORD-002', 'd2', 'Shree Traders - Pune',          'Pune',       NOW() - INTERVAL '5 hours',  'approved',   NULL),
  ('ORD-003', 'd3', 'Ganesh Wholesale - Aurangabad', 'Aurangabad', NOW() - INTERVAL '8 hours',  'dispatched', NULL),
  ('ORD-004', 'd1', 'Ravi Enterprises - Nashik',     'Nashik',     NOW() - INTERVAL '1 day',    'dispatched', 'Urgent delivery'),
  ('ORD-005', 'd2', 'Shree Traders - Pune',          'Pune',       NOW() - INTERVAL '2 days',   'pending',    NULL);

INSERT INTO order_items VALUES
  ('ORD-001-p001', 'ORD-001', 'p001', 'Polo Chair (Black)',       'Polytech', 'Black',  120, 0,   TRUE,  '{}'),
  ('ORD-001-p002', 'ORD-001', 'p002', 'Polo Chair (Beige)',       'Polytech', 'Beige',   80, 0,   TRUE,  '{}'),
  ('ORD-002-p003', 'ORD-002', 'p003', 'Executive Chair (Black)',  'Polish',   'Black',   50, 0,   TRUE,  '{}'),
  ('ORD-003-p007', 'ORD-003', 'p007', 'Kids Chair (Yellow)',      'Polytech', 'Yellow',  35, 35,  TRUE,  '{35}'),
  ('ORD-004-p005', 'ORD-004', 'p005', 'Budget Chair (Black)',     'Polytech', 'Black',  200, 200, TRUE,  '{200}'),
  ('ORD-005-p010', 'ORD-005', 'p010', 'Center Table 3ft (Black)', 'Polish',  'Black',   30, 0,   FALSE, '{}');

INSERT INTO production_tasks VALUES
  ('T001', 'p001', 'Polo Chair (Black)',       'Polytech', 'Black',  1000, NULL, FALSE, 'pending'),
  ('T002', 'p007', 'Kids Chair (Yellow)',      'Polytech', 'Yellow',  500,    7, FALSE, 'in_progress'),
  ('T003', 'p010', 'Center Table 3ft (Black)','Polish',   'Black',   200, NULL, FALSE, 'pending'),
  ('T004', 'p004', 'Executive Chair (Beige)', 'Polish',   'Beige',   800, NULL, FALSE, 'pending');

INSERT INTO production_entries VALUES
  ('PE001', 3,  'p001', 'Polo Chair (Black)',   'Polytech', 'Black',  480, 12, 0, NOW()),
  ('PE002', 7,  'p007', 'Kids Chair (Yellow)',  'Polytech', 'Yellow', 250,  8, 2, NOW()),
  ('PE003', 14, 'p005', 'Budget Chair (Black)', 'Polytech', 'Black',  610, 18, 0, NOW()),
  ('PE004', 22, 'p006', 'Budget Chair (Beige)', 'Polytech', 'Beige',  420, 15, 5, NOW());
