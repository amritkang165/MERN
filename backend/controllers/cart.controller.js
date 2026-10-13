import mongoose from 'mongoose';
import Customer from '../models/customer.model.js';
import Product from '../models/product.model.js';

export const getCart = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user._id)
      .populate({
        path: 'cart.product',
        select: 'name price category image stock',
      });

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const items = (customer.cart || [])
      .filter((entry) => entry && entry.product)
      .map((entry) => ({
        productId: entry.product._id,
        _id: entry.product._id,
        name: entry.product.name,
        price: entry.product.price,
        category: entry.product.category,
        image: entry.product.image,
        stock: entry.product.stock,
        quantity: entry.quantity,
      }));

    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return res.status(200).json({
      success: true,
      count: items.length,
      total,
      items,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

export const addToCart = async (req, res) => {
  try {
    const { productId } = req.params;
    const quantity = Number(req.body?.quantity || 1);

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid Product Id' });
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be a positive integer' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const customer = await Customer.findById(req.user._id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const existingItem = customer.cart.find((item) => item.product.toString() === productId);
    const nextQuantity = existingItem ? existingItem.quantity + quantity : quantity;

    if (nextQuantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} units available for ${product.name}`,
      });
    }

    if (existingItem) {
      existingItem.quantity = nextQuantity;
    } else {
      customer.cart.push({ product: product._id, quantity });
    }

    await customer.save();

    return res.status(200).json({
      success: true,
      message: 'Product added to cart',
      cart: customer.cart,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

export const updateCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const quantity = Number(req.body?.quantity);

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid Product Id' });
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be a positive integer' });
    }

    const customer = await Customer.findById(req.user._id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const cartItem = customer.cart.find((item) => item.product.toString() === productId);
    if (!cartItem) {
      return res.status(404).json({ success: false, message: 'Product not found in cart' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (quantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} units available for ${product.name}`,
      });
    }

    cartItem.quantity = quantity;
    await customer.save();

    return res.status(200).json({
      success: true,
      message: 'Cart updated',
      cart: customer.cart,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

export const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid Product Id' });
    }

    const customer = await Customer.findById(req.user._id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const initialLength = customer.cart.length;
    customer.cart = customer.cart.filter((item) => item.product.toString() !== productId);

    if (customer.cart.length === initialLength) {
      return res.status(404).json({ success: false, message: 'Product not found in cart' });
    }

    await customer.save();

    return res.status(200).json({
      success: true,
      message: 'Product removed from cart',
      cart: customer.cart,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};
