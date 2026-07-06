import mongoose from 'mongoose';

const embeddingMetadataSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    document: { type: mongoose.Schema.Types.ObjectId, ref: 'KnowledgeDocument' },
    chunk: { type: mongoose.Schema.Types.ObjectId, ref: 'DocumentChunk' },
    provider: { type: String, default: 'openai' },
    model: { type: String, default: 'text-embedding-3-small' },
    contentHash: { type: String, required: true },
    dimensions: Number
  },
  { timestamps: true }
);

embeddingMetadataSchema.index({ organizationId: 1, contentHash: 1 }, { unique: true });

export const EmbeddingMetadata = mongoose.model('EmbeddingMetadata', embeddingMetadataSchema);
