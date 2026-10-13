import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getOrderById } from '../services/api';

function OrderDetails() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadOrder = async () => {
      try {
        const data = await getOrderById(id);
        setOrder(data.order);
      } catch {
        setError('Unable to load this order.');
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [id]);

  if (loading) {
    return <main className="page-shell"><Navbar /><section className="content-shell"><p className="empty-state">Loading order...</p></section></main>;
  }

  if (error || !order) {
    return <main className="page-shell"><Navbar /><section className="content-shell"><div className="empty-state error-box"><h2>Order not found</h2><Link className="button button-primary" to="/orders">Back to Orders</Link></div></section></main>;
  }

  return (
    <main className="page-shell">
      <Navbar />
      <section className="content-shell order-detail-shell">
        <div className="section-header">
          <div>
            <p className="eyebrow">Order details</p>
            <h1>Order #{String(order._id).slice(-6)}</h1>
          </div>
          <span className="status-badge">{order.status}</span>
        </div>

        <div className="summary-card">
          <div className="summary-row"><span>Placed on</span><strong>{new Date(order.createdAt).toLocaleString()}</strong></div>
          <div className="summary-row"><span>Total</span><strong>₹{order.totalAmount}</strong></div>
          <div className="summary-row"><span>Payment</span><strong>{order.paymentStatus}</strong></div>
        </div>

        <div className="order-items-list">
          {order.items.map((item) => (
            <div className="order-item-row" key={`${order._id}-${item.product}`}>
              <div>
                <h3>{item.name}</h3>
                <p>Qty: {item.quantity}</p>
              </div>
              <strong>₹{item.price * item.quantity}</strong>
            </div>
          ))}
        </div>

        <Link className="button button-primary" to="/orders">Back to My Orders</Link>
      </section>
    </main>
  );
}

export default OrderDetails;
