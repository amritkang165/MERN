<div align="center">

# ShopKart

### A thoughtful little storefront, built with the MERN stack.

Browse products, save favorites, manage your cart, and place orders in a responsive full-stack shop.

<p>
  <img alt="React" src="https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white">
  <img alt="Vite" src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white">
  <img alt="Node.js" src="https://img.shields.io/badge/Node.js-Express-339933?logo=nodedotjs&logoColor=white">
  <img alt="MongoDB" src="https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white">
</p>

<img
  src="./Screenshot%202026-10-01%20at%202.46.57%E2%80%AFPM.png"
  alt="ShopKart account registration page"
  width="100%"
>

</div>

## About

ShopKart is a full-stack e-commerce application with a React storefront and an Express API backed by MongoDB. The frontend and backend run as separate development servers.

## Features

- Browse, search, and filter the product catalog by category.
- View product details and save products to a wishlist.
- Register and sign in with cookie-based authentication.
- Add products to a persistent cart and update quantities.
- Check out, view order history, and open order details.
- Use Razorpay test credentials for payments, or try the built-in mock payment flow.

## Built with

| Frontend | Backend | Data and payments |
| --- | --- | --- |
| React 19, React Router, Vite, Axios, Tailwind CSS | Node.js, Express 5, Mongoose, JWT, bcrypt | MongoDB, Razorpay (optional) |

## Getting started

### Prerequisites

- Node.js **20.19+** or **22.12+**, and npm.
- A MongoDB database, either local or hosted on MongoDB Atlas.

### 1. Clone the repository

```bash
git clone https://github.com/amritkang165/MERN-LAB-PROJECT-SHOPKART-.git
cd MERN-LAB-PROJECT-SHOPKART-
```

### 2. Configure and start the backend

Install the backend dependencies:

```bash
cd backend
npm install
```

Create a `backend/.env` file with your MongoDB connection string and a private JWT secret:

```dotenv
dbURL=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/shopkart
JWT_SECRET=replace-with-a-long-random-secret
PORT=8088
```

Replace the MongoDB placeholders with your own connection details. If your database credentials contain special characters, URL-encode them. Keep `.env` private; it is excluded from Git.

Start the API:

```bash
npm run dev
```

The API listens at `http://localhost:8088`.

### 3. Start the frontend

Open a second terminal from the repository root:

```bash
cd frontend/vite-project
npm install
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`). The frontend API client is configured to call `http://localhost:8088`; the backend allows the default Vite ports `5173` and `5174`.

### 4. (Optional) Add demo products

With MongoDB configured, run this from the `backend/` directory:

```bash
npm run seed:demo
```

This adds or refreshes a small set of sample products. It is safe to run again.

## Payments

Checkout uses a mock payment flow when Razorpay is not configured, so you can explore the order flow without payment credentials. To use Razorpay's test mode, add your test keys to `backend/.env` and restart the backend:

```dotenv
RAZORPAY_KEY_ID=your_test_key_id
RAZORPAY_KEY_SECRET=your_test_key_secret
```

Never commit real payment credentials.

## Useful scripts

Run these commands from the corresponding app directory:

| Directory | Command | Description |
| --- | --- | --- |
| `backend/` | `npm run dev` | Start the API with automatic reload. |
| `backend/` | `npm start` | Start the API. |
| `backend/` | `npm run seed:demo` | Add or refresh demo products. |
| `frontend/vite-project/` | `npm run dev` | Start the Vite development server. |
| `frontend/vite-project/` | `npm run build` | Create a production frontend build. |
| `frontend/vite-project/` | `npm run preview` | Preview the production build locally. |
| `frontend/vite-project/` | `npm run lint` | Run ESLint. |

## Project structure

```text
.
├── backend/
│   ├── config/          # Razorpay configuration
│   ├── controllers/     # Request handlers
│   ├── middlewares/     # Authentication and other middleware
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   └── index.js         # Express app and server entry point
└── frontend/
    └── vite-project/
        └── src/
            ├── components/
            ├── context/
            ├── pages/
            └── services/  # API client
```

## API overview

The backend runs on port `8088` and groups its endpoints under:

| Prefix | Purpose |
| --- | --- |
| `/customers` | Registration, login, logout, and current customer |
| `/products` | Product catalog, search, and product details |
| `/wishlist` | Customer wishlist |
| `/cart` | Customer shopping cart |
| `/orders` | Checkout, payment verification, and order history |

Most customer-specific wishlist, cart, and order actions require signing in.

## What I learned

These assignments taught me how to build a complete MERN e-commerce app: connect React pages to Express APIs and MongoDB, and implement authentication, wishlists, carts, and checkout. I also learned to validate requests, protect customer data, and test the full flow from browsing products to placing an order.
