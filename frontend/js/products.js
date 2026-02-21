/**
 * PRODUCTS.JS - PRODUCTS PAGE
 * Displays all products, filtering, searching, and cart management
 * 
 * WORKFLOW:
 * 1. Page loads, fetch products from backend (GET /api/products)
 * 2. Display products in grid
 * 3. User can filter by category, search by name
 * 4. Click product to see details
 * 5. Add to cart button stores item in localStorage
 * 6. Cart count updated in header
 */

// Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// DOM Elements
const productsContainer = document.getElementById('productsContainer');
const loadingSpinner = document.getElementById('loadingSpinner');
const emptyState = document.getElementById('emptyState');
const errorState = document.getElementById('errorState');
const errorStateMessage = document.getElementById('errorStateMessage');
const successMessage = document.getElementById('successMessage');
const errorMessage = document.getElementById('errorMessage');
const userGreeting = document.getElementById('userGreeting');
const cartCountBadge = document.getElementById('cartCount');
const logoutBtn = document.getElementById('logoutBtn');
const searchInput = document.getElementById('searchInput');
const filterBtns = document.querySelectorAll('.filter-btn');
const productModal = document.getElementById('productModal');
const modalClose = document.querySelector('.close');
const modalAddToCartBtn = document.getElementById('modalAddToCartBtn');

// State
let allProducts = [];
let currentUser = null;
let selectedProductId = null;

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
  userGreeting.textContent = `Welcome, ${currentUser.name}!`;

  // Setup event listeners
  logoutBtn.addEventListener('click', handleLogout);
  searchInput.addEventListener('input', filterProducts);
  filterBtns.forEach(btn => {
    btn.addEventListener('click', handleCategoryFilter);
  });
  modalClose.addEventListener('click', closeModal);
  modalAddToCartBtn.addEventListener('click', addProductToCart);
  window.addEventListener('click', closeModalOnBackdrop);

  // Load products
  loadProducts();

  // Update cart count
  updateCartCount();
});

// ============================================
// LOAD PRODUCTS
// ============================================

/**
 * LOAD PRODUCTS FROM BACKEND
 * Makes API call to GET /api/products
 * Displays products or shows empty state
 */
async function loadProducts() {
  try {
    loadingSpinner.style.display = 'block';
    emptyState.style.display = 'none';
    errorState.style.display = 'none';
    productsContainer.innerHTML = '';

    const response = await fetch(`${API_BASE_URL}/products`);

    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }

    const data = await response.json();

    if (!data.success || !Array.isArray(data.products)) {
      throw new Error('Invalid response from server');
    }

    allProducts = data.products;

    if (allProducts.length === 0) {
      emptyState.style.display = 'block';
      loadingSpinner.style.display = 'none';
      return;
    }

    // Display products
    displayProducts(allProducts);
    loadingSpinner.style.display = 'none';

  } catch (error) {
    console.error('Load products error:', error);
    loadingSpinner.style.display = 'none';
    errorState.style.display = 'block';
    errorStateMessage.textContent = error.message || 'Failed to load products';
  }
}

// ============================================
// DISPLAY PRODUCTS
// ============================================

/**
 * DISPLAY PRODUCTS IN GRID
 * Creates product cards dynamically
 */
function displayProducts(products) {
  productsContainer.innerHTML = '';

  if (products.length === 0) {
    emptyState.style.display = 'block';
    return;
  }

  products.forEach(product => {
    const productCard = createProductCard(product);
    productsContainer.appendChild(productCard);
  });
}

/**
 * CREATE PRODUCT CARD ELEMENT
 */
function createProductCard(product) {
  const card = document.createElement('div');
  card.className = 'product-card';
  card.innerHTML = `
    <div class="product-image">
      <div class="product-icon">📦</div>
    </div>
    <div class="product-info">
      <h3 class="product-name">${escapeHtml(product.name)}</h3>
      <p class="product-category">${escapeHtml(product.category)}</p>
      <p class="product-description">${escapeHtml(product.description)}</p>
      <div class="product-footer">
        <span class="product-price">$${parseFloat(product.price).toFixed(2)}</span>
        <button class="btn btn-small btn-primary" data-product-id="${product.id}">
          View & Add
        </button>
      </div>
    </div>
  `;

  // Add click listener to view button
  const viewBtn = card.querySelector('[data-product-id]');
  viewBtn.addEventListener('click', () => {
    showProductModal(product);
  });

  return card;
}

// ============================================
// PRODUCT MODAL
// ============================================

/**
 * SHOW PRODUCT MODAL WITH DETAILS
 */
function showProductModal(product) {
  selectedProductId = product.id;
  document.getElementById('modalProductName').textContent = product.name;
  document.getElementById('modalProductCategory').textContent = product.category;
  document.getElementById('modalProductDescription').textContent = product.description;
  document.getElementById('modalProductPrice').textContent = `$${parseFloat(product.price).toFixed(2)}`;
  document.getElementById('quantityInput').value = 1;
  
  productModal.style.display = 'block';
}

/**
 * CLOSE PRODUCT MODAL
 */
function closeModal() {
  productModal.style.display = 'none';
  selectedProductId = null;
}

/**
 * CLOSE MODAL ON BACKDROP CLICK
 */
function closeModalOnBackdrop(e) {
  if (e.target === productModal) {
    closeModal();
  }
}

// ============================================
// ADD TO CART
// ============================================

/**
 * ADD PRODUCT TO CART
 * Stores item in localStorage
 * Updates cart count
 */
function addProductToCart() {
  if (!selectedProductId) return;

  const product = allProducts.find(p => p.id === selectedProductId);
  if (!product) {
    showError('Product not found');
    return;
  }

  const quantity = parseInt(document.getElementById('quantityInput').value) || 1;

  if (quantity <= 0) {
    showError('Quantity must be greater than 0');
    return;
  }

  // Get existing cart
  let cart = JSON.parse(localStorage.getItem('cart')) || [];

  // Check if product already in cart
  const existingItem = cart.find(item => item.productId === product.id);

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      category: product.category,
      quantity: quantity
    });
  }

  // Save cart to localStorage
  localStorage.setItem('cart', JSON.stringify(cart));

  // Update UI
  updateCartCount();
  closeModal();
  showSuccess(`Added ${product.name} to cart!`);
}

// ============================================
// FILTERING & SEARCHING
// ============================================

/**
 * FILTER PRODUCTS BY CATEGORY
 */
function handleCategoryFilter(e) {
  const category = e.target.dataset.category;

  // Update active button
  filterBtns.forEach(btn => btn.classList.remove('active'));
  e.target.classList.add('active');

  // Filter products
  filterProducts();
}

/**
 * FILTER AND SEARCH PRODUCTS
 * Combines search input and category filter
 */
function filterProducts() {
  const searchQuery = searchInput.value.toLowerCase();
  const activeCategory = document.querySelector('.filter-btn.active').dataset.category;

  const filtered = allProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery) ||
                         product.description.toLowerCase().includes(searchQuery);
    const matchesCategory = activeCategory === 'all' || product.category === activeCategory;

    return matchesSearch && matchesCategory;
  });

  displayProducts(filtered);
}

// ============================================
// CART MANAGEMENT
// ============================================

/**
 * UPDATE CART COUNT BADGE
 */
function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartCountBadge.textContent = totalItems;
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
