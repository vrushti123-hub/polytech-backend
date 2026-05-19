const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/orders
router.get('/', async (req, res) => {
  try {
    const orders = await pool.query('SELECT * FROM orders ORDER BY order_date DESC');
    for (let order of orders.rows) {
      const items = await pool.query(
        'SELECT * FROM order_items WHERE order_id = $1',
        [order.id]
      );
      order.items = items.rows;
    }
    res.json(orders.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/orders/:id
router.get('/:id', async (req, res) => {
  try {
    const order = await pool.query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
    if (order.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    const items = await pool.query(
      'SELECT * FROM order_items WHERE order_id = $1',
      [req.params.id]
    );
    order.rows[0].items = items.rows;
    res.json(order.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/orders
router.post('/', async (req, res) => {
  console.log('Order received:', req.body);
  const { id, distributor_id, distributor_name, distributor_city, order_date, status, remarks, items } = req.body;
  try {
    await pool.query(
      `INSERT INTO orders (id, distributor_id, distributor_name, distributor_city, order_date, status, remarks)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, distributor_id, distributor_name, distributor_city, order_date, status, remarks]
    );
    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      await pool.query(
        `INSERT INTO order_items (id, order_id, product_id, product_name, brand, color, quantity, dispatched_qty, stock_available, dispatch_history)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          `${id}-${item.product_id}-${item.color}-${index}`,
          id,
          item.product_id,
          item.product_name,
          item.brand,
          item.color,
          item.quantity,
          item.dispatched_qty || 0,
          item.stock_available || false,
          item.dispatch_history || []
        ]
      );
    }
    res.status(201).json({ message: 'Order created successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/orders/:id/status
router.patch('/:id/status', async (req, res) => {
  const { status } = req.body;
  try {
    await pool.query('UPDATE orders SET status = $1 WHERE id = $2', [status, req.params.id]);
    res.json({ message: 'Status updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/orders/:id/check-stock
router.patch('/:id/check-stock', async (req, res) => {
  try {
    const order = await pool.query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
    if (order.rows.length === 0) return res.status(404).json({ error: 'Order not found' });

    const items = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [req.params.id]);

    for (const item of items.rows) {
      const inv = await pool.query(
        `SELECT * FROM inventory_items
         WHERE product_id = $1
           AND lower(brand) = lower($2)
           AND lower(color) = lower($3)`,
        [item.product_id, item.brand, item.color]
      );
      const stock = inv.rows.length > 0
        ? (inv.rows[0].total_produced - inv.rows[0].total_dispatched)
        : 0;
      const available = stock >= (item.quantity - item.dispatched_qty);
      await pool.query(
        'UPDATE order_items SET stock_available = $1 WHERE id = $2',
        [available, item.id]
      );
    }

    res.json({ message: 'Stock checked and updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
