/**
 * USER ROUTES - AUTHENTICATION AND USER MANAGEMENT
 * 
 * Endpoints:
 * POST /api/auth/signup - Register new user (student or storekeeper)
 * POST /api/auth/signin - Login with email and password
 * GET /api/auth/user/:id - Get user profile
 * 
 * User Roles:
 * - student: Can browse and purchase products
 * - storekeeper: Can add and manage products
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { registerUser, loginUser, getUserById, saveRefreshToken, removeRefreshToken, findUserByRefreshToken } = require('../utils/dbHelper');

const JWT_SECRET = process.env.JWT_SECRET || 'replace_this_with_strong_secret';
const ACCESS_EXPIRES = process.env.ACCESS_EXPIRES || '15m';
const REFRESH_EXPIRES = process.env.REFRESH_EXPIRES || '7d';

/**
 * POST /api/auth/signup
 * Register a new user
 * 
 * Body:
 * {
 *   "username": "john_doe",
 *   "email": "john@example.com",
 *   "password": "password123",
 *   "role": "student" or "storekeeper",
 *   
 *   // If storekeeper, also include initial product:
 *   "product": {
 *     "name": "T-Shirt",
 *     "price": 25.99,
 *     "description": "College merchandise t-shirt",
 *     "category": "Apparel",
 *     "tags": ["merchandise", "shirt"],
 *     "imageUrl": "https://example.com/image.jpg"
 *   }
 * }
 */
router.post('/signup', (req, res) => {
  try {
    const { username, email, password, role, storeName, location } = req.body;

    // Validate required fields
    if (!username || !email || !password || !role) {
      return res.status(400).json({ error: 'Username, email, password, and role are required' });
    }

    // Register user (store metadata saved if provided)
    const user = registerUser(username, email, password, role, storeName, location);

    // Generate access and refresh tokens
    const accessToken = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: ACCESS_EXPIRES });
    const refreshToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: REFRESH_EXPIRES });

    // Persist refresh token for the user
    saveRefreshToken(user.id, refreshToken);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: user,
      accessToken,
      refreshToken
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/auth/signin
 * Login user with email and password
 * 
 * Body:
 * {
 *   "email": "john@example.com",
 *   "password": "password123"
 * }
 */
router.post('/signin', (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Login user
    const user = loginUser(email, password);

    // Generate tokens
    const accessToken = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: ACCESS_EXPIRES });
    const refreshToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: REFRESH_EXPIRES });

    // Persist refresh token
    saveRefreshToken(user.id, refreshToken);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: user,
      accessToken,
      refreshToken
    });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

/**
 * POST /users/refresh
 * Exchange a refresh token for a new access token
 */
router.post('/refresh', (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });

    const storedUser = findUserByRefreshToken(refreshToken);
    if (!storedUser) return res.status(403).json({ error: 'Invalid refresh token' });

    // Verify token
    try {
      const payload = jwt.verify(refreshToken, JWT_SECRET);
      const accessToken = jwt.sign({ userId: payload.userId, role: storedUser.role }, JWT_SECRET, { expiresIn: ACCESS_EXPIRES });
      return res.status(200).json({ accessToken });
    } catch (err) {
      return res.status(403).json({ error: 'Expired or invalid refresh token' });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /users/logout
 * Invalidate refresh token (client should delete access token too)
 */
router.post('/logout', (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });

    const removed = removeRefreshToken(refreshToken);
    if (!removed) return res.status(400).json({ error: 'Refresh token not found' });

    return res.status(200).json({ success: true, message: 'Logged out' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/auth/user/:id
 * Get user profile information
 */
router.get('/user/:id', (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const user = getUserById(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({
      success: true,
      user: user
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
