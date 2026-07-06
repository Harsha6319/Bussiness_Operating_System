import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { ROLES } from '../constants/roles.js';
import { Customer } from '../models/Customer.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { Setting } from '../models/Setting.js';
import { Transaction } from '../models/Transaction.js';
import { User } from '../models/User.js';

dotenv.config();

const organizationId = new mongoose.Types.ObjectId();
const firstNames = ['Aarav', 'Isha', 'Kabir', 'Mira', 'Dev', 'Sara', 'Rohan', 'Nisha', 'Arjun', 'Tara'];
const categories = ['Grocery', 'Electronics', 'Stationery', 'Home', 'Beauty'];
const paymentMethods = ['Cash', 'UPI', 'Card', 'Bank'];

function pick(items, index) {
  return items[index % items.length];
}

async function seed() {
  await connectDB();
  await Promise.all([
    User.deleteMany({ email: /seed\.ai-bos\.local$/ }),
    Customer.deleteMany({ organizationId }),
    Product.deleteMany({ organizationId }),
    Order.deleteMany({ organizationId }),
    Transaction.deleteMany({ organizationId }),
    Setting.deleteMany({ organizationId })
  ]);

  const owner = await User.create({
    organizationId,
    name: 'Seed Owner',
    email: 'owner@seed.ai-bos.local',
    password: 'Password123!',
    role: ROLES.OWNER,
    phone: '+91 90000 00000'
  });

  await Setting.create({ organizationId, businessName: 'AI-BOS Demo Store', profile: { industry: 'Retail', currency: 'USD' } });

  const customers = await Customer.insertMany(Array.from({ length: 20 }).map((_, index) => ({
    organizationId,
    customerId: `CUS-${String(index + 1).padStart(6, '0')}`,
    name: `${pick(firstNames, index)} ${pick(['Shah', 'Mehta', 'Rao', 'Patel'], index)}`,
    phone: `+91 98${String(10000000 + index)}`,
    email: `customer${index + 1}@seed.ai-bos.local`,
    customerType: index % 4 === 0 ? 'Business' : 'Individual',
    status: index % 9 === 0 ? 'Inactive' : 'Active',
    gstNumber: index % 4 === 0 ? `GSTDEMO${index + 1}` : '',
    notes: 'Seed CRM record',
    createdBy: owner._id
  })));

  const products = await Product.insertMany(Array.from({ length: 50 }).map((_, index) => {
    const stockQuantity = index % 13 === 0 ? 0 : 3 + (index % 40);
    const price = 20 + (index % 15) * 7;
    return {
      organizationId,
      productId: `PRD-${String(index + 1).padStart(6, '0')}`,
      name: `${pick(categories, index)} Product ${index + 1}`,
      description: 'Seed inventory item',
      category: pick(categories, index),
      sku: `SKU-${String(index + 1).padStart(4, '0')}`,
      barcode: `BAR${100000 + index}`,
      qrCode: `QR${100000 + index}`,
      stockQuantity,
      lowStockThreshold: 5,
      maximumStock: 100,
      price,
      sellingPrice: price,
      costPrice: price * 0.65,
      purchasePrice: price * 0.65,
      supplier: `Supplier ${1 + (index % 6)}`,
      warehouse: `Warehouse ${1 + (index % 3)}`,
      status: 'Active',
      isActive: true,
      createdBy: owner._id
    };
  }));

  const orders = [];
  for (let index = 0; index < 25; index += 1) {
    const customer = pick(customers, index);
    const product = pick(products, index + 3);
    const quantity = 1 + (index % 3);
    const subtotal = product.price * quantity;
    orders.push({
      organizationId,
      orderNumber: `ORD-${String(index + 1).padStart(6, '0')}`,
      customer: customer._id,
      items: [{ product: product._id, name: product.name, quantity, unitPrice: product.price, total: subtotal }],
      subtotal,
      tax: subtotal * 0.05,
      discount: index % 5 === 0 ? 5 : 0,
      total: subtotal + subtotal * 0.05 - (index % 5 === 0 ? 5 : 0),
      grandTotal: subtotal + subtotal * 0.05 - (index % 5 === 0 ? 5 : 0),
      status: pick(['Pending', 'Confirmed', 'Packed', 'Delivered', 'Cancelled'], index),
      paymentStatus: pick(['Pending', 'Paid', 'Partial'], index),
      invoiceNumber: `INV-SEED-${String(index + 1).padStart(5, '0')}`,
      createdBy: owner._id
    });
  }
  await Order.insertMany(orders);

  await Transaction.insertMany(Array.from({ length: 30 }).map((_, index) => ({
    organizationId,
    transactionId: `TXN-${String(index + 1).padStart(6, '0')}`,
    type: index % 3 === 0 ? 'Expense' : 'Income',
    category: index % 3 === 0 ? pick(['Rent', 'Utilities', 'Supplies', 'Marketing'], index) : 'Sales',
    reference: `REF-${String(index + 1).padStart(4, '0')}`,
    amount: 50 + index * 23,
    paymentMethod: pick(paymentMethods, index),
    description: 'Seed ledger entry',
    invoiceNumber: `INV-TXN-${String(index + 1).padStart(5, '0')}`,
    createdBy: owner._id
  })));

  console.log('Seed data created');
  console.log('Login: owner@seed.ai-bos.local / Password123!');
  await mongoose.disconnect();
}

seed().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
