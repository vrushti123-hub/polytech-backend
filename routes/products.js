const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        p.*,
        COALESCE(
          jsonb_object_agg(b.name, pbc.colors) FILTER (WHERE b.id IS NOT NULL),
          '{}'::jsonb
        ) AS brand_options
      FROM products p
      LEFT JOIN product_brand_colors pbc ON pbc.product_id = p.id
      LEFT JOIN brands b ON b.id = pbc.brand_id AND b.is_active = true
      WHERE p.is_active = true
      GROUP BY p.id
      ORDER BY p.id
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
