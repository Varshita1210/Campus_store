/**
 * ORDERS ROUTES - ORDER MANAGEMENT
 * 
 * Endpoints:
 * POST /api/orders - Create new order (student places order with storekeeper)
 * GET /api/orders/student/:studentId - Get orders for a student
 * GET /api/orders/storekeeper/:storeKeeperId - Get orders received by storekeeper
 * GET /api/orders/:id - Get specific order
 */

const express = require('express');
const router = express.Router();
const { 
  addOrder, 
  getOrders, 
  getOrderById, 
  getOrdersByStudent,
  getOrdersByStoreKeeper
} = require('../utils/dbHelper');

/**
 * POST /api/orders
 * Create new order (student purchases from storekeeper)
 * 
 * Body:
 * {
 *   "studentId": "student-user-id",
 *   "storeKeeperId": "storekeeper-user-id",
 *   "items": [
 *     {
 *       "productId": "product-id",
 *       "quantity": 2,
 *       "price": 25.99
 *     }
 *   ],
 *   "totalAmount": 51.98
 * }
 */
router.post('/', (req, res) => {
  try {
    const { studentId, storeKeeperId, items, totalAmount } = req.body;

    if (!studentId || !storeKeeperId || !items || items.length === 0 || !totalAmount) {
      return res.status(400).json({
        success: false,
        error: 'Student ID, Store keeper ID, items, and total amount are required'
      });
    }

    const newOrder = addOrder(studentId, storeKeeperId, items, totalAmount);

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      order: newOrder
    });
  } catch (error) {
    console.error('Add order error:', error.message);
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/orders
 * Get all orders (admin view)
 */
router.get('/', (req, res) => {
  try {
    const orders = getOrders();

    return res.status(200).json({
      success: true,
      orders: orders,
      count: orders.length
    });
  } catch (error) {
    console.error('Get orders error:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/orders/:id
 * Get specific order by ID
 */
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Order ID is required'
      });
    }

    const order = getOrderById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    return res.status(200).json({
      success: true,
      order: order
    });
  } catch (error) {
    console.error('Get order error:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/orders/student/:studentId
 * Get all orders placed by a student
 */
router.get('/student/:studentId', (req, res) => {
  try {
    const { studentId } = req.params;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        error: 'Student ID is required'
      });
    }

    const orders = getOrdersByStudent(studentId);

    return res.status(200).json({
      success: true,
      orders: orders,
      count: orders.length
    });
  } catch (error) {
    console.error('Get student orders error:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/orders/storekeeper/:storeKeeperId
 * Get all orders received by a storekeeper
 */
router.get('/storekeeper/:storeKeeperId', (req, res) => {
  try {
    const { storeKeeperId } = req.params;

    if (!storeKeeperId) {
      return res.status(400).json({
        success: false,
        error: 'Store keeper ID is required'
      });
    }

    const orders = getOrdersByStoreKeeper(storeKeeperId);

    return res.status(200).json({
      success: true,
      orders: orders,
      count: orders.length
    });
  } catch (error) {
    console.error('Get storekeeper orders error:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
