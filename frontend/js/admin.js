/**
 * ADMIN.JS - ADMIN PANEL
 * Allows admins to add products and view orders
 * 
 * WORKFLOW:
 * 1. Admin can add new products (POST /api/products)
 * 2. Admin can view all orders (GET /api/orders)
 * 3. Orders automatically refresh periodically
 * 4. New products available to students immediately
 */

// Configuration
const API_BASE_URL = 'http://localhost:5000/api';
const ORDERS_REFRESH_INTERVAL = 5000; // 5 seconds

// DOM Elements
const addProductForm = document.getElementById('addProductForm');
const productNameInput = document.getElementById('productName');
const productPriceInput = document.getElementById('productPrice');
const productCategoryInput = document.getElementById('productCategory');
const productDescriptionInput = document.getElementById('productDescription');
const addProductBtn = document.getElementById('addProductBtn');
const addProductSuccess = document.getElementById('addProductSuccess');
const addProductError = document.getElementById('addProductError');

const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

const ordersContainer = document.getElementById('ordersContainer');
const emptyOrdersState = document.getElementById('emptyOrdersState');
const ordersLoadingSpinner = document.getElementById('loadingSpinner');

const logoutBtn = document.getElementById('logoutBtn');

// State
let ordersRefreshInterval = null;

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  // Setup tabs
  tabBtns.forEach(btn => {
    btn.addEventListener('click', handleTabSwitch);
  });

  // Setup form
  addProductForm.addEventListener('submit', handleAddProduct);

  // Setup logout
  logoutBtn.addEventListener('click', handleLogout);

  // Load initial orders
  loadOrders();

  // Auto-refresh orders
  ordersRefreshInterval = setInterval(loadOrders, ORDERS_REFRESH_INTERVAL);
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (ordersRefreshInterval) {
    clearInterval(ordersRefreshInterval);
  }
});

// ============================================
// TAB SWITCHING
// ============================================

/**
 * HANDLE TAB SWITCH
 */
function handleTabSwitch(e) {
  const tabName = e.target.dataset.tab;

  // Update buttons
  tabBtns.forEach(btn => btn.classList.remove('active'));
  e.target.classList.add('active');

  // Update content
  tabContents.forEach(content => content.classList.remove('active'));
  document.getElementById(tabName).classList.add('active');

  // Load orders if switching to that tab
  if (tabName === 'viewOrders') {
    loadOrders();
  }
}

// ============================================
// ADD PRODUCT
// ============================================

/**
 * HANDLE ADD PRODUCT FORM SUBMISSION
 */
async function handleAddProduct(e) {
  e.preventDefault();

  // Clear messages
  hideMessages();

  // Get form values
  const name = productNameInput.value.trim();
  const price = parseFloat(productPriceInput.value);
  const category = productCategoryInput.value.trim();
  const description = productDescriptionInput.value.trim();

  // Validate
  if (!name || !price || !category || !description) {
    showAddProductError('Please fill in all fields');
    return;
  }

  if (isNaN(price) || price <= 0) {
    showAddProductError('Price must be a valid positive number');
    return;
  }

  // Show loading state
  addProductBtn.disabled = true;
  addProductBtn.textContent = 'Adding...';

  try {
    // Call backend API
    const token = localStorage.getItem('token');
    if (!token) {
      showAddProductError('Not authenticated. Please sign in.');
      setTimeout(() => { window.location.href = 'index.html'; }, 800);
      return;
    }

    const response = await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ name, price, category, description })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to add product');
    }

    const data = await response.json();

    if (!data.success || !data.product) {
      throw new Error('Invalid response from server');
    }

    // Success
    showAddProductSuccess(`Product "${escapeHtml(name)}" added successfully!`);

    // Reset form
    addProductForm.reset();
    productCategoryInput.value = '';

  } catch (error) {
    console.error('Add product error:', error);
    showAddProductError(error.message || 'Failed to add product');
  } finally {
    addProductBtn.disabled = false;
    addProductBtn.textContent = 'Add Product';
  }
}

// ============================================
// VIEW ORDERS
// ============================================

/**
 * LOAD ORDERS FROM BACKEND
 */
async function loadOrders() {
  try {
    ordersLoadingSpinner.style.display = 'block';
    ordersContainer.innerHTML = '';
    emptyOrdersState.style.display = 'none';

    const response = await fetch(`${API_BASE_URL}/orders`);

    if (!response.ok) {
      throw new Error('Failed to fetch orders');
    }

    const data = await response.json();

    if (!data.success || !Array.isArray(data.orders)) {
      throw new Error('Invalid response from server');
    }

    const orders = data.orders;
    ordersLoadingSpinner.style.display = 'none';

    if (orders.length === 0) {
      emptyOrdersState.style.display = 'block';
      return;
    }

    // Display orders
    displayOrders(orders);

  } catch (error) {
    console.error('Load orders error:', error);
    ordersLoadingSpinner.style.display = 'none';
    ordersContainer.innerHTML = `<div class="error-message">${escapeHtml(error.message)}</div>`;
  }
}

/**
 * DISPLAY ORDERS
 */
function displayOrders(orders) {
  ordersContainer.innerHTML = '';

  // Sort orders by date (newest first)
  const sorted = [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  sorted.forEach(order => {
    const orderElement = createOrderElement(order);
    ordersContainer.appendChild(orderElement);
  });
}

/**
 * CREATE ORDER ELEMENT
 */
function createOrderElement(order) {
  const orderDiv = document.createElement('div');
  orderDiv.className = 'order-card';

  const createdDate = new Date(order.createdAt).toLocaleString();
  const orderIdDisplay = order.id.substring(0, 8);

  let itemsHtml = '';
  if (Array.isArray(order.items) && order.items.length > 0) {
    itemsHtml = order.items.map(item => `
      <div class="order-item">
        <span>${escapeHtml(item.productId.substring(0, 8))}...</span>
        <span>Qty: ${item.quantity}</span>
        <span>$${parseFloat(item.price).toFixed(2)}</span>
      </div>
    `).join('');
  }

  orderDiv.innerHTML = `
    <div class="order-header">
      <div>
        <p class="order-id">Order ID: <strong>${orderIdDisplay}...</strong></p>
        <p class="order-date">${createdDate}</p>
      </div>
      <span class="order-status-badge">${escapeHtml(order.status)}</span>
    </div>
    <div class="order-body">
      <div class="order-items">
        <h4>Items (${order.items.length}):</h4>
        ${itemsHtml}
      </div>
      <div class="order-total">
        <strong>Total: $${parseFloat(order.totalAmount).toFixed(2)}</strong>
      </div>
    </div>
  `;

  return orderDiv;
}

// ============================================
// USER ACTIONS
// ============================================

/**
 * HANDLE LOGOUT
 */
function handleLogout() {
  if (confirm('Are you sure you want to logout?')) {
    localStorage.removeItem('user');
    localStorage.removeItem('cart');
    localStorage.removeItem('refreshToken');
    window.location.href = 'index.html';
  }
}

// ============================================
// MESSAGE DISPLAY
// ============================================

/**
 * SHOW ADD PRODUCT SUCCESS
 */
function showAddProductSuccess(message) {
  addProductSuccess.textContent = message;
  addProductSuccess.style.display = 'block';
  addProductError.style.display = 'none';

  setTimeout(() => {
    addProductSuccess.style.display = 'none';
  }, 4000);
}

/**
 * SHOW ADD PRODUCT ERROR
 */
function showAddProductError(message) {
  addProductError.textContent = message;
  addProductError.style.display = 'block';
  addProductSuccess.style.display = 'none';

  setTimeout(() => {
    addProductError.style.display = 'none';
  }, 4000);
}

/**
 * HIDE ALL MESSAGES
 */
function hideMessages() {
  addProductSuccess.style.display = 'none';
  addProductError.style.display = 'none';
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * ESCAPE HTML TO PREVENT XSS
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}
