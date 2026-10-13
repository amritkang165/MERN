import crypto from 'crypto';
import mongoose from 'mongoose';
import Customer from '../models/customer.model.js';
import Product from '../models/product.model.js';
import Order from '../models/order.model.js';
import { razorpay, isRazorpayConfigured } from '../config/razorpay.js';

const normalizeAddress = (shippingAddress = {}) => ({
  fullName: String(shippingAddress.fullName || '').trim(),
  phone: String(shippingAddress.phone || '').trim(),
  addressLine1: String(shippingAddress.addressLine1 || '').trim(),
  city: String(shippingAddress.city || '').trim(),
  state: String(shippingAddress.state || '').trim(),
  pincode: String(shippingAddress.pincode || '').trim(),
});

const validateShippingAddress = (shippingAddress = {}) => {
  const cleanAddress = normalizeAddress(shippingAddress);
  const requiredFields = ['fullName', 'phone', 'addressLine1', 'city', 'state', 'pincode'];

  for (const field of requiredFields) {
    if (!cleanAddress[field]) {
      return { valid: false, message: `${field === 'addressLine1' ? 'Address' : field.charAt(0).toUpperCase() + field.slice(1)} is required.` };
    }
  }

  if (!/^\d{10}$/.test(cleanAddress.phone.replace(/\s+/g, ''))) {
    return { valid: false, message: 'Phone number must contain 10 digits.' };
  }

  if (!/^\d{6}$/.test(cleanAddress.pincode)) {
    return { valid: false, message: 'Pincode must contain 6 digits.' };
  }

  return { valid: true, value: cleanAddress };
};

export const createPaymentOrder = async (req, res) => {
  try {
    const { shippingAddress } = req.body;
    const validation = validateShippingAddress(shippingAddress);

    if (!validation.valid) {
      return res.status(400).json({ success: false, message: validation.message });
    }

    const customer = await Customer.findById(req.user._id).populate({
      path: 'cart.product',
      select: 'name price category image stock',
    });

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    if (!customer.cart || customer.cart.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    const orderItems = [];
    let totalAmount = 0;

    for (const entry of customer.cart) {
      if (!entry || !entry.product) {
        return res.status(400).json({ success: false, message: 'One or more products are no longer available.' });
      }

      if (entry.quantity > entry.product.stock) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${entry.product.name}.`,
        });
      }

      totalAmount += entry.product.price * entry.quantity;
      orderItems.push({
        product: entry.product._id,
        name: entry.product.name,
        price: entry.product.price,
        quantity: entry.quantity,
        image: entry.product.image,
      });
    }

    const pendingOrder = await Order.create({
      user: req.user._id,
      items: orderItems,
      shippingAddress: validation.value,
      totalAmount,
      paymentStatus: 'PENDING',
      status: 'PENDING_PAYMENT',
    });

    let razorpayOrderId = `mock_order_${pendingOrder._id.toString()}`;
    let razorpayKeyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_demo';
    let amountInPaise = Math.round(totalAmount * 100);

    if (isRazorpayConfigured && razorpay) {
      const createdRazorpayOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: pendingOrder._id.toString(),
      });

      razorpayOrderId = createdRazorpayOrder.id;
    }

    pendingOrder.razorpayOrderId = razorpayOrderId;
    await pendingOrder.save();

    return res.status(200).json({
      success: true,
      shopKartOrderId: pendingOrder._id,
      razorpayOrderId,
      amount: amountInPaise,
      currency: 'INR',
      key: razorpayKeyId,
      mock: !isRazorpayConfigured,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const {
      shopKartOrderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      mock,
    } = req.body;

    if (!shopKartOrderId || !mongoose.Types.ObjectId.isValid(shopKartOrderId)) {
      return res.status(400).json({ success: false, message: 'Invalid order id' });
    }

    const order = await Order.findById(shopKartOrderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to this order' });
    }

    if (mock === true || !isRazorpayConfigured || !process.env.RAZORPAY_KEY_SECRET) {
      order.paymentStatus = 'PAID';
      order.status = 'PLACED';
      order.razorpayPaymentId = razorpay_payment_id || `mock_payment_${Date.now()}`;
      await order.save();

      const customer = await Customer.findById(req.user._id);
      if (customer) {
        customer.cart = [];
        await customer.save();
      }

      return res.status(200).json({
        success: true,
        message: 'Payment verified and order placed',
        order,
      });
    }

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${order.razorpayOrderId}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    order.paymentStatus = 'PAID';
    order.status = 'PLACED';
    order.razorpayPaymentId = razorpay_payment_id;
    await order.save();

    const customer = await Customer.findById(req.user._id);
    if (customer) {
      customer.cart = [];
      await customer.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Payment verified and order placed',
      order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid order id' });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to this order' });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};
