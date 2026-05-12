const express = require('express');
const router = express.Router();
const pool = require('../db');

function netQty(entry) {
  return Number(entry.produced_qty || 0) - Number(entry.rejected_qty || 0) - Number(entry.mixed_color_qty || 0);
}

async function findFormulaBrand(client, brand, color) {
  const exact = await client.query(
    `SELECT upper(brand) AS brand
     FROM raw_material_formulas
     WHERE is_active = true
       AND upper(brand) = upper($1)
       AND upper(color) = upper($2)
     LIMIT 1`,
    [brand || '', color || '']
  );
  if (exact.rows.length > 0) return exact.rows[0].brand;

  const fallback = await client.query(
    `SELECT upper(brand) AS brand
     FROM raw_material_formulas
     WHERE is_active = true
       AND upper(brand) = 'POLYTECH'
       AND upper(color) = upper($1)
     LIMIT 1`,
    [color || '']
  );
  return fallback.rows.length > 0 ? fallback.rows[0].brand : null;
}

async function applyRawMaterialUsage(client, entry, mode) {
  const formulaBrand = await findFormulaBrand(client, entry.brand, entry.color);
  if (!formulaBrand) return;

  if (mode === 'deduct') {
    const shortage = await client.query(
      `SELECT string_agg(
         f.material_name || ' needs ' || f.quantity || ' ' || f.unit || ', available ' || COALESCE(rm.current_stock_kg, 0),
         '; '
       ) AS message
       FROM raw_material_formulas f
       LEFT JOIN raw_materials rm ON lower(rm.name) = lower(f.material_name)
       WHERE f.is_active = true
         AND upper(f.brand) = $1
         AND upper(f.color) = upper($2)
         AND (rm.id IS NULL OR COALESCE(rm.current_stock_kg, 0) < f.quantity::double precision)`,
      [formulaBrand, entry.color || '']
    );
    if (shortage.rows[0]?.message) {
      throw new Error(`Insufficient raw material for ${entry.color}: ${shortage.rows[0].message}`);
    }
  }

  const sign = mode === 'deduct' ? -1 : 1;
  await client.query(
    `UPDATE raw_materials rm
     SET current_stock_kg = current_stock_kg + ($1 * f.quantity::double precision)
     FROM raw_material_formulas f
     WHERE lower(rm.name) = lower(f.material_name)
       AND f.is_active = true
       AND upper(f.brand) = $2
       AND upper(f.color) = upper($3)`,
    [sign, formulaBrand, entry.color || '']
  );
}

async function refreshPendingStock(client, productId, brand, color) {
  const inv = await client.query(
    `SELECT total_produced, total_dispatched FROM inventory_items
     WHERE product_id = $1
       AND lower(brand) = lower($2)
       AND lower(color) = lower($3)`,
    [productId, brand, color]
  );
  const currentStock = inv.rows.length > 0
    ? Number(inv.rows[0].total_produced || 0) - Number(inv.rows[0].total_dispatched || 0)
    : 0;

  const pendingItems = await client.query(
    `SELECT oi.* FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     WHERE oi.product_id = $1
       AND lower(oi.brand) = lower($2)
       AND lower(oi.color) = lower($3)
       AND o.status NOT IN ('dispatched', 'cancelled')`,
    [productId, brand, color]
  );

  for (const item of pendingItems.rows) {
    const needed = Number(item.quantity || 0) - Number(item.dispatched_qty || 0);
    await client.query(
      `UPDATE order_items SET stock_available = $1 WHERE id = $2`,
      [currentStock >= needed, item.id]
    );
  }
}

async function adjustInventory(client, entry, deltaNet) {
  if (!deltaNet) return;

  const result = await client.query(
    `UPDATE inventory_items
     SET total_produced = total_produced + $1
     WHERE product_id = $2
       AND lower(brand) = lower($3)
       AND lower(color) = lower($4)`,
    [deltaNet, entry.product_id, entry.brand, entry.color]
  );

  if (result.rowCount === 0 && deltaNet > 0) {
    await client.query(
      `INSERT INTO inventory_items (id, product_id, product_name, brand, color, total_produced, total_dispatched)
       VALUES ($1, $2, $3, $4, $5, $6, 0)`,
      [`inv-${entry.product_id}-${entry.brand}-${entry.color}`, entry.product_id, entry.product_name, entry.brand, entry.color, deltaNet]
    );
  }

  await refreshPendingStock(client, entry.product_id, entry.brand, entry.color);
}

router.get('/tasks', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM production_tasks');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.post('/tasks', async (req, res) => {
  const { id, product_id, product_name, brand, color, required_qty, assigned_machine, status } = req.body;
  try {
    await pool.query(
      `INSERT INTO production_tasks (id, product_id, product_name, brand, color, required_qty, assigned_machine, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [id, product_id, product_name, brand, color, required_qty, assigned_machine || null, status || 'pending']
    );
    res.status(201).json({ message: 'Task created' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.patch('/tasks/:id', async (req, res) => {
  const { status, assigned_machine, is_completed } = req.body;
  try {
    await pool.query(
      `UPDATE production_tasks SET status = $1, assigned_machine = $2, is_completed = $3 WHERE id = $4`,
      [status, assigned_machine, is_completed, req.params.id]
    );
    res.json({ message: 'Task updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/entries', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM production_entries ORDER BY date DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/raw-check', async (req, res) => {
  const { brand, color } = req.query;
  try {
    let formulaBrand = null;
    const exactBrand = await pool.query(
      `SELECT upper(brand) AS brand
       FROM raw_material_formulas
       WHERE is_active = true
         AND upper(brand) = upper($1)
         AND upper(color) = upper($2)
       LIMIT 1`,
      [brand || '', color || '']
    );

    if (exactBrand.rows.length > 0) {
      formulaBrand = exactBrand.rows[0].brand;
    } else {
      const fallbackBrand = await pool.query(
        `SELECT upper(brand) AS brand
         FROM raw_material_formulas
         WHERE is_active = true
           AND upper(brand) = 'POLYTECH'
           AND upper(color) = upper($1)
         LIMIT 1`,
        [color || '']
      );
      if (fallbackBrand.rows.length > 0) {
        formulaBrand = fallbackBrand.rows[0].brand;
      }
    }

    if (!formulaBrand) {
      return res.json({
        ok: true,
        has_formula: false,
        requirements: [],
        shortages: [],
      });
    }

    const result = await pool.query(
      `SELECT
         rm.id AS material_id,
         f.material_name,
         f.quantity,
         f.unit,
         COALESCE(rm.current_stock_kg, 0) AS available_qty,
         (rm.id IS NULL OR COALESCE(rm.current_stock_kg, 0) < f.quantity::double precision) AS is_short
       FROM raw_material_formulas f
       LEFT JOIN raw_materials rm ON lower(rm.name) = lower(f.material_name)
       WHERE f.is_active = true
         AND upper(f.brand) = $1
         AND upper(f.color) = upper($2)
       ORDER BY f.material_name`,
      [formulaBrand, color || '']
    );

    const requirements = result.rows.map((row) => ({
      material_id: row.material_id,
      material_name: row.material_name,
      required_qty: Number(row.quantity),
      unit: row.unit,
      available_qty: Number(row.available_qty),
      is_short: row.is_short,
    }));
    const shortages = requirements.filter((row) => row.is_short);

    res.json({
      ok: shortages.length === 0,
      has_formula: true,
      formula_brand: formulaBrand,
      requirements,
      shortages,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.post('/entries', async (req, res) => {
  const { id, machine_number, product_id, product_name, brand, color, produced_qty, rejected_qty, mixed_color_qty, date } = req.body;
  try {
    await pool.query(
      `INSERT INTO production_entries (id, machine_number, product_id, product_name, brand, color, produced_qty, rejected_qty, mixed_color_qty, date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [id, machine_number, product_id, product_name, brand, color, produced_qty, rejected_qty || 0, mixed_color_qty || 0, date]
    );

    const net_qty = produced_qty - (rejected_qty || 0) - (mixed_color_qty || 0);
    const invResult = await pool.query(
      `UPDATE inventory_items
       SET total_produced = total_produced + $1
       WHERE product_id = $2
         AND lower(brand) = lower($3)
         AND lower(color) = lower($4)`,
      [net_qty, product_id, brand, color]
    );

    if (invResult.rowCount === 0) {
      await pool.query(
        `INSERT INTO inventory_items (id, product_id, product_name, brand, color, total_produced, total_dispatched)
         VALUES ($1, $2, $3, $4, $5, $6, 0)`,
        [`inv-${product_id}-${brand}-${color}`, product_id, product_name, brand, color, net_qty]
      );
    }

    const pendingItems = await pool.query(
      `SELECT oi.* FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE oi.product_id = $1
         AND lower(oi.brand) = lower($2)
         AND lower(oi.color) = lower($3)
         AND o.status NOT IN ('dispatched', 'cancelled')`,
      [product_id, brand, color]
    );

    if (pendingItems.rows.length > 0) {
      const inv = await pool.query(
        `SELECT total_produced, total_dispatched FROM inventory_items
         WHERE product_id = $1
           AND lower(brand) = lower($2)
           AND lower(color) = lower($3)`,
        [product_id, brand, color]
      );
      const currentStock = inv.rows.length > 0
        ? (inv.rows[0].total_produced - inv.rows[0].total_dispatched)
        : 0;

      for (const item of pendingItems.rows) {
        const needed = item.quantity - item.dispatched_qty;
        const available = currentStock >= needed;
        await pool.query(
          `UPDATE order_items SET stock_available = $1 WHERE id = $2`,
          [available, item.id]
        );
      }
    }

    res.status(201).json({ message: 'Entry added' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.patch('/entries/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    const current = await client.query(
      `SELECT * FROM production_entries WHERE id = $1`,
      [req.params.id]
    );
    if (current.rows.length === 0) {
      return res.status(404).json({ error: 'Production entry not found' });
    }

    const oldEntry = current.rows[0];
    const newEntry = {
      id: oldEntry.id,
      machine_number: req.body.machine_number ?? oldEntry.machine_number,
      product_id: req.body.product_id ?? oldEntry.product_id,
      product_name: req.body.product_name ?? oldEntry.product_name,
      brand: req.body.brand ?? oldEntry.brand,
      color: req.body.color ?? oldEntry.color,
      produced_qty: req.body.produced_qty ?? oldEntry.produced_qty,
      rejected_qty: req.body.rejected_qty ?? oldEntry.rejected_qty,
      mixed_color_qty: req.body.mixed_color_qty ?? oldEntry.mixed_color_qty,
      date: req.body.date ?? oldEntry.date,
    };

    if (netQty(newEntry) <= 0) {
      return res.status(400).json({ error: 'Net production must be greater than 0' });
    }

    await client.query('BEGIN');

    await applyRawMaterialUsage(client, oldEntry, 'reverse');
    await applyRawMaterialUsage(client, newEntry, 'deduct');

    await adjustInventory(client, oldEntry, -netQty(oldEntry));
    await client.query(
      `UPDATE production_entries
       SET machine_number = $1,
           product_id = $2,
           product_name = $3,
           brand = $4,
           color = $5,
           produced_qty = $6,
           rejected_qty = $7,
           mixed_color_qty = $8,
           date = $9
       WHERE id = $10`,
      [
        newEntry.machine_number,
        newEntry.product_id,
        newEntry.product_name,
        newEntry.brand,
        newEntry.color,
        newEntry.produced_qty,
        newEntry.rejected_qty || 0,
        newEntry.mixed_color_qty || 0,
        newEntry.date,
        req.params.id,
      ]
    );
    await adjustInventory(client, newEntry, netQty(newEntry));

    await client.query('COMMIT');
    res.json({ message: 'Entry updated' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: err.message || 'Server error' });
  } finally {
    client.release();
  }
});

router.delete('/entries/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    const current = await client.query(
      `SELECT * FROM production_entries WHERE id = $1`,
      [req.params.id]
    );
    if (current.rows.length === 0) {
      return res.status(404).json({ error: 'Production entry not found' });
    }

    const oldEntry = current.rows[0];

    await client.query('BEGIN');
    await applyRawMaterialUsage(client, oldEntry, 'reverse');
    await adjustInventory(client, oldEntry, -netQty(oldEntry));
    await client.query(`DELETE FROM production_entries WHERE id = $1`, [
      req.params.id,
    ]);
    await client.query('COMMIT');

    res.json({ message: 'Entry deleted' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: err.message || 'Server error' });
  } finally {
    client.release();
  }
});

module.exports = router;
