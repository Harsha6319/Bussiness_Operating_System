import mongoose from 'mongoose';

const documentChunkSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    document: { type: mongoose.Schema.Types.ObjectId, ref: 'KnowledgeDocument', required: true, index: true },
    chunkIndex: { type: Number, required: true },
    content: { type: String, required: true },
    embedding: [Number],
    metadata: mongoose.Schema.Types.Mixed
  },
  { timestamps: true }
);

documentChunkSchema.index({ organizationId: 1, content: 'text' });

export const DocumentChunk = mongoose.model('DocumentChunk', documentChunkSchema);
