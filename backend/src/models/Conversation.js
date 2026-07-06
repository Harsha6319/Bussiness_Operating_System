import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, default: 'New conversation', trim: true },
    mode: { type: String, enum: ['business', 'rag', 'advisor'], default: 'business' },
    isPinned: { type: Boolean, default: false },
    deletedAt: Date,
    lastMessageAt: Date
  },
  { timestamps: true }
);

conversationSchema.index({ organizationId: 1, user: 1, lastMessageAt: -1 });

export const Conversation = mongoose.model('Conversation', conversationSchema);
