const API_BASE_URL = 'http://localhost:5000/api';
let allProducts = [];

document.addEventListener('DOMContentLoaded', () => {
  const userRaw = localStorage.getItem('user');
  if (!userRaw) {
    window.location.href = 'index.html';
    return;
  }
  const user = JSON.parse(userRaw);
  document.getElementById('welcome').textContent = `Welcome back, ${user.username}! Browse products from your favorite store keepers.`;
  document.getElementById('userDisplay').textContent = `${user.username} (Student)`;

  fetchProducts();

  // Search and filter handlers
  document.getElementById('searchInput').addEventListener('input', filterProducts);
  document.getElementById('tagFilter').addEventListener('change', filterProducts);

  // Logout handler
  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
  });
});

async function fetchProducts() {
  try {
    const res = await fetch(`${API_BASE_URL}/products`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load products');

    allProducts = data.products || [];
    populateTags();
    renderProducts(allProducts);
  } catch (err) {
    document.getElementById('products').innerHTML = `<p style="color: red; grid-column: 1/-1;">${err.message}</p>`;
  }
}

function populateTags() {
  const allTags = new Set();
  allProducts.forEach(p => {
    (p.tags || []).forEach(t => allTags.add(t));
  });
  const tagFilter = document.getElementById('tagFilter');
  Array.from(allTags).sort().forEach(tag => {
    const opt = document.createElement('option');
    opt.value = tag;
    opt.textContent = tag.charAt(0).toUpperCase() + tag.slice(1);
    tagFilter.appendChild(opt);
  });
}

function filterProducts() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const selectedTag = document.getElementById('tagFilter').value;

  const filtered = allProducts.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm) || 
                         (p.description || '').toLowerCase().includes(searchTerm);
    const matchesTag = !selectedTag || (p.tags || []).includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  renderProducts(filtered);
}

function renderProducts(products) {
  const container = document.getElementById('products');
  const noProducts = document.getElementById('noProducts');

  if (products.length === 0) {
    container.innerHTML = '';
    noProducts.style.display = 'block';
    return;
  }

  noProducts.style.display = 'none';
  container.innerHTML = '';

  products.forEach(p => {
    const el = document.createElement('div');
    el.className = 'product-card';
    el.innerHTML = `
      <img src="${p.imageUrl}" alt="${p.name}" />
      <h3>${p.name}</h3>
      <p>${p.description || 'Premium college merchandise'}</p>
      <p><strong style="font-size: 1.3rem;">$${p.price.toFixed(2)}</strong></p>
      <p style="font-size: 0.85rem; color: var(--text-light);">
        ${(p.tags || []).map(t => `<span style="background: var(--light-bg); padding: 0.25rem 0.5rem; border-radius: 4px; display: inline-block; margin-right: 0.25rem;">${t}</span>`).join('')}
      </p>
    `;
    container.appendChild(el);
  });
}
