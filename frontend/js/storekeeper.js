const API_BASE_URL = 'http://localhost:5000/api';

document.addEventListener('DOMContentLoaded', () => {
  try {
    const userRaw = localStorage.getItem('user');
    if (!userRaw) {
      window.location.href = 'index.html';
      return;
    }
    const user = JSON.parse(userRaw);
    if (user.role !== 'storekeeper') {
      window.location.href = 'student-dashboard.html';
      return;
    }

    document.getElementById('welcome').textContent = `Welcome to your store, ${user.username}! Manage your products and track orders.`;
    document.getElementById('userDisplay').textContent = `${user.username} (Store Keeper) — ${user.storeName || 'My Store'}`;

    // Logout handler - register this FIRST before any async calls
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
      });
    }

    // Load products and orders
    fetchMyProducts(user.id);
    fetchMyOrders(user.id);
  } catch (err) {
    console.error('Error in DOMContentLoaded:', err);
    // Still try to set up logout handler even if there's an error
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
      });
    }
  }
});

async function fetchMyProducts(storeKeeperId) {
  try {
    const res = await fetch(`${API_BASE_URL}/products/storekeeper/${storeKeeperId}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load products');

    const container = document.getElementById('myProducts');
    const noMsg = document.getElementById('noProductsMsg');

    if ((data.products || []).length === 0) {
      container.innerHTML = '';
      noMsg.style.display = 'block';
      return;
    }

    noMsg.style.display = 'none';
    container.innerHTML = '';
    (data.products || []).forEach(p => {
      const el = document.createElement('div');
      el.className = 'product-card';
      el.innerHTML = `
        <img src="${p.imageUrl}" alt="${p.name}" />
        <h3>${p.name}</h3>
        <p>${p.description || ''}</p>
        <p><strong style="font-size: 1.3rem;">$${p.price.toFixed(2)}</strong></p>
        <p style="font-size: 0.85rem; color: var(--text-light);">
          Tags: ${(p.tags||[]).join(', ') || 'None'}
        </p>
        <div class="product-actions" style="display:flex; gap:0.5rem; margin-top:1rem;">
          <a href="storekeeper-edit-product.html?id=${p.id}" class="btn btn-small" style="flex:1;">Edit</a>
          <button class="btn btn-small btn-danger" onclick="deleteProduct('${p.id}', '${storeKeeperId}')" style="flex:1;">Delete</button>
        </div>
      `;
      container.appendChild(el);
    });
  } catch (err) {
    document.getElementById('myProducts').innerHTML = `<p style="color: red;">${err.message}</p>`;
  }
}

async function deleteProduct(productId, storeKeeperId) {
  if (!confirm('Are you sure you want to delete this product? This cannot be undone.')) return;

  try {
    const res = await fetch(`${API_BASE_URL}/products/${productId}`, {
      method: 'DELETE',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete product');
    
    alert('Product deleted successfully!');
    fetchMyProducts(storeKeeperId);
  } catch (err) {
    alert('Error: ' + (err.message || 'Failed to delete product'));
  }
}

async function fetchMyOrders(storeKeeperId) {
  try {
    const res = await fetch(`${API_BASE_URL}/orders/storekeeper/${storeKeeperId}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load orders');

    const container = document.getElementById('orders');
    const noMsg = document.getElementById('noOrdersMsg');

    if ((data.orders || []).length === 0) {
      container.innerHTML = '';
      noMsg.style.display = 'block';
      return;
    }

    noMsg.style.display = 'none';
    container.innerHTML = '';
    (data.orders || []).forEach(order => {
      const el = document.createElement('div');
      el.className = 'order-card';
      el.innerHTML = `
        <h4>Order #${order.id.slice(0, 8)}</h4>
        <p><strong>Status:</strong> ${order.status}</p>
        <p><strong>Total:</strong> $${order.totalAmount.toFixed(2)}</p>
        <p><strong>Items:</strong> ${order.items.length}</p>
        <p><small>${new Date(order.createdAt).toLocaleDateString()}</small></p>
      `;
      container.appendChild(el);
    });
  } catch (err) {
    document.getElementById('orders').innerHTML = `<p style="color: red;">${err.message}</p>`;
  }
}
