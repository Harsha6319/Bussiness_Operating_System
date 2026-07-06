import { GoogleGenAI } from '@google/genai';

export class AIProviderService {
  constructor() {
    this.client = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;
    this.model = 'gemini-2.5-flash';
  }

  async complete(messages, options = {}) {
    if (!this.client) {
      const lastUser = [...messages].reverse().find((message) => message.role === 'user')?.content || '';
      return {
        content: `AI provider is not configured. I can still use local business context, but live LLM reasoning needs GEMINI_API_KEY. Your request was: ${lastUser}`,
        usage: { prompt: 0, completion: 0, total: 0 }
      };
    }

    let systemInstruction = null;
    const contents = [];

    for (const msg of messages) {
      if (msg.role === 'system') {
        if (!systemInstruction) {
          systemInstruction = { role: 'system', parts: [{ text: msg.content }] };
        } else {
          systemInstruction.parts[0].text += '\n' + msg.content;
        }
      } else {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        });
      }
    }

    const config = {
      temperature: options.temperature ?? 0.2
    };

    if (systemInstruction) {
      config.systemInstruction = systemInstruction.parts[0].text;
    }

    const response = await this.client.models.generateContent({
      model: this.model,
      contents,
      config
    });

    return {
      content: response.text || 'I could not generate a response.',
      usage: {
        prompt: response.usageMetadata?.promptTokenCount || 0,
        completion: response.usageMetadata?.candidatesTokenCount || 0,
        total: response.usageMetadata?.totalTokenCount || 0
      }
    };
  }
}

export const aiProviderService = new AIProviderService();
