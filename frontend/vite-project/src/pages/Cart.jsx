import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getCart, removeFromCart, updateCartItem } from '../services/api';

function Cart() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState('');
  const navigate = useNavigate();

  const loadCart = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getCart();
      setItems(data.items || []);
    } catch {
      setError('Unable to load cart.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleQuantityChange = async (productId, nextQuantity) => {
    if (nextQuantity < 1) {
      await handleRemove(productId);
      return;
    }

    try {
      setUpdatingId(productId);
      await updateCartItem(productId, nextQuantity);
      await loadCart();
    } catch {
      setError('Unable to update quantity.');
    } finally {
      setUpdatingId('');
    }
  };

  const handleRemove = async (productId) => {
    try {
      setUpdatingId(productId);
      await removeFromCart(productId);
      await loadCart();
    } catch {
      setError('Unable to remove item.');
    } finally {
      setUpdatingId('');
    }
  };

  return (
    <main className="page-shell cart-page">
      <Navbar />

      <section className="content-shell">
        <div className="section-header">
          <div>
            <p className="eyebrow">Your basket</p>
            <h1>Shopping Cart</h1>
          </div>
          {!loading && !error && (
            <span className="pill">{items.length} item{items.length === 1 ? '' : 's'}</span>
          )}
        </div>

        {loading && <p className="empty-state">Loading your cart...</p>}

        {!loading && error && (
          <div className="empty-state error-box">
            <h2>Something went wrong.</h2>
            <p>{error}</p>
            <button className="button button-primary" type="button" onClick={loadCart}>Try Again</button>
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="empty-state">
            <h2>Your cart is empty</h2>
            <p>Add items you love and they will appear here.</p>
            <Link className="button button-primary" to="/products">Browse Products</Link>
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="cart-layout">
            <div className="cart-list">
              {items.map((item) => (
                <article className="cart-item" key={item.productId || item._id}>
                  <img src={item.image} alt={item.name} className="cart-item-image" />

                  <div className="cart-item-info">
                    <div>
                      <p className="eyebrow">{item.category}</p>
                      <h3>{item.name}</h3>
                    </div>
                    <div className="cart-item-meta">
                      <p className="price">₹{item.price}</p>
                      <div className="qty-control">
                        <button type="button" onClick={() => handleQuantityChange(item.productId, item.quantity - 1)} disabled={updatingId === item.productId}>
                          −
                        </button>
                        <span>{item.quantity}</span>
                        <button type="button" onClick={() => handleQuantityChange(item.productId, item.quantity + 1)} disabled={updatingId === item.productId}>
                          +
                        </button>
                      </div>
                    </div>
                    <div className="cart-item-actions">
                      <button type="button" className="text-button" onClick={() => handleRemove(item.productId)}>
                        Remove
                      </button>
                      <strong>₹{item.price * item.quantity}</strong>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <aside className="summary-card">
              <h2>Order Summary</h2>
              <div className="summary-row">
                <span>Subtotal</span>
                <strong>₹{subtotal}</strong>
              </div>
              <div className="summary-row total-row">
                <span>Total</span>
                <strong>₹{subtotal}</strong>
              </div>
              <button className="button button-primary full-width" type="button" onClick={() => navigate('/checkout')}>
                Proceed to Checkout
              </button>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}

export default Cart;
