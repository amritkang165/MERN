import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { createPaymentOrder, getCart, verifyPayment } from '../services/api';

const loadRazorpayScript = () => new Promise((resolve) => {
  if (window.Razorpay) {
    resolve(true);
    return;
  }

  const script = document.createElement('script');
  script.src = 'https://checkout.razorpay.com/v1/checkout.js';
  script.onload = () => resolve(true);
  script.onerror = () => resolve(false);
  document.body.appendChild(script);
});

const initialState = {
  fullName: '',
  phone: '',
  addressLine1: '',
  city: '',
  state: '',
  pincode: '',
};

function Checkout() {
  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const loadCart = async () => {
    try {
      const data = await getCart();
      setItems(data.items || []);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const validate = () => {
    const nextErrors = {};
    Object.entries(form).forEach(([key, value]) => {
      if (!String(value).trim()) {
        nextErrors[key] = 'This field is required.';
      }
    });

    if (form.phone && !/^\d{10}$/.test(form.phone.replace(/\s+/g, ''))) {
      nextErrors.phone = 'Phone number must contain 10 digits.';
    }

    if (form.pincode && !/^\d{6}$/.test(form.pincode)) {
      nextErrors.pincode = 'Pincode must contain 6 digits.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    setSubmitting(true);

    try {
      const response = await createPaymentOrder({ shippingAddress: form });
      if (!response || !response.shopKartOrderId) {
        throw new Error('Unable to create order');
      }

      const isScriptReady = await loadRazorpayScript();
      if (!isScriptReady || !window.Razorpay) {
        throw new Error('Razorpay Checkout script failed to load.');
      }

      const paymentOptions = {
        key: response.key,
        amount: response.amount,
        currency: response.currency,
        name: 'ShopKart',
        description: 'ShopKart Order',
        order_id: response.razorpayOrderId,
        handler: async (paymentResponse) => {
          try {
            await verifyPayment({
              shopKartOrderId: response.shopKartOrderId,
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_signature: paymentResponse.razorpay_signature,
            });
            navigate(`/order-success/${response.shopKartOrderId}`);
          } catch (verifyError) {
            const message = verifyError?.response?.data?.message || 'Payment verification failed.';
            setErrors({ form: message });
          }
        },
        prefill: { name: form.fullName, contact: form.phone },
        theme: { color: '#f26d7d' },
        modal: {
          ondismiss: () => {
            setErrors({ form: 'Payment cancelled. Your cart is still intact.' });
          }
        }
      };

      const paymentObject = new window.Razorpay(paymentOptions);
      paymentObject.on('payment.failed', (paymentFailure) => {
        setErrors({ form: paymentFailure?.error?.description || 'Payment failed. Please try again.' });
      });
      paymentObject.open();
    } catch (error) {
      const message = error?.response?.data?.message || error.message || 'Something went wrong while placing the order.';
      setErrors({ form: message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
  };

  if (loading) {
    return (
      <main className="page-shell">
        <Navbar />
        <section className="content-shell"><p className="empty-state">Loading checkout...</p></section>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="page-shell">
        <Navbar />
        <section className="content-shell">
          <div className="empty-state">
            <h2>Your cart is empty</h2>
            <p>Add products before starting checkout.</p>
            <Link className="button button-primary" to="/products">Browse Products</Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <Navbar />

      <section className="content-shell checkout-shell">
        <div className="checkout-form-card">
          <h1>Checkout</h1>
          <form onSubmit={handleSubmit} className="checkout-form">
            <div className="field-row">
              <label>
                <span>Full Name</span>
                <input name="fullName" value={form.fullName} onChange={handleChange} />
                {errors.fullName && <small>{errors.fullName}</small>}
              </label>
            </div>

            <div className="field-row">
              <label>
                <span>Phone</span>
                <input name="phone" value={form.phone} onChange={handleChange} />
                {errors.phone && <small>{errors.phone}</small>}
              </label>
            </div>

            <div className="field-row">
              <label>
                <span>Address</span>
                <input name="addressLine1" value={form.addressLine1} onChange={handleChange} />
                {errors.addressLine1 && <small>{errors.addressLine1}</small>}
              </label>
            </div>

            <div className="field-row two-col">
              <label>
                <span>City</span>
                <input name="city" value={form.city} onChange={handleChange} />
                {errors.city && <small>{errors.city}</small>}
              </label>
              <label>
                <span>State</span>
                <input name="state" value={form.state} onChange={handleChange} />
                {errors.state && <small>{errors.state}</small>}
              </label>
            </div>

            <div className="field-row">
              <label>
                <span>Pincode</span>
                <input name="pincode" value={form.pincode} onChange={handleChange} />
                {errors.pincode && <small>{errors.pincode}</small>}
              </label>
            </div>

            {errors.form && <p className="form-error">{errors.form}</p>}

            <button className="button button-primary full-width" type="submit" disabled={submitting}>
              {submitting ? 'Placing order...' : 'Place Order'}
            </button>
          </form>
        </div>

        <aside className="summary-card">
          <h2>Order Summary</h2>
          {items.map((item) => (
            <div className="summary-row" key={item.productId || item._id}>
              <span>{item.name} × {item.quantity}</span>
              <strong>₹{item.price * item.quantity}</strong>
            </div>
          ))}
          <div className="summary-row total-row">
            <span>Total</span>
            <strong>₹{subtotal}</strong>
          </div>
        </aside>
      </section>
    </main>
  );
}

export default Checkout;
