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

    document.getElementById('userDisplay').textContent = `${user.username} (Store Keeper)`;

    // Logout - register first before form setup
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
      });
    }

    const form = document.getElementById('addProductForm');
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
    submitBtn.textContent = 'Adding...';

    try {
      const price = parseFloat(priceStr);
      const res = await fetch(`${API_BASE_URL}/products`, {
        method: 'POST',
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
      if (!res.ok) throw new Error(data.error || 'Failed to add product');
      
      alert('✓ Product added successfully!');
      window.location.href = 'storekeeper-dashboard.html';
    } catch (err) {
      alert('✗ Error: ' + (err.message || 'Failed to add product'));
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
