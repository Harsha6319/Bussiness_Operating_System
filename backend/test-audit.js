import 'dotenv/config';
import mongoose from 'mongoose';
import { AuditLog } from './src/models/AuditLog.js';

async function checkLogs() {
  await mongoose.connect(process.env.MONGODB_URI);
  const logs = await AuditLog.find({ url: { $regex: '/ai/chat' } }).sort('-createdAt').limit(10);
  console.log(logs.map(l => `${l.method} ${l.url} - Status: ${l.status} - Msg: ${l.errorMessage}`));
  process.exit(0);
}
checkLogs().catch(console.error);
