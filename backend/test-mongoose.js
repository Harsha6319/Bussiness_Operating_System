import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from './src/models/User.js';
import { Setting } from './src/models/Setting.js';

async function testMongoose() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');
  
  const organizationId = new mongoose.Types.ObjectId();
  const email = `test_${Date.now()}@test.com`;
  
  console.time('User.create');
  const user = await User.create({ organizationId, name: 'Test', email, password: 'Password123!', role: 'Owner' });
  console.timeEnd('User.create');
  
  console.time('Setting.create');
  await Setting.create({ organizationId, businessName: 'Test', profile: { email } });
  console.timeEnd('Setting.create');
  
  console.log('Created user and setting successfully');
  process.exit(0);
}

testMongoose().catch(console.error);
