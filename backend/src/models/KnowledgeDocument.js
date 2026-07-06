import mongoose from 'mongoose';

const knowledgeDocumentSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    title: { type: String, required: true, trim: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    status: { type: String, enum: ['Processing', 'Ready', 'Failed'], default: 'Processing' },
    sourceType: { type: String, enum: ['pdf', 'docx', 'txt', 'markdown', 'other'], default: 'other' },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    deletedAt: Date,
    metadata: mongoose.Schema.Types.Mixed
  },
  { timestamps: true }
);

knowledgeDocumentSchema.index({ organizationId: 1, title: 'text', originalName: 'text' });

export const KnowledgeDocument = mongoose.model('KnowledgeDocument', knowledgeDocumentSchema);
