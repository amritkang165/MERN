# ShopKart — Full Project Explanation

This document walks through **every file** in the project and explains **every concept** used (JWT, bcrypt, cookies, CORS, MVC, React Router, hooks, etc.) so you can understand and defend every line of code — useful for the lab viva.

---

## 1. What this project is

ShopKart is a MERN-stack e-commerce app:

- **M**ongoDB — database (stores customers and products)
- **E**xpress — backend web framework (runs on Node.js, defines the API)
- **R**eact — frontend UI library (runs in the browser)
- **N**ode.js — JavaScript runtime that runs the backend

The **backend** (`backend/`) exposes a REST API (JSON over HTTP). The **frontend** (`frontend/vite-project/`) is a React app that calls that API using `axios` and renders pages.

They are two separate processes:
- Backend runs on `http://localhost:8088`
- Frontend (Vite dev server) runs on `http://localhost:5173`

---

## 2. Core concepts (read this section first)

### MVC — Model / Controller / Route architecture
The backend is organized so each concern lives in its own folder:
- **models/** — defines the *shape* of data stored in MongoDB (via Mongoose schemas).
- **controllers/** — the actual logic: read the request, talk to the model, send a response.
- **routes/** — maps an HTTP method + URL (e.g. `POST /customers/login`) to a controller function.
- **middlewares/** — functions that run *before* a controller (e.g. checking if the user is logged in).

This keeps "what data looks like", "what happens", and "which URL triggers it" separated instead of one giant file.

### REST API
A REST API exposes **resources** (customers, products) through URLs, and uses HTTP methods to say what to do with them:
| Method | Meaning |
|---|---|
| GET | read data |
| POST | create data |
| PATCH/PUT | update data |
| DELETE | remove data |

Example: `POST /customers/register` creates a new customer. `GET /products/:id` reads one product.

### Express & middleware
Express is the framework that receives HTTP requests and routes them to your code. A **middleware** is just a function `(req, res, next) => {...}` that runs in the request pipeline before the final handler. Examples in this project:
- `express.json()` — parses incoming JSON request bodies into `req.body`.
- `cookieParser()` — parses cookies from the request into `req.cookies`.
- `cors(...)` — see below.
- `isAuthenticated` (custom) — checks the JWT cookie before letting the request reach a protected controller.

### MongoDB & Mongoose
MongoDB stores data as JSON-like documents (not rows/tables like SQL). **Mongoose** is a library that lets you define a **Schema** (the expected shape/validation of a document) and gives you a **Model** (`Customer`, `Product`) with methods like `.create()`, `.find()`, `.findById()` to talk to the database from Node.js.

### Password hashing with bcrypt
You must never store a plain-text password in a database — if the DB ever leaks, every user's password leaks too. **bcrypt** turns a password into an irreversible scrambled string (a *hash*). Instead of comparing passwords directly, you compare hashes:
- `bcrypt.hash(password, salt)` — turns `"john123"` into something like `"$2b$10$N9qo8u...` — one-way, cannot be reversed back to `"john123"`.
- `bcrypt.compare(plainPassword, storedHash)` — re-hashes the plain password the same way and checks if the result matches. This is how login verifies a password *without ever decrypting the stored hash*.
- The **salt** is random data mixed into the hash so two users with the same password don't produce the same hash.

### JWT (JSON Web Token)
After a successful login, the server needs a way to recognize the same user on their *next* request — HTTP is stateless, it doesn't remember you between requests. A JWT is a signed token that encodes a small piece of data (here, just the customer's MongoDB `_id`).

- `jwt.sign({ customerId }, SECRET, { expiresIn: "10d" })` — creates a token. It's signed with a secret key known only to the server, so nobody can forge or tamper with it (they could *read* it, since it's just base64, but not *fake* it without the secret).
- `jwt.verify(token, SECRET)` — the server checks the signature is valid and decodes the payload back into `{ customerId }`.

The token itself is *not encrypted* (don't put passwords in it) — it's *signed*, meaning tamper-proof, not secret.

### HttpOnly cookies
Once the server creates a JWT, it needs to get it back from the browser on every future request. This project stores the JWT in a cookie with the `httpOnly` flag:
```js
res.cookie("token", token, { httpOnly: true, secure: ..., sameSite: "lax" })
```
- `httpOnly: true` — JavaScript running in the browser (`document.cookie`) **cannot read this cookie**. Only the browser's networking layer can send it. This defends against XSS attacks stealing the token.
- `secure` — only sent over HTTPS in production.
- `sameSite: "lax"` — limits when the cookie is sent on cross-site requests (CSRF protection).
- The browser automatically attaches this cookie on every request to the same domain — that's why the frontend doesn't need to manually manage the token at all.

### CORS (Cross-Origin Resource Sharing)
The frontend (`localhost:5173`) and backend (`localhost:8088`) are different **origins** (different ports = different origin). Browsers block a webpage from calling an API on a different origin *by default*, for security. The backend must explicitly opt in:
```js
app.use(cors({
  origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
  credentials: true,
}));
```
- `origin` — whitelist of frontend URLs allowed to call this API.
- `credentials: true` — allows cookies to be sent cross-origin. Without this, the HttpOnly auth cookie would never reach the backend.

On the frontend, `axios` must also opt in per-request with `withCredentials: true` (see `services/api.js`) — both sides have to agree to send cookies cross-origin.

### React & JSX
React lets you build UI as **components** — JavaScript functions that return HTML-like syntax called **JSX** (`<div>{someVariable}</div>`). React re-renders a component automatically whenever its **state** changes.

### React Hooks: `useState` and `useEffect`
- `useState(initialValue)` — gives a component a piece of memory that persists between renders, and a setter function that triggers a re-render when called. E.g. `const [email, setEmail] = useState('')`.
- `useEffect(fn, [deps])` — runs `fn` after render, and re-runs it whenever any value in the `[deps]` array changes. Used here to fetch data when a component mounts (`[]` = run once) or when a filter changes (`[search, category]` = re-run whenever those change).

### Controlled components
An input is "controlled" when its value comes from React state and changes go through `onChange`, rather than the DOM owning the value itself:
```jsx
<input value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} />
```
This keeps the form's data in one place (React state) so it can be validated, reset, or submitted programmatically.

### React Router
A single-page app has one HTML page, but many "pages" — React Router swaps which component renders based on the URL, without a full page reload.
- `<BrowserRouter>` — enables URL-based routing.
- `<Routes>` / `<Route path="..." element={...} />` — maps a URL pattern to a component.
- `:id` in a path (`/products/:id`) — a **URL parameter**, read with `useParams()`.
- `?category=Electronics` — a **query string**, read/written with `useSearchParams()`.
- `<Link to="...">` — like an `<a>` tag but doesn't reload the page.
- `useNavigate()` — programmatically redirect (e.g. after login).

### Axios & `withCredentials`
Axios is an HTTP client (an alternative to the browser's built-in `fetch`). This project creates one shared instance (`services/api.js`) with a fixed `baseURL` and `withCredentials: true` so every request automatically includes the auth cookie.

### `localStorage`
A browser storage API (`localStorage.setItem/getItem`) that persists small key-value data on the user's device across page reloads, with no backend involved. Used here only for the wishlist heart toggle — intentionally *not* real backend data.

---

## 3. Backend — file by file

### `backend/index.js` — the entry point
```js
const app = express();
app.use(express.json());        // parse JSON bodies
app.use(cookieParser());        // parse cookies
app.use(cors({ origin: [...], credentials: true })); // allow the frontend to call this API

app.use("/customers", customerRoutes); // all customer endpoints live under /customers/...
app.use("/products", productRoutes);   // all product endpoints live under /products/...

mongoose.connect(process.env.dbURL)... // connect to MongoDB Atlas
app.listen(8088, ...)                  // start the server
```
This file wires everything together: middleware first, then routes, then the DB connection, then starts listening for requests.

### `backend/models/customer.model.js`
```js
const customerSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true }, // always the bcrypt HASH, never plain text
  phone:    { type: String, required: true }
}, { timestamps: true })
```
`unique: true` on `email` tells MongoDB to reject a second document with the same email at the database level (as a backup to the controller's own duplicate check). `timestamps: true` auto-adds `createdAt`/`updatedAt`.

### `backend/models/product.model.js`
```js
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true, min: 0.01 },  // must be > 0
  category: { type: String, required: true },
  image: { type: String, required: true },
  stock: { type: Number, required: true, min: 0 }       // can't go negative
}, { timestamps: true })
```
`min` is Mongoose-level validation — it rejects a save before it ever reaches MongoDB if `price` or `stock` are out of range.

### `backend/controllers/customer.controller.js`
This is the "brain" of authentication. Four exported functions, one per route:

**`registerCustomer`**
1. Destructure `fullName, email, password, phone` from `req.body`.
2. Validate all fields are present, password ≥ 6 chars, phone is exactly 10 digits.
3. Check `Customer.findOne({ phone })` and `findOne({ email })` — reject with `409 Conflict` if either already exists.
4. `bcrypt.genSalt(10)` then `bcrypt.hash(password, salt)` — hash the password before ever saving it.
5. `Customer.create({...})` — insert the new document.
6. `genToken(newCustomer._id)` — immediately log the new user in by issuing a JWT.
7. `res.cookie("token", token, cookieOptions)` — set the HttpOnly cookie.
8. Respond `201 Created` with the customer's public fields — **never** the password.

**`loginCustomer`**
1. Validate `email` and `password` are present.
2. `Customer.findOne({ email })` — if not found, respond `401` with a generic "Invalid Credentials" (deliberately not "email doesn't exist", so attackers can't use it to discover which emails are registered).
3. `bcrypt.compare(password, customer.password)` — check the submitted password against the stored hash.
4. If it matches: issue a new JWT, set the cookie, respond `200` with the customer's public info.

**`getCustomer`**
This is the handler for `GET /customers/me`. By the time this function runs, the `isAuthenticated` middleware has already verified the JWT and attached the customer document to `req.user`. So this function just returns `req.user`.

**`logoutCustomer`**
`res.clearCookie("token", cookieOptions)` — tells the browser to delete the cookie. Since the JWT itself can't be "revoked" server-side without extra infrastructure (a blocklist), logging out here just means the browser stops sending it.

### `backend/controllers/product.controller.js`
**`createProduct`** — validates required fields + `price > 0` + `stock >= 0`, then `Product.create(...)`, responds `201`.

**`getProducts`** — builds a MongoDB query object dynamically from optional query params:
```js
const query = {};
if (search) query.name = { $regex: search, $options: "i" }; // case-insensitive partial match
if (category) query.category = category;                    // exact match
const products = await Product.find(query);
```
This is why `/products`, `/products?search=phone`, `/products?category=Electronics`, and `/products?search=phone&category=Electronics` are all handled by **one** function — the query object just grows or shrinks based on what was passed in, instead of writing four separate endpoints.

**`getProductById`** — `mongoose.Types.ObjectId.isValid(id)` checks the ID even *looks like* a valid MongoDB ObjectId before querying (avoids a 500 crash on garbage input) → `400` if invalid, `404` if valid-but-not-found, otherwise `200` with the product.

### `backend/routes/customer.routes.js`
```js
customerRoutes.post("/register", registerCustomer);
customerRoutes.post("/login", loginCustomer);
customerRoutes.post("/logout", isAuthenticated, logoutCustomer);
customerRoutes.get("/me", isAuthenticated, getCustomer);
```
Notice `isAuthenticated` is passed as a **second argument** before the controller — Express runs middlewares left-to-right, so the request must pass the auth check before it's allowed to reach `logoutCustomer`/`getCustomer`.

### `backend/routes/product.routes.js`
```js
productRoutes.post("/", createProduct);
productRoutes.get("/", getProducts);
productRoutes.get("/:id", getProductById);
```
No auth middleware here — product creation/reading is intentionally left open for this lab (the spec explicitly allows this; admin-only writes would be added in a later lab).

### `backend/middlewares/authMiddleware.js`
```js
export const isAuthenticated = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: "Not Authorized, Please Login" });

  const decoded = jwt.verify(token, process.env.JWT_SECRET); // throws if invalid/expired
  const user = await Customer.findById(decoded.customerId);
  if (!user) return res.status(401).json({ message: "Not Authorized, Please Login" });

  req.user = user; // attach the logged-in customer to the request for later handlers
  next();           // pass control to the next middleware/controller
}
```
This is the gatekeeper: no token → reject. Invalid/expired token → `jwt.verify` throws, which is caught further up (or crashes to a 500 if truly unhandled — in this codebase it's simple enough that a malformed token just errors out). Valid token but the user was deleted from the DB → reject. Otherwise, attach the user and call `next()` to continue to the actual route handler.

### `backend/utils/generateToken.js`
```js
export const genToken = (customerId) => jwt.sign({ customerId }, process.env.JWT_SECRET, { expiresIn: "10d" });
```
A one-line helper so both `registerCustomer` and `loginCustomer` create tokens the same way instead of duplicating the `jwt.sign(...)` call.

### `.env` (not committed to git)
Two secrets read via `process.env`:
- `dbURL` — the MongoDB Atlas connection string.
- `JWT_SECRET` — the key used to sign/verify tokens. If this leaks, anyone could forge a valid login token for any user — treat it like a password.

---

## 4. Frontend — file by file

### `src/main.jsx` — the real entry point
```jsx
createRoot(document.getElementById('root')).render(
  <StrictMode><App /></StrictMode>
)
```
Vite's `index.html` has a single `<div id="root">`. This file mounts the whole React app into it. `<StrictMode>` is a development-only wrapper that helps catch bugs (e.g. by intentionally double-invoking some functions) — it has no effect in production.

### `src/App.jsx` — routing table
```jsx
<BrowserRouter>
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/home" element={<Home />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/products" element={<Products />} />
    <Route path="/products/:id" element={<ProductDetails />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
</BrowserRouter>
```
`path="*"` is a catch-all — any URL that matches nothing above renders `NotFound`.

### `src/services/api.js` — the only place that talks HTTP
```js
export const api = axios.create({
  baseURL: 'http://localhost:8088/',
  withCredentials: true,   // send/receive cookies cross-origin (needed for the JWT cookie)
  headers: { 'Content-Type': 'application/json' },
})
```
Every other file imports functions from here (`getProducts`, `getProductById`, `getCurrentCustomer`, `logoutCustomer`) instead of calling `axios` directly — this is the "service layer" pattern: if the API URL or response shape ever changes, you only fix it in one file.

### `src/components/Navbar.jsx`
Shown on every page. On mount, it runs:
```js
useEffect(() => {
  getCurrentCustomer().then(setCustomer).catch(() => setCustomer(null))
}, [])
```
This calls `GET /customers/me`. If the HttpOnly cookie is valid, it succeeds and the navbar shows "Hi, {name}" + Log out. If there's no cookie (or it's invalid/expired), the request fails with 401, the `catch` sets `customer` to `null`, and the navbar shows a Login link instead. This is how the whole site knows "am I logged in?" without any global state library — each page's Navbar just asks the backend.

### `src/components/Footer.jsx`
Static navigation links (Home/Products/Login/Register/Categories) plus a **client-only** newsletter form: `useState` for the email, and on submit it just flips a `subscribed` flag — there's no backend endpoint for this, it's clearly cosmetic.

### `src/components/FloatingChat.jsx`
A `position: fixed` circular button (see `App.css`) that toggles a small popover open/closed with `useState`. Purely a UI widget, not connected to any real chat service.

### `src/components/ProductCard.jsx`
Reusable card used on both the Products listing and the Home page's "New Arrivals". Key logic:
```js
const isLow = product.stock <= LOW_STOCK_THRESHOLD
```
Drives the green "In stock" vs amber "Only N left" badge directly from real data. The wishlist heart:
```js
const [wished, setWished] = useState(() => readWishlist().includes(product._id))
```
reads/writes an array of product IDs to `localStorage` — persists in *that browser only*, not synced to any account.

### `src/components/SearchBar.jsx`
A controlled `<input>` — the smallest possible example of the controlled-component pattern: `value={search}` comes from the parent's state, `onChange` sends keystrokes back up via the `onSearchChange` prop.

### `src/pages/Login.jsx`
Controlled form (`email`, `password` in `useState`). On submit:
```js
await api.post('/customers/login', form)   // sets the HttpOnly cookie as a side effect
navigate('/home')                          // no token handling needed on the frontend at all
```
Because the cookie is `httpOnly`, the frontend never sees or stores the token itself — it just calls the endpoint and trusts the browser to remember the cookie for future requests.

### `src/pages/Register.jsx`
Same controlled-form pattern with four fields. `POST /customers/register` — on success, shows a message and clears the form (in `Login.jsx`'s equivalent flow elsewhere in the app, a successful register instead redirects to `/login` with a "registered" flag so the login page can show a welcome-back message).

### `src/pages/Home.jsx` — the public storefront
1. `useEffect` fetches **all** products once on mount (`getProducts()` with no filters).
2. Derives `featured` (the first product) and `arrivals` (the rest) from that single fetched array — no second API call needed.
3. A `setInterval` running every second recomputes a countdown to midnight (`getCountdown()`), purely a visual "deal refreshes" widget — genuinely live, but not tied to any real deal-expiry data.
4. Category tiles are generated from a hardcoded `CATEGORIES` list, but each tile's photo comes from `products.find(p => p.category === cat)?.image` — a **real** product image representing that category, not a stock photo.
5. Renders `<Navbar />`, the hero/category/deal/arrivals sections, an inline `<NewsletterForm />`, `<Footer />`, and `<FloatingChat />`.

### `src/pages/Products.jsx` — the catalog
```js
const [searchParams, setSearchParams] = useSearchParams()
const category = searchParams.get('category') || ''
```
The selected category lives **in the URL**, not just in component state — that's why clicking a category tile on Home (`/products?category=Electronics`) pre-filters this page, and why changing the radio button here updates the URL (shareable/bookmarkable link). A `useEffect` depending on `[search, category]` re-fetches from `GET /products` every time either changes, passing them as query params to `getProducts()`.

### `src/pages/ProductDetails.jsx`
Reads the `:id` URL param with `useParams()`, fetches that one product with `getProductById(id)`. The "Add to Cart" button is UI-only (per the lab spec — cart functionality is a future lab): clicking it just flips a local `added` state to show "Added ✓" for 1.6 seconds via `setTimeout`, with no backend call.

### `src/pages/NotFound.jsx`
The catch-all route's component — a simple "page not found" message with a link back home.

### `src/App.css` — the design system
Defined once at the top as CSS custom properties (variables) and reused everywhere, so changing the whole site's look means editing a handful of values instead of hunting through every component:
```css
:root {
  --ink: #063C2D;     /* deep green — dark sections & default text */
  --coral: #FF5A36;   /* orange accent — buttons, tags, links */
  --paper: #F5F5F5;   /* light grey — page background */
  --card: #FFFFFF;    /* white — cards, inputs, navbar */
  --line: #E7E2D9;    /* borders */
}
```
Every component's class (`.button-primary`, `.product-card`, `.hero`, etc.) references these variables (`var(--ink)`) instead of hardcoding colors, which is what let the whole site's theme change in one edit earlier in this project's history.

---

## 5. Full request walkthroughs

### "What happens when I log in?"
1. `Login.jsx` calls `api.post('/customers/login', { email, password })`.
2. Request hits `POST /customers/login` → `customer.routes.js` → `loginCustomer`.
3. Controller finds the customer by email, `bcrypt.compare`s the password.
4. `genToken()` signs a JWT containing `{ customerId }`.
5. `res.cookie('token', jwt, { httpOnly: true, ... })` — browser stores this cookie automatically.
6. Frontend calls `navigate('/home')`.
7. `Home.jsx` mounts, its `<Navbar />` calls `GET /customers/me`.
8. Browser automatically attaches the `token` cookie to that request (same origin policy + `withCredentials`).
9. `isAuthenticated` middleware verifies the JWT, loads the customer, attaches to `req.user`.
10. `getCustomer` controller returns `req.user`.
11. Navbar now shows "Hi, {name}".

### "What happens when I filter products by category?"
1. User clicks a radio button in `Products.jsx`.
2. `handleCategoryChange(value)` calls `setSearchParams({ category: value })` — URL becomes `/products?category=Electronics`.
3. The `useEffect` watching `[search, category]` re-runs because `category` (read from the URL) changed.
4. `getProducts({ search, category })` calls `GET /products?category=Electronics`.
5. `getProducts` controller builds `{ category: "Electronics" }` as the Mongo query, returns matching documents.
6. React re-renders `<ProductCard>` for each result.

---

## 6. Quick concept cheat-sheet (for viva)

| Term | One-line answer |
|---|---|
| Why bcrypt, not plain encryption? | Encryption is reversible (decryptable with a key); bcrypt hashing is one-way, so even the server can never "recover" a password, only verify one. |
| What's in a JWT payload? | Whatever you put there — here, just `{ customerId }`. Never put passwords in it; it's readable (base64), just not forgeable. |
| Why HttpOnly cookies? | So JavaScript (and anything that can inject JS, i.e. XSS) can't steal the token — only the browser's own request machinery can send it. |
| Why never return the password field? | Even the hash shouldn't leave the server — no reason for the frontend to ever see it, and it reduces what an attacker gains from intercepting a response. |
| Purpose of auth middleware? | Centralizes "is this request from a logged-in user?" in one reusable function instead of repeating the check in every controller. |
| Why `withCredentials: true`? | Tells the browser to include cookies on cross-origin requests (frontend and backend are different ports = different origins) — without it, the auth cookie never reaches the backend. |
| Why can't JS read an HttpOnly cookie? | By design/spec — that's the entire point of the flag; it's a browser-enforced restriction, not something the app configures beyond setting the flag. |
| URL param vs query param? | `/products/:id` (param) identifies *one specific resource*; `/products?category=X` (query) *filters/modifies* a request to a collection. |
| Why fetch `/customers/me` instead of storing the user after login? | The cookie — not any frontend state — is the actual source of truth for "who is logged in"; re-fetching confirms the session is still valid (e.g. after the cookie expires or on a fresh page load) instead of trusting stale local data. |