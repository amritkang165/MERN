import { Link, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';

function OrderSuccess() {
  const { id } = useParams();

  return (
    <main className="page-shell">
      <Navbar />
      <section className="content-shell">
        <div className="empty-state summary-card">
          <h2>✅ Order Placed Successfully</h2>
          <p>Order ID: {id}</p>
          <p>Your order has been saved successfully.</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link className="button button-primary" to="/orders">View My Orders</Link>
            <Link className="button button-secondary" to="/products">Continue Shopping</Link>
          </div>
        </div>
      </section>
    </main>
  );
}

export default OrderSuccess;
