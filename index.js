const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes        = require('./routes/auth');
const orderRoutes       = require('./routes/orders');
const inventoryRoutes   = require('./routes/inventory');
const productionRoutes  = require('./routes/production');
const rawMaterialRoutes = require('./routes/rawmaterial');
const dispatchRoutes    = require('./routes/dispatch');
const productRoutes     = require('./routes/products');

const app = express();
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

app.use('/api/auth',        authRoutes);
app.use('/api/orders',      orderRoutes);
app.use('/api/inventory',   inventoryRoutes);
app.use('/api/production',  productionRoutes);
app.use('/api/rawmaterial', rawMaterialRoutes);
app.use('/api/dispatch',    dispatchRoutes);
app.use('/api/products',    productRoutes);

app.get('/', (req, res) => res.send('Polytech Backend Running ✅'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));