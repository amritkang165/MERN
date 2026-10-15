# ShopKart Labs 4–6: Question Bank

This question bank contains 50 review and viva questions with answers based on Labs 4, 5, and 6.

## Lab 4 — Wishlist System

1. What problem does a wishlist solve for a ShopKart customer?
   **Answer:** It lets a customer save products they may want to revisit or buy later.
2. Why should a wishlist store references to Product documents instead of copies of complete product objects?
   **Answer:** References avoid duplicating product data and allow the app to retrieve current product details from the Product collection.
3. What field should be added to the customer schema to store a wishlist, and what should its default value be?
   **Answer:** Add a `wishlist` array of `ObjectId` values referencing `Product`, with a default of `[]`.
4. Which HTTP method and endpoint should add a product to the authenticated customer’s wishlist?
   **Answer:** `POST /wishlist/:productId`.
5. How should the backend determine which customer owns the wishlist?
   **Answer:** Use the authenticated customer attached to the request by auth middleware, such as `req.user._id`; never trust a customer ID supplied by the client.
6. Why must the backend validate a product ID before querying MongoDB?
   **Answer:** It rejects malformed IDs early with a client error instead of letting an invalid database query cause an exception.
7. What should the API return if the requested product does not exist?
   **Answer:** `404 Not Found`.
8. How should the API respond when a customer tries to add the same product to the wishlist twice?
   **Answer:** Reject the duplicate, commonly with `409 Conflict`, and leave the wishlist unchanged.
9. Which MongoDB update operator can add a product reference while preventing duplicate entries?
   **Answer:** `$addToSet` adds a value only if it is not already present.
10. What should `GET /wishlist` return, and why should the product references be populated?
    **Answer:** It should return the authenticated customer’s wishlist with product details populated so the UI can display the saved products.
11. Which product fields are useful to return for each item on the wishlist page?
    **Answer:** At minimum, name, price, category, image, and stock.
12. How should the API behave when removing a product that is not in the customer’s wishlist?
    **Answer:** Return `404 Not Found` (or another clearly defined not-found response) and do not change other wishlist items.
13. Why must wishlist routes require authentication?
    **Answer:** A wishlist is private customer data; authentication identifies its owner and prevents access to another customer’s saved products.
14. What should an unauthenticated request to a wishlist endpoint return?
    **Answer:** `401 Unauthorized`.
15. Which UI states should the wishlist page show while loading, when empty, and when an API request fails?
    **Answer:** A visible loading message or skeleton, an empty-wishlist message with a browse link, and an error message with a retry action.
16. What should the Retry button do after the wishlist page displays an error?
    **Answer:** Send the wishlist request again and update the page based on the new response.
17. How would you test adding a wishlist item, rejecting a duplicate, retrieving the list, removing an item, and blocking unauthenticated access?
    **Answer:** Authenticate, POST a valid product ID, repeat the POST and expect `409`, GET and verify the product is present, DELETE and verify it is gone, then repeat a protected request without a cookie and expect `401`.

## Lab 5 — Shopping Cart

18. How is a cart item represented in the customer schema, and why does it need both a Product reference and a quantity?
    **Answer:** Each entry stores a Product `ObjectId` reference and a quantity. The reference identifies the product; quantity records how many units the customer wants.
19. What should happen when a customer adds a product that is not already in their cart?
    **Answer:** Add a cart entry for that product, normally with quantity `1` unless a valid quantity is explicitly supported by the API.
20. What should happen when the customer adds a product that is already in their cart?
    **Answer:** Increment the existing entry’s quantity instead of creating a duplicate cart entry.
21. Why must the backend check the product’s current stock before saving a cart update?
    **Answer:** To prevent customers from requesting more units than are currently available.
22. What should the backend do if the requested cart quantity is not a positive integer?
    **Answer:** Reject it with `400 Bad Request` and do not save the cart change.
23. Which HTTP method and endpoint should update the quantity of a cart item?
    **Answer:** `PATCH /cart/:productId`, with the desired quantity in the request body.
24. What information should `GET /cart` return after populating each item’s Product reference?
    **Answer:** The authenticated customer’s cart entries with product details needed by the UI, including product ID, name, price, image, stock, and quantity.
25. Which HTTP method and endpoint should remove an item from the current customer’s cart?
    **Answer:** `DELETE /cart/:productId`.
26. Why should the frontend send a product ID and quantity rather than a customer ID when changing the cart?
    **Answer:** The server derives the customer from the authenticated session. Accepting a client-supplied customer ID could allow users to modify someone else’s cart.
27. What responsibilities should a global cart context provide to React components?
    **Answer:** Hold cart items and count, load or refresh the cart, and expose operations to add, update, remove, or clear items while keeping shared UI in sync.
28. How can the cart page calculate its subtotal from item prices and quantities?
    **Answer:** Sum `item.price * item.quantity` for every cart item.
29. How should the navbar cart count be calculated, and why should it not be hardcoded?
    **Answer:** Sum the quantities of all cart entries from the current cart state; this keeps the count accurate as the cart changes.
30. What should happen to the visible cart after the customer refreshes the page?
    **Answer:** The frontend should fetch the persisted cart from the backend and display it again.
31. Which loading, empty, and error states should the cart page support?
    **Answer:** Show a loading indicator during fetch, a helpful empty-cart state when there are no items, and an error with a retry option if loading fails.
32. How should the frontend and backend stay synchronized after adding, updating, or removing a cart item?
    **Answer:** Send the operation to the backend, then update from its response or refetch the authoritative cart before updating shared cart state.
33. How would you test duplicate-item increments, stock limits, quantity updates, removal, persistence after refresh, and unauthenticated requests?
    **Answer:** Add a product twice and verify one entry with incremented quantity; request more than stock and expect `400`; PATCH quantity and verify it; DELETE and verify removal; GET after refresh to check persistence; make a protected request without auth and expect `401`.

## Lab 6 — Checkout and Orders

34. Why should an Order store a snapshot of product name, price, and image instead of relying only on live Product data?
    **Answer:** Product details can change or the product can be removed. A snapshot preserves what the customer actually purchased and the price they were charged.
35. What shipping address fields should checkout collect and validate before creating an order?
    **Answer:** Full name, phone, address line, city, state, and postal code/pincode; required fields and phone/postal-code formats should be validated.
36. Why should the frontend send the shipping address rather than a trusted total or order-item list?
    **Answer:** The server must use the authenticated customer’s saved cart and current database product data as the authority for items, stock, and prices.
37. How should the backend build the order items and calculate the total from the customer’s cart?
    **Answer:** Load and populate the authenticated customer’s cart, validate each product and quantity, copy purchase-time product fields into order-item snapshots, then sum current price times quantity on the server.
38. Why must the backend verify product availability and stock again during checkout?
    **Answer:** Stock may have changed since the item was added to the cart; rechecking prevents an order for unavailable or excess units.
39. What should happen if the cart is empty when the customer requests order creation?
    **Answer:** Reject the request with `400 Bad Request`; do not create a pending order or payment.
40. What initial payment and order statuses should a newly created pending order have?
    **Answer:** A typical initial state is `paymentStatus: PENDING` and `status: PENDING_PAYMENT`.
41. Why does Razorpay order creation happen on the backend, and why is the key secret never sent to React?
    **Answer:** The backend must calculate the amount and authenticate with Razorpay securely. The secret is private and exposing it would let others misuse the merchant account.
42. Why does Razorpay expect the payment amount in paise, and how should the backend derive it from the rupee total?
    **Answer:** Razorpay represents INR amounts in the smallest currency unit. Convert rupees to paise by multiplying the server-calculated total by `100` and rounding to an integer.
43. What values from the Razorpay checkout response are needed for server-side payment verification?
    **Answer:** The ShopKart order ID, Razorpay order ID, Razorpay payment ID, and Razorpay signature.
44. How does HMAC SHA-256 signature verification help confirm a payment response is genuine?
    **Answer:** The server computes an HMAC using its secret and the expected order/payment data, then compares it with Razorpay’s signature. A valid match proves the response was signed with the shared secret.
45. What must the backend do when a payment signature is invalid, and what must it not do to the order or cart?
    **Answer:** Return an error and leave the order unpaid; do not mark it placed or clear the cart.
46. At what point should the order be marked paid and the customer’s cart be cleared?
    **Answer:** Only after the backend successfully verifies the payment signature.
47. Why must both the backend cart and the frontend’s global cart state be updated after successful payment verification?
    **Answer:** The backend is the persistent source of truth, while the frontend must immediately reflect the completed purchase (including a zero navbar count) without showing stale items.
48. How should the API ensure a customer can only list or retrieve their own orders?
    **Answer:** Require authentication, query order lists by the authenticated user ID, and check ownership before returning a single order.
49. What should the My Orders page display when orders are loading, when there are none, and when retrieval fails?
    **Answer:** A loading indicator, an empty-state message with a shopping link, and an error message with a retry action, respectively.
50. How would you test a manipulated frontend total, a fake payment signature, a valid Test Mode payment, a payment failure, and order persistence after refreshing My Orders?
    **Answer:** Change the client total and confirm the server still uses database prices; submit a fake signature and verify the order stays unpaid and the cart remains; complete a valid Test Mode payment and verify the order is paid and the cart cleared; simulate a failed/cancelled payment and verify no success confirmation; refresh My Orders and confirm the persisted paid order remains listed.
