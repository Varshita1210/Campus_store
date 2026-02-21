/**
 * CART.JS - SHOPPING CART PAGE
 * Manages cart items, quantities, and checkout
 * 
 * WORKFLOW:
 * 1. Page loads, get cart from localStorage
 * 2. Display cart items
 * 3. User can increase/decrease quantity or remove items
 * 4. Cart total calculated dynamically
 * 5. Checkout sends order to backend (POST /api/orders)
 * 6. Show order confirmation
 */

// Configuration
const API_BASE_URL = 'http://localhost:5000/api';
const TAX_RATE = 0.10; // 10% tax

// DOM Elements
const cartItemsContainer = document.getElementById('cartItemsContainer');
const cartSummary = document.getElementById('cartSummary');
const emptyCartState = document.getElementById('emptyCartState');
const loadingSpinner = document.getElementById('loadingSpinner');
const subtotalAmount = document.getElementById('subtotalAmount');
const taxAmount = document.getElementById('taxAmount');
const totalAmount = document.getElementById('totalAmount');
const checkoutBtn = document.getElementById('checkoutBtn');
const logoutBtn = document.getElementById('logoutBtn');
const successMessage = document.getElementById('successMessage');
const errorMessage = document.getElementById('errorMessage');
const confirmationModal = document.getElementById('confirmationModal');
const confirmationOrderId = document.getElementById('confirmationOrderId');
const confirmationOrderDetails = document.getElementById('confirmationOrderDetails');
const continueShoppingBtn = document.getElementById('continueShoppingBtn');

// State
let currentUser = null;

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  // Check user logged in
  const userJson = localStorage.getItem('user');
  if (!userJson) {
    window.location.href = 'index.html';
    return;
  }

  currentUser = JSON.parse(userJson);

  // Setup event listeners
  logoutBtn.addEventListener('click', handleLogout);
  checkoutBtn.addEventListener('click', handleCheckout);
  continueShoppingBtn.addEventListener('click', () => {
    window.location.href = 'products.html';
  });

  // Load cart
  loadCart();
});

// ============================================
// LOAD AND DISPLAY CART
// ============================================

/**
 * LOAD CART FROM LOCALSTORAGE
 * Display cart items or empty state
 */
function loadCart() {
  try {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];

    if (cart.length === 0) {
      showEmptyCart();
      return;
    }

    // Display cart items
    displayCartItems(cart);

    // Update totals
    updateCartTotals(cart);

    cartSummary.style.display = 'block';

  } catch (error) {
    console.error('Load cart error:', error);
    showError('Failed to load cart');
  }
}

/**
 * DISPLAY CART ITEMS IN TABLE
 */
function displayCartItems(cart) {
  emptyCartState.style.display = 'none';
  cartItemsContainer.innerHTML = '';

  // Create table
  const table = document.createElement('table');
  table.className = 'cart-table';
  table.innerHTML = `
    <thead>
      <tr>
        <th>Product</th>
        <th>Price</th>
        <th>Quantity</th>
        <th>Subtotal</th>
        <th>Action</th>
      </tr>
    </thead>
    <tbody id="cartTableBody">
    </tbody>
  `;

  const tbody = table.querySelector('tbody');

  cart.forEach((item, index) => {
    const subtotal = item.price * item.quantity;
    const row = document.createElement('tr');
    row.className = 'cart-item-row';
    row.innerHTML = `
      <td>
        <div class="cart-item-name">${escapeHtml(item.name)}</div>
        <div class="cart-item-category">${escapeHtml(item.category)}</div>
      </td>
      <td>$${parseFloat(item.price).toFixed(2)}</td>
      <td>
        <div class="quantity-control">
          <button class="qty-btn qty-decrease" data-index="${index}">−</button>
          <input type="number" class="qty-input" value="${item.quantity}" data-index="${index}" min="1">
          <button class="qty-btn qty-increase" data-index="${index}">+</button>
        </div>
      </td>
      <td>$${subtotal.toFixed(2)}</td>
      <td>
        <button class="btn btn-danger btn-small remove-btn" data-index="${index}">
          Remove
        </button>
      </td>
    `;

    tbody.appendChild(row);
  });

  cartItemsContainer.appendChild(table);

  // Add event listeners to quantity buttons
  document.querySelectorAll('.qty-decrease').forEach(btn => {
    btn.addEventListener('click', (e) => decreaseQuantity(parseInt(e.target.dataset.index)));
  });

  document.querySelectorAll('.qty-increase').forEach(btn => {
    btn.addEventListener('click', (e) => increaseQuantity(parseInt(e.target.dataset.index)));
  });

  document.querySelectorAll('.qty-input').forEach(input => {
    input.addEventListener('change', (e) => {
      const index = parseInt(e.target.dataset.index);
      const newQty = parseInt(e.target.value) || 1;
      updateQuantity(index, newQty);
    });
  });

  document.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', (e) => removeItem(parseInt(e.target.dataset.index)));
  });
}

// ============================================
// CART OPERATIONS
// ============================================

/**
 * INCREASE ITEM QUANTITY
 */
function increaseQuantity(index) {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];

  if (index >= 0 && index < cart.length) {
    cart[index].quantity += 1;
    localStorage.setItem('cart', JSON.stringify(cart));
    loadCart();
  }
}

/**
 * DECREASE ITEM QUANTITY
 */
function decreaseQuantity(index) {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];

  if (index >= 0 && index < cart.length) {
    if (cart[index].quantity > 1) {
      cart[index].quantity -= 1;
      localStorage.setItem('cart', JSON.stringify(cart));
      loadCart();
    } else {
      removeItem(index);
    }
  }
}

/**
 * UPDATE ITEM QUANTITY
 */
function updateQuantity(index, quantity) {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];

  if (quantity <= 0) {
    removeItem(index);
    return;
  }

  if (index >= 0 && index < cart.length) {
    cart[index].quantity = parseInt(quantity) || 1;
    localStorage.setItem('cart', JSON.stringify(cart));
    loadCart();
  }
}

/**
 * REMOVE ITEM FROM CART
 */
function removeItem(index) {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];

  if (index >= 0 && index < cart.length) {
    const item = cart[index];
    cart.splice(index, 1);

    localStorage.setItem('cart', JSON.stringify(cart));
    showSuccess(`${escapeHtml(item.name)} removed from cart`);
    loadCart();
  }
}

// ============================================
// CART TOTALS
// ============================================

/**
 * UPDATE CART TOTALS (SUBTOTAL, TAX, TOTAL)
 */
function updateCartTotals(cart) {
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  subtotalAmount.textContent = `$${subtotal.toFixed(2)}`;
  taxAmount.textContent = `$${tax.toFixed(2)}`;
  totalAmount.textContent = `$${total.toFixed(2)}`;
}

// ============================================
// CHECKOUT
// ============================================

/**
 * HANDLE CHECKOUT
 * Validates cart and sends order to backend
 */
async function handleCheckout() {
  try {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];

    if (cart.length === 0) {
      showError('Cart is empty');
      return;
    }

    // Prepare order data
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * TAX_RATE;
    const totalAmount = subtotal + tax;

    const orderData = {
      userId: currentUser.id,
      items: cart.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price
      })),
      totalAmount: totalAmount
    };

    // Show loading state
    checkoutBtn.disabled = true;
    checkoutBtn.textContent = 'Processing...';

    // Send to backend
    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to place order');
    }

    const data = await response.json();

    if (!data.success || !data.order) {
      throw new Error('Invalid response from server');
    }

    // Clear cart
    localStorage.removeItem('cart');

    // Show confirmation
    showConfirmation(data.order, subtotal, tax, totalAmount);

  } catch (error) {
    console.error('Checkout error:', error);
    showError(error.message || 'Failed to place order. Please try again.');
  } finally {
    checkoutBtn.disabled = false;
    checkoutBtn.textContent = 'Place Order';
  }
}

/**
 * SHOW ORDER CONFIRMATION
 */
function showConfirmation(order, subtotal, tax, total) {
  const itemsText = order.items.length === 1 
    ? '1 item' 
    : `${order.items.length} items`;

  confirmationOrderId.textContent = `Order ID: ${order.id.substring(0, 8)}...`;
  confirmationOrderDetails.textContent = `${itemsText} | Subtotal: $${subtotal.toFixed(2)} | Tax: $${tax.toFixed(2)} | Total: $${total.toFixed(2)}`;
  
  confirmationModal.style.display = 'block';
}

// ============================================
// EMPTY CART STATE
// ============================================

/**
 * SHOW EMPTY CART MESSAGE
 */
function showEmptyCart() {
  cartItemsContainer.innerHTML = '';
  emptyCartState.style.display = 'block';
  cartSummary.style.display = 'none';
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
    window.location.href = 'index.html';
  }
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
  return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * SHOW SUCCESS MESSAGE
 */
function showSuccess(message) {
  successMessage.textContent = message;
  successMessage.style.display = 'block';
  errorMessage.style.display = 'none';
  setTimeout(() => {
    successMessage.style.display = 'none';
  }, 3000);
}

/**
 * SHOW ERROR MESSAGE
 */
function showError(message) {
  errorMessage.textContent = message;
  errorMessage.style.display = 'block';
  successMessage.style.display = 'none';
  setTimeout(() => {
    errorMessage.style.display = 'none';
  }, 3000);
}
