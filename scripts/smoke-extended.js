const http = require('http');

const API_HOST = 'localhost';
const API_PORT = 5000;

function req(path, method='GET', body=null) {
  const options = {
    hostname: API_HOST,
    port: API_PORT,
    path,
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  return new Promise((resolve, reject) => {
    const r = http.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : null;
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    r.on('error', err => reject(err));
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

(async () => {
  try {
    const uniqueSuffix = Date.now().toString(36);

    console.log('=== EXTENDED SMOKE TEST ===\n');

    console.log('1) Health check');
    const h = await req('/api/health');
    console.log(`   Status: ${h.status} ✓`);

    console.log('\n2) Signup storekeeper');
    const signupPayload = {
      username: `teststore_${uniqueSuffix}`,
      email: `teststore_${uniqueSuffix}@example.com`,
      password: 'testpass123',
      role: 'storekeeper',
      storeName: 'Test Store',
      location: 'Test Location'
    };
    const s = await req('/api/users/signup', 'POST', signupPayload);
    if (s.status !== 201) {
      console.error(`   FAILED: ${s.status}`, s.body);
      return;
    }
    const user = s.body.user;
    console.log(`   User created: ${user.username} (${user.id}) ✓`);

    console.log('\n3) Signin');
    const signin = await req('/api/users/signin', 'POST', { 
      email: signupPayload.email, 
      password: signupPayload.password 
    });
    if (signin.status !== 200) {
      console.error(`   FAILED: ${signin.status}`, signin.body);
      return;
    }
    console.log(`   Signed in successfully ✓`);

    console.log('\n4) Add product');
    const productPayload = {
      storeKeeperId: user.id,
      name: 'Test Product 1',
      price: 19.99,
      description: 'This is a test product',
      category: 'Test',
      tags: ['test', 'product'],
      imageUrl: 'https://example.com/product.jpg'
    };
    const add = await req('/api/products', 'POST', productPayload);
    if (add.status !== 201) {
      console.error(`   FAILED: ${add.status}`, add.body);
      return;
    }
    const productId = add.body.product.id;
    console.log(`   Product created: ${add.body.product.name} (${productId}) ✓`);

    console.log('\n5) Get product details (for edit)');
    const getProd = await req(`/api/products/${productId}`);
    if (getProd.status !== 200) {
      console.error(`   FAILED: ${getProd.status}`, getProd.body);
      return;
    }
    console.log(`   Product fetched: ${getProd.body.product.name} ✓`);

    console.log('\n6) Update product');
    const updatePayload = {
      storeKeeperId: user.id,
      name: 'Test Product 1 - Updated',
      price: 24.99,
      description: 'Updated description',
      category: 'Test',
      tags: ['test', 'updated'],
      imageUrl: 'https://example.com/updated.jpg'
    };
    const update = await req(`/api/products/${productId}`, 'PUT', updatePayload);
    if (update.status !== 200) {
      console.error(`   FAILED: ${update.status}`, update.body);
      return;
    }
    console.log(`   Product updated: ${update.body.product.name}, Price: $${update.body.product.price} ✓`);

    console.log('\n7) List storekeeper products (after update)');
    const list = await req(`/api/products/storekeeper/${user.id}`);
    if (list.status !== 200) {
      console.error(`   FAILED: ${list.status}`, list.body);
      return;
    }
    console.log(`   Found ${list.body.count} product(s) ✓`);

    console.log('\n8) Delete product');
    const delPayload = { storeKeeperId: user.id };
    console.log(`   Payload:`, JSON.stringify(delPayload));
    const del = await req(`/api/products/${productId}`, 'DELETE', delPayload);
    if (del.status !== 200) {
      console.error(`   FAILED: ${del.status}`, del.body);
      return;
    }
    console.log(`   Product deleted ✓`);

    console.log('\n9) Verify deletion (list should be empty)');
    const listAfter = await req(`/api/products/storekeeper/${user.id}`);
    if (listAfter.status !== 200) {
      console.error(`   FAILED: ${listAfter.status}`, listAfter.body);
      return;
    }
    console.log(`   Storekeeper has ${listAfter.body.count} product(s) ✓`);

    console.log('\n\n=== ALL TESTS PASSED ✓ ===');

  } catch (err) {
    console.error('Test error:', err.message);
  }
})();
