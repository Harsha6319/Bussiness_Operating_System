import { DocumentChunk } from '../../models/DocumentChunk.js';
import { embeddingService } from './embedding.service.js';

function cosineSimilarity(a = [], b = []) {
  const length = Math.min(a.length, b.length);
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let index = 0; index < length; index += 1) {
    dot += a[index] * b[index];
    magA += a[index] * a[index];
    magB += b[index] * b[index];
  }
  return dot / ((Math.sqrt(magA) * Math.sqrt(magB)) || 1);
}

export class VectorService {
  async search({ organizationId, query, topK = 5 }) {
    const queryEmbedding = await embeddingService.embed(query);
    const chunks = await DocumentChunk.find({ organizationId }).populate('document', 'title originalName status deletedAt').limit(1000);

    return chunks
      .filter((chunk) => chunk.document?.status === 'Ready' && !chunk.document?.deletedAt)
      .map((chunk) => ({ chunk, score: cosineSimilarity(queryEmbedding, chunk.embedding) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }
}

export const vectorService = new VectorService();
