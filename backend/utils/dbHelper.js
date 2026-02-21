/**
 * DATABASE HELPER - JSON FILE DATABASE MANAGEMENT WITH AUTHENTICATION
 * 
 * Supports:
 * - User registration with role-based access (Student/StoreKeeper)
 * - Password hashing with bcryptjs
 * - Product management (images, tags, store keeper association)
 * - Order tracking with student-storekeeper relationship
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, '../db.json');
const SALT_ROUNDS = 10;

/**
 * READ DATABASE
 */
function readDB() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      const defaultDB = { users: [], products: [], orders: [] };
      fs.writeFileSync(DB_PATH, JSON.stringify(defaultDB, null, 2));
      return defaultDB;
    }

    const rawData = fs.readFileSync(DB_PATH, 'utf8');
    
    if (!rawData.trim()) {
      const defaultDB = { users: [], products: [], orders: [] };
      fs.writeFileSync(DB_PATH, JSON.stringify(defaultDB, null, 2));
      return defaultDB;
    }

    return JSON.parse(rawData);
  } catch (error) {
    console.error('Error reading database:', error.message);
    return { users: [], products: [], orders: [] };
  }
}

/**
 * WRITE DATABASE
 */
function writeDB(db) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing database:', error.message);
    return false;
  }
}

/**
 * REGISTER NEW USER
 * Supports two roles: student, storekeeper
 * 
 * @param {string} username - Unique username
 * @param {string} email - User email
 * @param {string} password - Plain text password (will be hashed)
 * @param {string} role - "student" or "storekeeper"
 * @returns {object} Created user object (without password)
 */
function registerUser(username, email, password, role, storeName, location) {
  // Validate inputs
  if (!username || !email || !password || !role) {
    throw new Error('All fields are required');
  }

  if (!['student', 'storekeeper'].includes(role)) {
    throw new Error('Role must be "student" or "storekeeper"');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format');
  }

  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }

  const db = readDB();

  // Check for duplicate username
  const existingUsername = db.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  if (existingUsername) {
    throw new Error('Username already exists');
  }

  // Check for duplicate email
  const existingEmail = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existingEmail) {
    throw new Error('Email already registered');
  }

  // Hash password
  const hashedPassword = bcrypt.hashSync(password, SALT_ROUNDS);

  // If storekeeper, require store metadata
  if (role === 'storekeeper') {
    if (!storeName || !location) {
      throw new Error('Store name and location are required for store keepers');
    }
  }

  // Create new user
  const newUser = {
    id: uuidv4(),
    username: username.trim(),
    email: email.trim(),
    password: hashedPassword,
    role: role,
    createdAt: new Date().toISOString()
  };

  if (role === 'storekeeper') {
    newUser.storeName = storeName.trim();
    newUser.location = location.trim();
  }

  db.users.push(newUser);
  writeDB(db);

  // Return user without password (include store metadata when present)
  const returned = {
    id: newUser.id,
    username: newUser.username,
    email: newUser.email,
    role: newUser.role,
    createdAt: newUser.createdAt
  };
  if (newUser.role === 'storekeeper') {
    returned.storeName = newUser.storeName;
    returned.location = newUser.location;
  }
  return returned;
}

/**
 * LOGIN USER
 * Validates email and password
 * 
 * @param {string} email - User email
 * @param {string} password - Plain text password
 * @returns {object} User object with role
 */
function loginUser(email, password) {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  const db = readDB();

  // Find user by email
  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    throw new Error('Invalid email or password');
  }

  // Verify password
  const passwordMatch = bcrypt.compareSync(password, user.password);

  if (!passwordMatch) {
    throw new Error('Invalid email or password');
  }

  // Return user without password
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    storeName: user.storeName,
    location: user.location
  };
}

/**
 * GET USER BY ID
 */
function getUserById(userId) {
  try {
    const db = readDB();
    const user = db.users.find(u => u.id === userId);
    
    if (!user) return null;

    // Return without password
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      storeName: user.storeName,
      location: user.location
    };
  } catch (error) {
    console.error('Error getting user:', error.message);
    return null;
  }
}

/**
 * ADD PRODUCT
 * Created by store keeper
 * 
 * @param {string} storeKeeperId - ID of store keeper who owns product
 * @param {string} name - Product name
 * @param {number} price - Product price
 * @param {string} description - Product description
 * @param {string} category - Product category
 * @param {array} tags - Array of tags
 * @param {string} imageUrl - Product image URL
 * @returns {object} Created product object
 */
function addProduct(storeKeeperId, name, price, description, category, tags, imageUrl) {
  if (!storeKeeperId || !name || !price || !description || !category) {
    throw new Error('Name, price, description, and category are required');
  }

  if (!imageUrl || !imageUrl.trim()) {
    throw new Error('Product image URL is required');
  }

  if (isNaN(price) || price <= 0) {
    throw new Error('Price must be a positive number');
  }

  const db = readDB();

  // Verify store keeper exists
  const storeKeeper = db.users.find(u => u.id === storeKeeperId && u.role === 'storekeeper');
  if (!storeKeeper) {
    throw new Error('Store keeper not found');
  }

  // Check for duplicate product name (per store)
  const duplicate = db.products.find(
    p => p.storeKeeperId === storeKeeperId && p.name.toLowerCase() === name.toLowerCase()
  );
  if (duplicate) {
    throw new Error('Product with this name already exists in your store');
  }

  // Parse tags
  let tagsArray = [];
  if (Array.isArray(tags)) {
    tagsArray = tags;
  } else if (typeof tags === 'string') {
    tagsArray = tags.split(',').map(t => t.trim()).filter(t => t);
  }

  // Create product
  const newProduct = {
    id: uuidv4(),
    storeKeeperId: storeKeeperId,
    name: name.trim(),
    price: parseFloat(price),
    description: description.trim(),
    category: category.trim(),
    tags: tagsArray,
    imageUrl: imageUrl.trim(),
    createdAt: new Date().toISOString()
  };

  db.products.push(newProduct);
  writeDB(db);

  return newProduct;
}

/**
 * GET ALL PRODUCTS
 */
function getProducts() {
  try {
    const db = readDB();
    return db.products || [];
  } catch (error) {
    console.error('Error getting products:', error.message);
    return [];
  }
}

/**
 * GET PRODUCTS BY STORE KEEPER ID
 */
function getProductsByStoreKeeper(storeKeeperId) {
  try {
    const db = readDB();
    return (db.products || []).filter(p => p.storeKeeperId === storeKeeperId);
  } catch (error) {
    console.error('Error getting store products:', error.message);
    return [];
  }
}

/**
 * GET PRODUCT BY ID
 */
function getProductById(productId) {
  try {
    const db = readDB();
    return db.products.find(p => p.id === productId) || null;
  } catch (error) {
    console.error('Error getting product:', error.message);
    return null;
  }
}

/**
 * UPDATE PRODUCT
 */
function updateProduct(productId, updates) {
  try {
    const db = readDB();
    const productIndex = db.products.findIndex(p => p.id === productId);

    if (productIndex === -1) {
      throw new Error('Product not found');
    }

    const product = db.products[productIndex];

    // Only allow updates to specific fields
    if (updates.name) product.name = updates.name;
    if (updates.price) product.price = parseFloat(updates.price);
    if (updates.description) product.description = updates.description;
    if (updates.category) product.category = updates.category;
    if (updates.tags) product.tags = Array.isArray(updates.tags) ? updates.tags : updates.tags.split(',').map(t => t.trim());
    if (updates.imageUrl) product.imageUrl = updates.imageUrl;

    db.products[productIndex] = product;
    writeDB(db);

    return product;
  } catch (error) {
    console.error('Error updating product:', error.message);
    throw error;
  }
}

/**
 * DELETE PRODUCT
 */
function deleteProduct(productId) {
  try {
    const db = readDB();
    const productIndex = db.products.findIndex(p => p.id === productId);

    if (productIndex === -1) {
      throw new Error('Product not found');
    }

    const product = db.products[productIndex];
    db.products.splice(productIndex, 1);
    writeDB(db);

    return product;
  } catch (error) {
    console.error('Error deleting product:', error.message);
    throw error;
  }
}

/**
 * ADD ORDER
 * Created when student purchases from store keeper
 * 
 * @param {string} studentId - Student's user ID
 * @param {string} storeKeeperId - Store keeper's user ID
 * @param {array} items - Order items with productId, quantity, price
 * @param {number} totalAmount - Total order amount
 * @returns {object} Created order object
 */
function addOrder(studentId, storeKeeperId, items, totalAmount) {
  if (!studentId || !storeKeeperId || !Array.isArray(items) || items.length === 0 || !totalAmount) {
    throw new Error('All order details are required');
  }

  const db = readDB();

  // Verify student exists
  const student = db.users.find(u => u.id === studentId && u.role === 'student');
  if (!student) {
    throw new Error('Student not found');
  }

  // Verify store keeper exists
  const storeKeeper = db.users.find(u => u.id === storeKeeperId && u.role === 'storekeeper');
  if (!storeKeeper) {
    throw new Error('Store keeper not found');
  }

  // Verify all products exist and belong to store keeper
  for (const item of items) {
    const product = db.products.find(p => p.id === item.productId);
    if (!product) {
      throw new Error(`Product ${item.productId} not found`);
    }
    if (product.storeKeeperId !== storeKeeperId) {
      throw new Error(`Product does not belong to this store`);
    }
  }

  const newOrder = {
    id: uuidv4(),
    studentId: studentId,
    storeKeeperId: storeKeeperId,
    items: items,
    totalAmount: parseFloat(totalAmount),
    status: 'confirmed',
    createdAt: new Date().toISOString()
  };

  db.orders.push(newOrder);
  writeDB(db);

  return newOrder;
}

/**
 * GET ALL ORDERS
 */
function getOrders() {
  try {
    const db = readDB();
    return db.orders || [];
  } catch (error) {
    console.error('Error getting orders:', error.message);
    return [];
  }
}

/**
 * GET ORDERS FOR STORE KEEPER
 */
function getOrdersByStoreKeeper(storeKeeperId) {
  try {
    const db = readDB();
    return (db.orders || []).filter(o => o.storeKeeperId === storeKeeperId);
  } catch (error) {
    console.error('Error getting store orders:', error.message);
    return [];
  }
}

/**
 * GET ORDERS FOR STUDENT
 */
function getOrdersByStudent(studentId) {
  try {
    const db = readDB();
    return (db.orders || []).filter(o => o.studentId === studentId);
  } catch (error) {
    console.error('Error getting student orders:', error.message);
    return [];
  }
}

/**
 * GET ORDER BY ID
 */
function getOrderById(orderId) {
  try {
    const db = readDB();
    return db.orders.find(o => o.id === orderId) || null;
  } catch (error) {
    console.error('Error getting order:', error.message);
    return null;
  }
}

/**
 * REFRESH TOKEN MANAGEMENT
 */
function saveRefreshToken(userId, refreshToken) {
  try {
    const db = readDB();
    const userIndex = db.users.findIndex(u => u.id === userId);
    if (userIndex === -1) return false;
    db.users[userIndex].refreshToken = refreshToken;
    writeDB(db);
    return true;
  } catch (err) {
    console.error('Error saving refresh token:', err.message);
    return false;
  }
}

function removeRefreshToken(refreshToken) {
  try {
    const db = readDB();
    const userIndex = db.users.findIndex(u => u.refreshToken === refreshToken);
    if (userIndex === -1) return false;
    delete db.users[userIndex].refreshToken;
    writeDB(db);
    return true;
  } catch (err) {
    console.error('Error removing refresh token:', err.message);
    return false;
  }
}

function findUserByRefreshToken(refreshToken) {
  try {
    const db = readDB();
    return db.users.find(u => u.refreshToken === refreshToken) || null;
  } catch (err) {
    console.error('Error finding user by refresh token:', err.message);
    return null;
  }
}

module.exports = {
  readDB,
  writeDB,
  registerUser,
  loginUser,
  getUserById,
  addProduct,
  getProducts,
  getProductsByStoreKeeper,
  getProductById,
  updateProduct,
  deleteProduct,
  addOrder,
  getOrders,
  getOrdersByStoreKeeper,
  getOrdersByStudent,
  getOrderById
  ,saveRefreshToken,
  removeRefreshToken,
  findUserByRefreshToken
};

