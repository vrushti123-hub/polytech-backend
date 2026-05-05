const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/rawmaterial
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM raw_materials');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/rawmaterial
router.post('/', async (req, res) => {
  const { id, name, supplier, current_stock_kg, minimum_stock_kg } = req.body;
  try {
    await pool.query(
      `INSERT INTO raw_materials (id, name, supplier, current_stock_kg, minimum_stock_kg)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, name, supplier, current_stock_kg, minimum_stock_kg]
    );
    res.status(201).json({ message: 'Raw material added' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/rawmaterial/:id
router.patch('/:id', async (req, res) => {
  const { current_stock_kg } = req.body;
  try {
    await pool.query(
      `UPDATE raw_materials SET current_stock_kg = $1 WHERE id = $2`,
      [current_stock_kg, req.params.id]
    );
    res.json({ message: 'Stock updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/rawmaterial/grn
router.get('/grn', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM grn_entries ORDER BY date DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/rawmaterial/grn
router.post('/grn', async (req, res) => {
  const { id, material_id, material_name, supplier, num_bags, weight_per_bag, date } = req.body;
  try {
    await pool.query(
      `INSERT INTO grn_entries (id, material_id, material_name, supplier, num_bags, weight_per_bag, date)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, material_id, material_name, supplier, num_bags, weight_per_bag, date]
    );

    // Stock update karo
    await pool.query(
      `UPDATE raw_materials SET current_stock_kg = current_stock_kg + $1 WHERE id = $2`,
      [num_bags * weight_per_bag, material_id]
    );

    res.status(201).json({ message: 'GRN entry added' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;