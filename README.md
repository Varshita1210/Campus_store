# College Merchandise Web Store 🛒

A complete, fully-functional full-stack web application for managing a college merchandise store. Built with vanilla HTML/CSS/JavaScript frontend and Node.js/Express backend with JSON database.

## 🚀 Features

### Student Features
- ✅ **Login/Register** - Simple name + email authentication
- ✅ **Browse Products** - View all merchandise with search and filtering
- ✅ **Shopping Cart** - Add/remove items, adjust quantities
- ✅ **Checkout** - Place orders with automatic total calculation
- ✅ **Order Confirmation** - Receive order ID and details
- ✅ **LocalStorage Persistence** - Cart persists across sessions

### Admin Features
- ✅ **Add Products** - Create new merchandise with details
- ✅ **View Orders** - See all placed student orders in real-time
- ✅ **Auto-Refresh** - Orders update every 5 seconds automatically
- ✅ **Product Management** - Control inventory and categories

## 📁 Project Structure

```
project-root/
│
├── backend/
│   ├── server.js                  # Express server setup
│   ├── package.json               # Node dependencies
│   ├── db.json                    # JSON database
│   ├── routes/
│   │   ├── users.js              # User login/register routes
│   │   ├── products.js           # Product management routes
│   │   └── orders.js             # Order management routes
│   └── utils/
│       └── dbHelper.js           # Database read/write utilities
│
├── frontend/
│   ├── index.html                # Login page
│   ├── products.html             # Product listing page
│   ├── cart.html                 # Shopping cart page
│   ├── admin.html                # Admin panel
│   ├── css/
│   │   └── style.css             # All styling (responsive)
│   └── js/
│       ├── main.js               # Login page logic
│       ├── products.js           # Products page logic
│       ├── cart.js               # Cart page logic
│       └── admin.js              # Admin page logic
│
└── README.md
```

## 💾 Database Design (JSON)

**File:** `backend/db.json`

```json
{
  "users": [
    {
      "id": "uuid-string",
      "name": "John Doe",
      "email": "john@example.com",
      "createdAt": "2026-02-21T10:00:00.000Z"
    }
  ],
  "products": [
    {
      "id": "uuid-string",
      "name": "College T-Shirt",
      "price": 25.99,
      "description": "Official college merchandise",
      "category": "Apparel",
      "createdAt": "2026-02-21T10:00:00.000Z"
    }
  ],
  "orders": [
    {
      "id": "uuid-string",
      "userId": "uuid-string",
      "items": [
        {
          "productId": "uuid-string",
          "quantity": 2,
          "price": 25.99
        }
      ],
      "totalAmount": 56.98,
      "status": "confirmed",
      "createdAt": "2026-02-21T10:00:00.000Z"
    }
  ]
}
```

### How JSON Database Works

The JSON database simulates a real database with these operations:

1. **Read (readDB)** - Reads `db.json` file, parses JSON to JavaScript object
2. **Process** - Application modifies the object in memory
3. **Write (writeDB)** - Serializes object back to JSON and writes to file
4. **Persist** - Changes saved to disk permanently

This mimics how real databases work:
- **Read** = SQL SELECT
- **Write** = SQL INSERT/UPDATE
- **File** = Persistent storage

### Limitations

- **No Concurrency** - Multiple simultaneous writes can corrupt data
- **No Transactions** - Cannot roll back changes if error occurs mid-write
- **No Indexing** - All searches are O(n) linear scans
- **Memory Limited** - Entire database must fit in RAM
- **No Relationships** - No foreign keys or referential integrity
- **No Caching** - Every read hits disk

**In Production:** Use PostgreSQL, MongoDB, or Supabase instead.

## 🔌 API Endpoints

### Users
```
POST /api/users
├─ Body: { "name": "John Doe", "email": "john@example.com" }
├─ Returns: User object with ID
└─ Purpose: Login or register student

GET /api/users/:id
├─ Returns: User details
└─ Purpose: Fetch user info
```

### Products
```
GET /api/products
├─ Returns: Array of all products
├─ Query: None
└─ Purpose: List all merchandise

GET /api/products/:id
├─ Returns: Single product object
└─ Purpose: Get product details

POST /api/products
├─ Body: { "name": "...", "price": 25.99, "description": "...", "category": "..." }
├─ Returns: Created product object
└─ Purpose: Admin adds new product
```

### Orders
```
POST /api/orders
├─ Body: { "userId": "...", "items": [...], "totalAmount": 56.98 }
├─ Returns: Order object with ID
└─ Purpose: Student places order

GET /api/orders
├─ Query: userId (optional)
├─ Returns: All orders or filtered by user
└─ Purpose: View orders

GET /api/orders/:id
├─ Returns: Single order object
└─ Purpose: Get order details
```

## 🔐 Error Handling

### Frontend
- **Input Validation** - Email format, required fields checked
- **Network Errors** - Try/catch blocks handle API failures
- **Empty States** - "No products" or "Empty cart" messages
- **User Feedback** - Success/error messages displayed
- **Button States** - Disabled during loading

### Backend
- **Try/Catch** - All routes wrapped in error handlers
- **Field Validation** - All required fields checked
- **Type Validation** - Price must be number, quantity > 0
- **JSON Parsing** - Invalid JSON returns sensible defaults
- **Graceful Degradation** - Server never crashes

### Edge Cases Handled
✅ Empty database file
✅ Missing fields in requests
✅ Duplicate emails (allows re-login)
✅ Duplicate product names (prevented)
✅ Empty cart submission (shows error)
✅ Invalid product IDs (shows error)
✅ Corrupted JSON (returns defaults)
✅ Server offline (shows network error)
✅ No products available
✅ No orders available
✅ Negative prices/quantities (prevented)

## 🛠️ Setup Instructions

### Prerequisites
## Deployment & Security (Quick Start)

To run the app on another laptop (local) and follow security-by-depth practices:

1. Copy the repository to the target machine.
2. In `backend/`, create a `.env` file from `.env.example` and set a strong `JWT_SECRET`.
3. Install dependencies and start the backend:

```bash
cd backend
npm install
# create .env from .env.example and set JWT_SECRET
npm start
```

4. Open `http://<host>:5000` in the browser (default: http://localhost:5000).

Security notes:
- The backend now issues short-lived JWT access tokens and longer-lived refresh tokens. Keep `JWT_SECRET` secret.
- For production, run behind TLS (use nginx or a reverse proxy) and enable HTTP Strict Transport Security.
- Consider Dockerizing the app for reproducible deployment across laptops.

- Node.js 16+ (LTS version)
- npm (comes with Node)
- Git

### Installation

1. **Navigate to project**
```bash
cd backend
```

2. **Install dependencies**
```bash
npm install
```

This installs:
- `express` - Web framework
- `uuid` - Generate unique IDs
- `cors` - Enable cross-origin requests

3. **Start server**
```bash
npm start
# or
node server.js
```

Output:
```
╔════════════════════════════════════════════╗
║   College Merchandise Web Store - Backend   ║
╚════════════════════════════════════════════╝

✅ Server running at http://localhost:5000
✅ Frontend: http://localhost:5000
✅ API: http://localhost:5000/api
```

4. **Open frontend**
- In browser, go to: `http://localhost:5000`
- Or open directly: `frontend/index.html` (cart won't work without backend)

### Start as Student
1. Click "Login / Register"
2. Enter name and email
3. Browse products
4. Add items to cart
5. Proceed to checkout
6. Confirm order

### Start as Admin
1. From login page: Click "Go to Admin Panel"
2. Add new products with details
3. View all orders in real-time
4. Orders auto-refresh every 5 seconds

## 📊 Data Flow

```
┌─────────────────────────────────────────────┐
│           STUDENT WORKFLOW                  │
└─────────────────────────────────────────────┘

index.html (Login)
    ↓ POST /api/users
backend/db.json (saves user)
    ↓
products.html (Browse)
    ↓ GET /api/products
backend/db.json (reads products)
    ↓
cart.html (Add to localStorage)
    ↓
checkout (POST /api/orders)
backend/db.json (saves order)
    ↓
Confirmation Page

┌─────────────────────────────────────────────┐
│           ADMIN WORKFLOW                    │
└─────────────────────────────────────────────┘

admin.html (Add Product)
    ↓ POST /api/products
backend/db.json (saves product)
    ↓ Products appear on students' pages
    
admin.html (View Orders)
    ↓ GET /api/orders (every 5 seconds)
backend/db.json (reads all orders)
    ↓
Orders displayed in real-time
```

## 🧪 Testing Scenarios

### Test 1: Complete Purchase
1. Login as student
2. Add 3 products to cart
3. Adjust quantities
4. Place order
5. Check admin panel - order appears

### Test 2: Duplicate Login
1. Login with same email twice
2. Should allow and return same user
3. Cart persists across logins

### Test 3: Empty Cart
1. Login
2. Try to checkout without items
3. Should show "Cart cannot be empty" error

### Test 4: Add Duplicate Product
1. Admin adds product "T-Shirt"
2. Admin tries to add "T-Shirt" again
3. Should show error "Product already exists"

### Test 5: Filtering
1. Browse products
2. Search for "shirt"
3. Filter by category
4. Results update instantly

### Test 6: Local Storage
1. Add items to cart
2. Close browser completely
3. Reopen at login page
4. Login again
5. Cart items still there

## 🌐 Browser Compatibility

- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ✅ Mobile browsers

All modern browsers support:
- ES6 JavaScript
- LocalStorage API
- Fetch API
- CSS Grid/Flexbox

## 📱 Responsive Design

- **Desktop** - 1200px+ (3-column grid)
- **Tablet** - 768px-1199px (2-column grid)
- **Mobile** - <768px (1-column, optimized)

All pages are mobile-first and touch-friendly.

## 🚀 Deployment

### Local Network (LAN)
```bash
# Find your IP
ipconfig (Windows) or ifconfig (Mac/Linux)

# Update frontend API URL to:
http://192.168.x.x:5000/api

# Share link with others on network
http://192.168.x.x:5000
```

### Public (Heroku/Replit)
1. Modify API_BASE_URL in JavaScript files
2. Deploy backend to cloud platform
3. Frontend works from anywhere

## 🔄 Git Workflow

### Initialize Repository
```bash
git init
git add .
git commit -m "Initial commit: Full-stack merchandise store"
```

### Basic Commands
```bash
# Check status
git status

# Stage changes
git add .

# Commit with message
git commit -m "Add product validation"

# Push to GitHub
git push origin main
```

### Typical Commits
```
Initial commit: Full-stack app setup
Fix: Email validation on login
Feature: Add category filtering
Refactor: Improve error messages
Update: Add favicon and SEO
```

## 🐛 Troubleshooting

### "Cannot find module 'express'"
```bash
cd backend
npm install
```

### "Port 5000 already in use"
```bash
# Change port in server.js from 5000 to 3000
# Update API_BASE_URL in JavaScript files
```

### "db.json file not found"
- Server creates it automatically
- Check backend folder permissions
- Manually create empty `db.json` with: `{"users":[],"products":[],"orders":[]}`

### "CORS error"
- CORS middleware is enabled in server.js
- Check frontend API URL matches backend port
- Clear browser cache

### "Cart not saving"
- Check browser localStorage is enabled
- Open DevTools → Application → LocalStorage
- Verify "cart" and "user" keys exist

## 📈 Future Improvements

- [ ] **User Authentication** - Password-based login
- [ ] **Product Images** - Upload/display images
- [ ] **Payment Gateway** - Stripe or PayPal integration
- [ ] **Email Notifications** - Send order confirmation emails
- [ ] **Admin Dashboard** - Charts and analytics
- [ ] **SQLite Database** - Replace JSON with SQLite
- [ ] **API Documentation** - Swagger/OpenAPI
- [ ] **Unit Tests** - Jest/Mocha test suite
- [ ] **Rate Limiting** - Prevent abuse
- [ ] **User Roles** - Admin vs Student permissions
- [ ] **Wishlist Feature** - Save favorites
- [ ] **Reviews & Ratings** - Customer feedback
- [ ] **Inventory Tracking** - Stock management
- [ ] **Discount Codes** - Apply coupons
- [ ] **Mobile App** - React Native version

## 📝 License

This project is free to use and modify for educational purposes.

## 🤝 Contributing

For improvements:
1. Fork repository
2. Create feature branch
3. Commit changes
4. Push and create Pull Request

---

**Built with ❤️ for college students** | Last updated: February 2026
