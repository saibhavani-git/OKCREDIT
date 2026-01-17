# Next.js Backend Guide - Complete Explanation

## 📋 Overview
This guide explains all the changes made to your Next.js backend and how to use them.

---

## 🔧 **CHANGES MADE**

### 1. **Authentication Middleware** (`app/lib/auth.js`)

**What Changed:**
- Converted from Next.js automatic middleware (runs on all routes) to a **reusable function**
- Now you control where authentication is applied

**How It Works:**
```javascript
// Location: app/lib/auth.js
export function middleware(request) {
  // 1. Gets JWT token from cookies
  // 2. Verifies the token
  // 3. Returns { userId } if valid
  // 4. Throws error if invalid
}
```

**How to Use in Any Route:**
```javascript
import { middleware } from "../../lib/auth";

export async function GET(request) {
  try {
    // Get userId from token
    const { userId } = middleware(request);
    
    // Now use userId for your logic
    const user = await User.findById(userId);
    // ...
  } catch (e) {
    if (e.message.includes("Unauthorized")) {
      return NextResponse.json(
        { message: e.message },
        { status: 401 }
      );
    }
  }
}
```

**Key Points:**
- ✅ Only runs when you call it
- ✅ Returns `{ userId }` from JWT token
- ✅ Throws error if token missing/invalid
- ✅ Use in protected routes only

---

### 2. **User Cards Route** (`app/api/userCards/route.js`)

**What Changed:**
- Fixed to use middleware function
- Fixed card retrieval (direct query instead of populate)
- Proper error handling

**How It Works:**
```javascript
// 1. Connect to database
await dbConnect();

// 2. Get userId from middleware
const { userId } = middleware(request);

// 3. Find user
const user = await User.findById(userId);

// 4. Get card IDs from user
const cardIds = user.cards.map(id => new mongoose.Types.ObjectId(id));

// 5. Query cards directly
const cards = await CreditCard.find({ _id: { $in: cardIds } });

// 6. Return cards
return NextResponse.json(cards);
```

**Why Direct Query?**
- `populate()` wasn't working (returned empty array)
- Direct query with `$in` operator is more reliable
- Gets all cards whose IDs are in user's cards array

---

### 3. **Login Route** (`app/api/auth/login/route.js`)

**What Changed:**
- Removed unused `cookies` import
- Already had proper password comparison

**How It Works:**
```javascript
// 1. Get email/password from request
const { email, password } = await request.json();

// 2. Find user by email
const user = await User.findOne({ email });

// 3. Compare password
const isMatch = await bcrypt.compare(password, user.password);

// 4. Generate JWT token
const token = generateToken(user);

// 5. Set cookie with token
response.cookies.set('authToken', token, {
  httpOnly: true,
  sameSite: 'lax',
  maxAge: 60*60*12, // 12 hours
  path: '/'
});
```

---

### 4. **Register Route** (`app/api/auth/register/route.js`)

**What Changed:**
- Fixed: Added `const` to token declaration (was causing error)
- Fixed: Changed message from "Login successful" to "Registration successful"

**How It Works:**
```javascript
// 1. Check if user exists
const user = await User.findOne({ email: data.email });

// 2. Hash password
const hashedPassword = await bcrypt.hash(data.password, 10);

// 3. Create user
const newUser = await User.create({
  ...data,
  password: hashedPassword
});

// 4. Generate token and set cookie (same as login)
```

---

### 5. **Database Seeding** (`app/seeds/db.seeds.js`)

**What Changed:**
- Added User creation
- Clears all data before seeding
- Creates test user with cards assigned

**How to Use:**
```bash
npm run seed
```

**What It Does:**
1. Clears all cards and users
2. Inserts 8 credit cards
3. Creates test user: `test@example.com` / `password123`
4. Assigns 3 cards to test user

---

## 🏗️ **NEXT.JS BACKEND STRUCTURE**

### **Route Handlers** (`app/api/`)

Next.js uses **Route Handlers** for API endpoints:

```
app/
  api/
    auth/
      login/
        route.js    → POST /api/auth/login
      register/
        route.js   → POST /api/auth/register
    userCards/
      route.js      → GET /api/userCards
```

**Route Handler Pattern:**
```javascript
// app/api/your-route/route.js
import { NextResponse } from "next/server";

export async function GET(request) {
  // Handle GET request
  return NextResponse.json({ data: "..." });
}

export async function POST(request) {
  // Handle POST request
  const data = await request.json();
  return NextResponse.json({ success: true });
}
```

---

## 📝 **HOW TO CREATE A NEW PROTECTED ROUTE**

### Step 1: Create Route File
Create `app/api/your-route/route.js`

### Step 2: Add Authentication
```javascript
import { NextResponse } from "next/server";
import dbConnect from "../../lib/db";
import { middleware } from "../../lib/auth";
import User from "../../models/user";

export async function GET(request) {
  try {
    await dbConnect();
    
    // Get userId from token
    const { userId } = middleware(request);
    
    // Your protected logic here
    const user = await User.findById(userId);
    
    return NextResponse.json({ user });
  } catch (e) {
    if (e.message.includes("Unauthorized")) {
      return NextResponse.json(
        { message: e.message },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}
```

---

## 🔐 **AUTHENTICATION FLOW**

### **1. Registration/Login**
```
User → POST /api/auth/register (or /login)
  → Server creates/verifies user
  → Generates JWT token
  → Sets cookie: authToken
  → Returns success
```

### **2. Protected Route Access**
```
User → GET /api/userCards
  → Server reads authToken cookie
  → middleware() verifies token
  → Extracts userId
  → Returns user's data
```

### **3. Token Structure**
```javascript
// Token contains:
{
  userId: "696264fe8e3a9ac714fa656c",
  iat: 1234567890,
  exp: 1234654290
}

// Generated by: app/lib/generateToken.js
jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1d' })
```

---

## 🗄️ **DATABASE STRUCTURE**

### **User Model** (`app/models/user.js`)
```javascript
{
  username: String,
  email: String (unique),
  password: String (hashed),
  cards: [ObjectId] // References to CreditCard
}
```

### **CreditCard Model** (`app/models/cards.js`)
```javascript
{
  bank: String,
  cardName: String,
  network: "Visa" | "Mastercard" | "RuPay" | "Amex",
  cardType: "Cashback" | "Travel" | "Fuel" | "Shopping" | "Basic",
  // ... other fields
}
```

### **Relationship**
- User has array of Card ObjectIds
- Cards are stored separately
- Query cards using `$in` operator with user's card IDs

---

## 🚀 **COMMON PATTERNS**

### **Pattern 1: Protected Route**
```javascript
export async function GET(request) {
  const { userId } = middleware(request);
  // Use userId...
}
```

### **Pattern 2: Database Query**
```javascript
await dbConnect();
const user = await User.findById(userId);
```

### **Pattern 3: Error Handling**
```javascript
try {
  // Your code
} catch (e) {
  if (e.message.includes("Unauthorized")) {
    return NextResponse.json({ message: e.message }, { status: 401 });
  }
  return NextResponse.json({ message: "Error" }, { status: 500 });
}
```

### **Pattern 4: Cookie Setting**
```javascript
const response = NextResponse.json({ message: "Success" });
response.cookies.set('authToken', token, {
  httpOnly: true,
  sameSite: 'lax',
  maxAge: 60*60*12,
  path: '/'
});
return response;
```

---

## 📦 **FILE STRUCTURE**

```
app/
  api/                    # API Routes
    auth/
      login/route.js      # Login endpoint
      register/route.js   # Register endpoint
    userCards/route.js    # Get user's cards
  
  lib/                    # Utility functions
    auth.js              # Authentication middleware
    db.js                # Database connection
    generateToken.js     # JWT token generator
  
  models/                 # Mongoose models
    user.js              # User schema
    cards.js             # CreditCard schema
  
  seeds/                  # Database seeding
    db.seeds.js          # Seed script
```

---

## ✅ **SUMMARY OF FIXES**

1. ✅ **Middleware**: Converted to reusable function (not automatic)
2. ✅ **User Cards**: Fixed card retrieval (direct query)
3. ✅ **Register**: Fixed token declaration and message
4. ✅ **Login**: Removed unused import
5. ✅ **Seeding**: Added user creation with cards
6. ✅ **Models**: Fixed import path (added .js extension)

---

## 🎯 **QUICK REFERENCE**

**Protect a route:**
```javascript
const { userId } = middleware(request);
```

**Query database:**
```javascript
await dbConnect();
const data = await Model.find({});
```

**Return JSON:**
```javascript
return NextResponse.json({ data });
```

**Set cookie:**
```javascript
response.cookies.set('name', value, options);
```

**Seed database:**
```bash
npm run seed
```

---

This is your complete backend setup! 🎉

