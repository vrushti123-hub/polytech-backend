const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/dispatch
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM challans ORDER BY dispatch_date DESC');
    
    for (let challan of result.rows) {
      const items = await pool.query(
        'SELECT * FROM challan_items WHERE challan_id = $1',
        [challan.id]
      );
      challan.items = items.rows;
    }

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/dispatch
router.post('/', async (req, res) => {
  const { id, order_id, distributor_name, distributor_city, vehicle_number, driver_name, driver_phone, dispatch_date, truck_photo_url, items } = req.body;
  try {
    await pool.query(
      `INSERT INTO challans (id, order_id, distributor_name, distributor_city, vehicle_number, driver_name, driver_phone, dispatch_date, truck_photo_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [id, order_id, distributor_name, distributor_city, vehicle_number, driver_name, driver_phone, dispatch_date, truck_photo_url || null]
    );

    for (let item of items) {
      await pool.query(
        `INSERT INTO challan_items (id, challan_id, product_id, product_name, brand, color, quantity)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          `${id}-${item.product_id}`,
          id,
          item.product_id,
          item.product_name,
          item.brand,
          item.color,
          item.quantity
        ]
      );
    }

    // Order status update karo
    await pool.query(
      `UPDATE orders SET status = 'dispatched' WHERE id = $1`,
      [order_id]
    );

    res.status(201).json({ message: 'Challan created' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/dispatch/:id/photo
router.patch('/:id/photo', async (req, res) => {
  const { truck_photo_url } = req.body;
  try {
    await pool.query(
      `UPDATE challans SET truck_photo_url = $1 WHERE id = $2`,
      [truck_photo_url, req.params.id]
    );
    res.json({ message: 'Photo updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;