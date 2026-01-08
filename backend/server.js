const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const activityRoutes = require('./routes/activities');
const authRoutes = require('./routes/auth');
const authMiddleware = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT;

// Middleware
app.use(cors());
app.use(express.json());

// Parse token on /api routes (optional) so controllers can use req.user if provided
app.use('/api', authMiddleware.parseToken);

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
.then(() => {
  console.log('MongoDB connected successfully');
  console.log('Database:', mongoose.connection.db.databaseName);
})
.catch((err) => console.error('MongoDB connection error:', err));

// Simple health endpoint
app.get('/api/ping', (req, res) => res.json({ status: 'ok', env: process.env.NODE_ENV || 'development' }));

// Routes
app.use('/api/activities', activityRoutes);
app.use('/api/auth', authRoutes);


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

