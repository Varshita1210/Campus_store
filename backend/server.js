/**
 * MAIN SERVER FILE
 * College Merchandise Web Store Backend
 * 
 * This is the entry point for the Express server.
 * It sets up middleware, routes, and error handling.
 * 
 * WORKFLOW:
 * 1. Express app initializes
 * 2. Middleware is registered (CORS, JSON parsing)
 * 3. Routes are registered (users, products, orders)
 * 4. Server listens on port 5000
 * 5. Frontend makes HTTP requests to these endpoints
 * 6. Each endpoint calls dbHelper functions
 * 7. dbHelper reads/writes to db.json
 * 8. Response sent back to frontend
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const xss = require('xss-clean');

// Initialize app
const app = express();
const PORT = 5000;

// ============================================
// MIDDLEWARE
// ============================================

// SECURITY MIDDLEWARE
app.use(helmet());
app.use(xss());

// Enable CORS (restrict to allowed origins)
const FRONTEND_URL = process.env.FRONTEND_URL || `http://localhost:5000`;
app.use(cors({ origin: FRONTEND_URL }));

// Rate limiter - basic protection against brute force
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use(limiter);

// Parse JSON request bodies
app.use(express.json());

// Serve static files from frontend
// This allows us to run the app at http://localhost:5000
app.use(express.static(path.join(__dirname, '../frontend')));

// ============================================
// ROUTES
// ============================================

const usersRouter = require('./routes/users');
const productsRouter = require('./routes/products');
const ordersRouter = require('./routes/orders');

// Mount routes
app.use('/api/users', usersRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);

// ============================================
// HEALTH CHECK
// ============================================

/**
 * GET /
 * Simple health check endpoint
 * Used to verify server is running
 */
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// ============================================
// SERVE FRONTEND
// ============================================

/**
 * GET /
 * Serve index.html (login page)
 * Frontend pages are served as static files
 */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ============================================
// 404 HANDLER
// ============================================

/**
 * Catch all unmatched routes
 * Return 404 error
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path
  });
});

// ============================================
// ERROR HANDLER
// ============================================

/**
 * Global error handler
 * Catches all unexpected errors
 * Prevents server crash
 */
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║   College Merchandise Web Store - Backend   ║
╚════════════════════════════════════════════╝

✅ Server running at http://localhost:${PORT}
✅ Frontend: http://localhost:${PORT}
✅ API: http://localhost:${PORT}/api

📚 Available Endpoints:
  - POST   /api/users (Login/Register)
  - GET    /api/products (List all products)
  - POST   /api/products (Add product - admin)
  - POST   /api/orders (Create order)
  - GET    /api/orders (List all orders)

📁 Database: backend/db.json
⚙️  Port: ${PORT}

Press Ctrl+C to stop the server.
  `);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n✋ Server shutting down...');
  process.exit(0);
});
