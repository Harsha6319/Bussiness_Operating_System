import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
    role: { type: String, enum: ['system', 'user', 'assistant', 'tool'], required: true },
    content: { type: String, required: true },
    sources: [{ title: String, documentId: mongoose.Schema.Types.ObjectId, chunkId: mongoose.Schema.Types.ObjectId, score: Number }],
    metadata: mongoose.Schema.Types.Mixed,
    tokenUsage: { prompt: Number, completion: Number, total: Number },
    latencyMs: Number
  },
  { timestamps: true }
);

export const Message = mongoose.model('Message', messageSchema);
