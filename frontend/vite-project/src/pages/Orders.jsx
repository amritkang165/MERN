import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getOrders } from '../services/api';

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadOrders = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getOrders();
      setOrders(data.orders || []);
    } catch {
      setError('Unable to load orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  return (
    <main className="page-shell">
      <Navbar />

      <section className="content-shell">
        <div className="section-header">
          <div>
            <p className="eyebrow">Purchase history</p>
            <h1>My Orders</h1>
          </div>
        </div>

        {loading && <p className="empty-state">Loading your orders...</p>}

        {!loading && error && (
          <div className="empty-state error-box">
            <h2>Unable to load orders.</h2>
            <button className="button button-primary" type="button" onClick={loadOrders}>Try Again</button>
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="empty-state">
            <h2>You have not placed any orders yet.</h2>
            <Link className="button button-primary" to="/products">Start Shopping</Link>
          </div>
        )}

        {!loading && !error && orders.length > 0 && (
          <div className="orders-list">
            {orders.map((order) => (
              <article className="order-card" key={order._id}>
                <div className="order-card-header">
                  <div>
                    <p className="eyebrow">Order #{String(order._id).slice(-6)}</p>
                    <h3>{new Date(order.createdAt).toLocaleDateString()}</h3>
                  </div>
                  <span className="status-badge">{order.status}</span>
                </div>

                <ul>
                  {order.items.map((item) => (
                    <li key={`${order._id}-${item.product}`}>
                      {item.name} × {item.quantity}
                    </li>
                  ))}
                </ul>

                <div className="order-card-footer">
                  <strong>Total: ₹{order.totalAmount}</strong>
                  <Link className="button button-secondary" to={`/orders/${order._id}`}>View Details</Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default Orders;
