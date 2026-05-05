const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/inventory
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM inventory_items');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/inventory
router.post('/', async (req, res) => {
  const { id, product_id, product_name, brand, color, total_produced, total_dispatched } = req.body;
  try {
    await pool.query(
      `INSERT INTO inventory_items (id, product_id, product_name, brand, color, total_produced, total_dispatched)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, product_id, product_name, brand, color, total_produced || 0, total_dispatched || 0]
    );
    res.status(201).json({ message: 'Inventory item added' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/inventory/:id
router.patch('/:id', async (req, res) => {
  const { total_produced, total_dispatched } = req.body;
  try {
    await pool.query(
      `UPDATE inventory_items SET total_produced = $1, total_dispatched = $2 WHERE id = $3`,
      [total_produced, total_dispatched, req.params.id]
    );
    res.json({ message: 'Inventory updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/inventory/:productId/produced  ← product_id + color se match
router.patch('/:productId/produced', async (req, res) => {
  const { net_qty, color } = req.body;
  try {
    const result = await pool.query(
      `UPDATE inventory_items
       SET total_produced = total_produced + $1
       WHERE product_id = $2 AND color = $3`,
      [net_qty, req.params.productId, color]
    );
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Inventory item not found for this product and color' });
    } else {
      res.json({ message: 'Inventory updated' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;