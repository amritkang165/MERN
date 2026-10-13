import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { fileURLToPath } from 'node:url';
import Product from '../models/product.model.js';

dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)) });

const mongoUri = process.env.dbURL || process.env.dbUrl || process.env.DB_URL;

if (!mongoUri) {
  throw new Error('Missing MongoDB connection string in backend/.env');
}

const demoProducts = [
  {
    name: 'Studio Wireless Headphones',
    description: 'Comfortable over-ear headphones with rich sound for work, travel, and everyday listening.',
    price: 4999,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=85',
    stock: 18,
  },
  {
    name: 'Mechanical Keyboard',
    description: 'A compact mechanical keyboard with a satisfying tactile feel for home or office use.',
    price: 2999,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=900&q=85',
    stock: 12,
  },
  {
    name: 'Everyday Canvas Backpack',
    description: 'A durable everyday backpack with room for your essentials and a padded laptop sleeve.',
    price: 2199,
    category: 'Fashion',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=85',
    stock: 9,
  },
  {
    name: 'Minimal Classic Watch',
    description: 'A clean, versatile timepiece with a simple dial that pairs easily with everyday outfits.',
    price: 3499,
    category: 'Fashion',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=85',
    stock: 7,
  },
  {
    name: 'The Design of Everyday Things',
    description: 'An approachable introduction to the principles behind thoughtful, user-friendly design.',
    price: 899,
    category: 'Books',
    image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=900&q=85',
    stock: 24,
  },
  {
    name: 'Classic Running Sneakers',
    description: 'Lightweight everyday sneakers designed for comfortable walks and casual outings.',
    price: 4299,
    category: 'Fashion',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=85',
    stock: 15,
  },
];

try {
  await mongoose.connect(mongoUri);
  const results = await Promise.all(
    demoProducts.map(({ name, ...product }) =>
      Product.updateOne({ name }, { $set: { name, ...product } }, { upsert: true }),
    ),
  );

  const created = results.filter((result) => result.upsertedCount > 0).length;
  const updated = results.length - created;
  console.log(`Demo products ready: ${created} created, ${updated} already existed and were refreshed.`);
} finally {
  await mongoose.disconnect();
}
