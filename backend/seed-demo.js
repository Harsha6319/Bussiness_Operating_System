import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Customer } from './src/models/Customer.js';
import { Product } from './src/models/Product.js';
import { User } from './src/models/User.js';

dotenv.config();

async function seedUserOrg() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find a user who is not the generic seed user
    const user = await User.findOne({ email: { $not: /seed\.ai-bos\.local/ } }).sort({ createdAt: -1 });
    if (!user) {
      console.log('No standard user found. Please register a user first.');
      process.exit(1);
    }
    
    const organizationId = user.organizationId;
    console.log(`Seeding demo data for Organization: ${organizationId}`);

    const firstNames = ['Aarav', 'Isha', 'Kabir', 'Mira', 'Dev', 'Sara', 'Rohan', 'Nisha', 'Arjun', 'Tara'];
    const categories = ['Grocery', 'Electronics', 'Stationery', 'Home', 'Beauty'];

    function pick(items, index) { return items[index % items.length]; }

    // Seed 10 Customers
    await Customer.insertMany(Array.from({ length: 10 }).map((_, index) => ({
      organizationId,
      customerId: `CUS-${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`,
      name: `${pick(firstNames, index)} ${pick(['Shah', 'Mehta', 'Rao', 'Patel'], index)}`,
      phone: `+91 98${String(10000000 + index + Math.floor(Math.random() * 1000))}`,
      email: `customer${Math.floor(Math.random() * 10000)}@demo.local`,
      customerType: index % 4 === 0 ? 'Business' : 'Individual',
      status: 'Active',
      createdBy: user._id
    })));

    // Seed 15 Products
    await Product.insertMany(Array.from({ length: 15 }).map((_, index) => {
      const price = 20 + (index % 15) * 7;
      return {
        organizationId,
        productId: `PRD-${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`,
        name: `${pick(categories, index)} Product ${index + 1} Demo`,
        description: 'Demo inventory item',
        category: pick(categories, index),
        sku: `SKU-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
        stockQuantity: 10 + (index * 2),
        price,
        sellingPrice: price,
        status: 'Active',
        isActive: true,
        createdBy: user._id
      };
    }));

    console.log('Successfully seeded demo customers and products for your account!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seedUserOrg();
