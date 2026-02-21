/**
 * PRODUCTS ROUTES - PRODUCT MANAGEMENT
 * 
 * Endpoints:
 * GET /api/products - Get all products (for students)
 * GET /api/products/:id - Get specific product
 * GET /api/products/storekeeper/:id - Get store keeper's products
 * POST /api/products - Add new product (storekeeper only)
 * PUT /api/products/:id - Update product (storekeeper only)
 * DELETE /api/products/:id - Delete product (storekeeper only)
 */

const express = require('express');
const router = express.Router();
const { 
  getProducts, 
  getProductById, 
  getProductsByStoreKeeper, 
  addProduct, 
  updateProduct, 
  deleteProduct,
  getUserById
} = require('../utils/dbHelper');
const { authenticateToken } = require('../middleware/auth');

/**
 * GET /api/products
 * Get all products available (for students to browse)
 */
router.get('/', (req, res) => {
  try {
    const products = getProducts();

    return res.status(200).json({
      success: true,
      products: products,
      count: products.length
    });
  } catch (error) {
    console.error('Get products error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch products'
    });
  }
});

/**
 * GET /api/products/:id
 * Get single product by ID
 */
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Product ID is required'
      });
    }

    const product = getProductById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    return res.status(200).json({
      success: true,
      product: product
    });
  } catch (error) {
    console.error('Get product error:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/products/storekeeper/:storeKeeperId
 * Get products from a specific store keeper
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

    const products = getProductsByStoreKeeper(storeKeeperId);

    return res.status(200).json({
      success: true,
      products: products,
      count: products.length
    });
  } catch (error) {
    console.error('Get storekeeper products error:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/products
 * Add new product (storekeeper only)
 * 
 * Body:
 * {
 *   "storeKeeperId": "user-id",
 *   "name": "T-Shirt",
 *   "price": 25.99,
 *   "description": "College merchandise t-shirt",
 *   "category": "Apparel",
 *   "tags": ["merchandise", "shirt"],
 *   "imageUrl": "https://example.com/image.jpg"
 * }
 */
router.post('/', authenticateToken, (req, res) => {
  try {
    const { name, price, description, category, tags, imageUrl } = req.body;
    const storeKeeperId = req.user && req.user.userId;

    if (!storeKeeperId || !name || !price || !description || !category || !imageUrl) {
      return res.status(400).json({
        success: false,
        error: 'Name, price, description, category, and image URL are required'
      });
    }

    // Verify user is a storekeeper (from token)
    const user = getUserById(storeKeeperId);
    if (!user || user.role !== 'storekeeper') {
      return res.status(403).json({
        success: false,
        error: 'Only store keepers can add products'
      });
    }

    const newProduct = addProduct(storeKeeperId, name, price, description, category, tags || [], imageUrl);

    return res.status(201).json({
      success: true,
      message: 'Product added successfully',
      product: newProduct
    });
  } catch (error) {
    console.error('Add product error:', error.message);
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/products/:id
 * Update product (storekeeper only)
 * 
 * Body: Any fields to update (name, price, description, category, tags, imageUrl)
 */
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const storeKeeperId = req.user && req.user.userId;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Product ID is required'
      });
    }

    if (!storeKeeperId) {
      return res.status(400).json({ success: false, error: 'Unauthorized' });
    }

    // Get the product
    const product = getProductById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Verify ownership
    if (product.storeKeeperId !== storeKeeperId) {
      return res.status(403).json({
        success: false,
        error: 'You can only update your own products'
      });
    }

    // Update product
    const updatedProduct = updateProduct(id, req.body);

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      product: updatedProduct
    });
  } catch (error) {
    console.error('Update product error:', error.message);
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/products/:id
 * Delete product (storekeeper only)
 */
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const storeKeeperId = req.user && req.user.userId;

    console.log('DELETE request received:', { id, storeKeeperId, body: req.body });

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Product ID is required'
      });
    }

    if (!storeKeeperId) {
      return res.status(400).json({ success: false, error: 'Unauthorized' });
    }

    // Get the product
    const product = getProductById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Verify ownership
    if (product.storeKeeperId !== storeKeeperId) {
      return res.status(403).json({
        success: false,
        error: 'You can only delete your own products'
      });
    }

    // Delete product
    deleteProduct(id);

    return res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error.message);
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
