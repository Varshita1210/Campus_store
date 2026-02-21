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
    console.log('1) Health check');
    const h = await req('/api/health');
    console.log(h);

    console.log('\n2) Signup storekeeper');
    const uniqueSuffix = Date.now().toString(36);
    const signupPayload = {
      username: `smoke_store_${uniqueSuffix}`,
      email: `smoke_store_${uniqueSuffix}@example.com`,
      password: 'testpass',
      role: 'storekeeper',
      storeName: 'Smoke Store',
      location: 'Test Campus'
    };
    const s = await req('/api/users/signup', 'POST', signupPayload);
    console.log(s);

    if (!s.body || !s.body.user) {
      console.error('Signup failed — stopping');
      return;
    }

    const user = s.body.user;

    console.log('\n3) Signin storekeeper');
    const signin = await req('/api/users/signin', 'POST', { email: signupPayload.email, password: signupPayload.password });
    console.log(signin);
    if (!signin.body || !signin.body.user) {
      console.error('Signin failed — stopping');
      return;
    }

    console.log('\n4) Add product');
    const productPayload = {
      storeKeeperId: user.id,
      name: 'Smoke Test Tee',
      price: 9.99,
      description: 'Test product',
      category: 'Apparel',
      tags: ['test','tee'],
      imageUrl: 'https://example.com/test.jpg'
    };
    const add = await req('/api/products', 'POST', productPayload);
    console.log(add);

    console.log('\n5) Get products for storekeeper');
    const list = await req(`/api/products/storekeeper/${user.id}`);
    console.log(list);

  } catch (err) {
    console.error('Error during smoke test:', err);
  }
})();
