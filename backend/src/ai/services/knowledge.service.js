import fs from 'fs/promises';
import path from 'path';
import { DocumentChunk } from '../../models/DocumentChunk.js';
import { EmbeddingMetadata } from '../../models/EmbeddingMetadata.js';
import { KnowledgeDocument } from '../../models/KnowledgeDocument.js';
import { chunkText } from '../utils/chunker.js';
import { embeddingService } from './embedding.service.js';
import { PromptService } from './prompt.service.js';
import { vectorService } from './vector.service.js';
import { aiProviderService } from './ai-provider.service.js';

const allowedTypes = new Map([
  ['text/plain', 'txt'],
  ['text/markdown', 'markdown'],
  ['application/pdf', 'pdf'],
  ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'docx']
]);

export class KnowledgeService {
  validateFile(file) {
    if (!file) throw new Error('Document file is required');
    if (file.size > 10 * 1024 * 1024) throw new Error('Document must be 10MB or smaller');
    if (!allowedTypes.has(file.mimetype)) throw new Error('Unsupported document type');
  }

  async extractText(file) {
    const ext = path.extname(file.originalname).toLowerCase();
    if (file.mimetype === 'text/plain' || file.mimetype === 'text/markdown' || ext === '.txt' || ext === '.md') {
      return fs.readFile(file.path, 'utf8');
    }
    return `Document ${file.originalname} uploaded. Text extraction for ${file.mimetype} is architecture-ready; add a PDF/DOCX parser in production.`;
  }

  async upload({ organizationId, userId, file, title }) {
    this.validateFile(file);
    const sourceType = allowedTypes.get(file.mimetype) || 'other';
    const document = await KnowledgeDocument.create({
      organizationId,
      title: title || file.originalname,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      sourceType,
      uploadedBy: userId,
      status: 'Processing'
    });

    try {
      const text = await this.extractText(file);
      const chunks = chunkText(text);
      for (let index = 0; index < chunks.length; index += 1) {
        const content = chunks[index];
        const contentHash = embeddingService.hash(`${document._id}:${content}`);
        const embedding = await embeddingService.embed(content);
        const chunk = await DocumentChunk.create({ organizationId, document: document._id, chunkIndex: index, content, embedding, metadata: { source: file.originalname } });
        await EmbeddingMetadata.create({ organizationId, document: document._id, chunk: chunk._id, contentHash, model: embeddingService.model, dimensions: embedding.length });
      }
      document.status = 'Ready';
      document.metadata = { chunks: chunks.length };
      await document.save();
      return document;
    } catch (error) {
      document.status = 'Failed';
      document.metadata = { error: error.message };
      await document.save();
      throw error;
    } finally {
      await fs.unlink(file.path).catch(() => null);
    }
  }

  async answer({ organizationId, question, topK = 5 }) {
    const matches = await vectorService.search({ organizationId, query: question, topK });
    const sources = matches.map(({ chunk, score }) => ({
      title: chunk.document.title,
      documentId: chunk.document._id,
      chunkId: chunk._id,
      score: Number(score.toFixed(4)),
      excerpt: chunk.content.slice(0, 240)
    }));

    const context = matches.map(({ chunk, score }) => `[${chunk.document.title} | score ${score.toFixed(2)}]\n${chunk.content}`).join('\n\n');
    const prompt = await PromptService.getPrompt('rag');
    const response = await aiProviderService.complete([
      { role: 'system', content: prompt },
      { role: 'system', content: `Retrieved sources:\n${context || 'No sources found.'}` },
      { role: 'user', content: PromptService.sanitize(question) }
    ]);

    const confidence = sources.length ? sources.reduce((sum, source) => sum + source.score, 0) / sources.length : 0;
    return { answer: response.content, sources, confidence: Number(confidence.toFixed(4)) };
  }
}

export const knowledgeService = new KnowledgeService();
