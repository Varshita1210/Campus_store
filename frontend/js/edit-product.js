const API_BASE_URL = 'http://localhost:5000/api';

document.addEventListener('DOMContentLoaded', async () => {
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

    document.getElementById('userDisplay').textContent = `${user.username} (Store Keeper)`;

    // Register logout handler FIRST
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
      });
    }

    // Get product ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
      alert('Product ID not found. Redirecting...');
      return window.location.href = 'storekeeper-dashboard.html';
    }

    // Fetch product details
    try {
      const res = await fetch(`${API_BASE_URL}/products/${productId}`);
      const data = await res.json();
      if (!res.ok || !data.product) throw new Error(data.error || 'Product not found');

      const product = data.product;

      // Verify ownership
      if (product.storeKeeperId !== user.id) {
        alert('You do not have permission to edit this product.');
        return window.location.href = 'storekeeper-dashboard.html';
      }

      // Populate form
      document.getElementById('pName').value = product.name;
      document.getElementById('pDescription').value = product.description || '';
      document.getElementById('pTags').value = (product.tags || []).join(', ');
      document.getElementById('pImage').value = product.imageUrl;
      document.getElementById('pPrice').value = product.price;
    } catch (err) {
      alert('Error: ' + (err.message || 'Failed to load product'));
      return window.location.href = 'storekeeper-dashboard.html';
    }

    const form = document.getElementById('editProductForm');
    const submitBtn = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('pName').value.trim();
    const description = document.getElementById('pDescription').value.trim();
    const tags = document.getElementById('pTags').value.trim();
    const imageUrl = document.getElementById('pImage').value.trim();
    const priceStr = document.getElementById('pPrice').value.trim();

    // Client-side validation
    const errors = [];
    if (!name) errors.push('Product name is required');
    if (!imageUrl) errors.push('Image URL is required');
    if (!priceStr) errors.push('Price is required');
    else {
      const price = parseFloat(priceStr);
      if (isNaN(price) || price <= 0) errors.push('Price must be a positive number');
    }

    if (errors.length) {
      alert('Please fix the following errors:\n• ' + errors.join('\n• '));
      return;
    }

    // Disable submit while posting
    submitBtn.disabled = true;
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Saving...';

    try {
      const price = parseFloat(priceStr);
      const res = await fetch(`${API_BASE_URL}/products/${productId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          name, 
          price, 
          description: description || name, 
          category: 'General', 
          tags: tags ? tags.split(',').map(t=>t.trim()).filter(Boolean) : [], 
          imageUrl 
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update product');
      
      alert('✓ Product updated successfully!');
      window.location.href = 'storekeeper-dashboard.html';
    } catch (err) {
      alert('✗ Error: ' + (err.message || 'Failed to update product'));
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
  } catch (err) {
    console.error('Error in DOMContentLoaded:', err);
    // Still set up logout handler even if there's an error
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
