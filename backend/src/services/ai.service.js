import OpenAI from 'openai';
import { getBusinessSnapshot } from './reporting.service.js';

class OpenAIProvider {
  constructor() {
    this.client = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
    this.model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  }

  async chat(messages) {
    if (!this.client) {
      return 'AI provider is not configured. Add OPENAI_API_KEY to enable live copilot responses.';
    }

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages,
      temperature: 0.2
    });

    return response.choices[0]?.message?.content || 'I could not generate a response.';
  }
}

const provider = new OpenAIProvider();

export async function answerBusinessQuestion({ organizationId, message }) {
  const snapshot = await getBusinessSnapshot(organizationId);
  const toolContext = JSON.stringify({
    metrics: snapshot.metrics,
    lowStock: snapshot.lowStock.map((item) => ({ name: item.name, stockQuantity: item.stockQuantity, threshold: item.lowStockThreshold })),
    topProducts: snapshot.topProducts,
    monthlyRevenue: snapshot.monthlyRevenue
  });

  const lower = message.toLowerCase();
  if (lower.includes('low stock')) {
    const products = snapshot.lowStock.map((item) => `${item.name} (${item.stockQuantity} left)`).join(', ');
    return products ? `Low stock products: ${products}.` : 'No low stock products right now.';
  }

  if (lower.includes('revenue today') || lower.includes('sales today')) {
    return `Today's revenue is ${snapshot.metrics.revenue.toFixed(2)} from ${snapshot.metrics.todayOrders} orders.`;
  }

  return provider.chat([
    { role: 'system', content: 'You are AI-BOS Copilot. Answer as a concise business analyst. Use only the supplied business context. Future tool calling and RAG will plug into this provider boundary.' },
    { role: 'system', content: `Business context: ${toolContext}` },
    { role: 'user', content: message }
  ]);
}
