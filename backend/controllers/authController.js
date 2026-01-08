const User = require('../models/User');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

// Utility to generate a tenantId (uses ObjectId string)
function generateTenantId() {
  return new mongoose.Types.ObjectId().toHexString();
}

// Signup
const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email and password are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }

    const tenantId = generateTenantId();

    const user = new User({ name, email, tenantId });
    await user.setPassword(password);
    await user.save();

    // Issue token
    const token = jwt.sign({ userId: user._id, tenantId: user.tenantId, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ token, tenantId: user.tenantId, email: user.email, name: user.name });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Failed to signup' });
  }
};

// Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const valid = await user.validatePassword(password);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id, tenantId: user.tenantId, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, tenantId: user.tenantId, email: user.email, name: user.name });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Failed to login' });
  }
};

// Logout
const logout = async (req, res) => {
  return res.json({ message: 'Logged out' });
};

module.exports = { signup, login, logout };
