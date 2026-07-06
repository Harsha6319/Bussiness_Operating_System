import crypto from 'crypto';
import OpenAI from 'openai';

export class EmbeddingService {
  constructor() {
    this.client = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
    this.model = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';
    this.dimensions = 256;
  }

  hash(content) {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  async embed(content) {
    if (this.client) {
      const response = await this.client.embeddings.create({ model: this.model, input: content });
      return response.data[0].embedding;
    }

    const vector = Array.from({ length: this.dimensions }, () => 0);
    const words = content.toLowerCase().match(/[a-z0-9]+/g) || [];
    for (const word of words) {
      const hash = crypto.createHash('md5').update(word).digest();
      const index = hash[0] % this.dimensions;
      vector[index] += 1;
    }
    const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
    return vector.map((value) => value / magnitude);
  }
}

export const embeddingService = new EmbeddingService();
