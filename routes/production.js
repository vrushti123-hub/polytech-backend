const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/tasks', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM production_tasks');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
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
    res.status(500).json({ error: 'Server error' });
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
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
