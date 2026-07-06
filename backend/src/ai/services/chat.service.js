import { Conversation } from '../../models/Conversation.js';
import { Message } from '../../models/Message.js';
import { getBusinessSnapshot } from '../../services/reporting.service.js';
import { aiProviderService } from './ai-provider.service.js';
import { knowledgeService } from './knowledge.service.js';
import { memoryService } from './memory.service.js';
import { PromptService } from './prompt.service.js';

export class ChatService {
  async listConversations({ organizationId, userId, search }) {
    const query = { organizationId, user: userId, deletedAt: { $exists: false } };
    if (search) query.title = { $regex: search, $options: 'i' };
    return Conversation.find(query).sort({ isPinned: -1, lastMessageAt: -1, updatedAt: -1 });
  }

  async createConversation({ organizationId, userId, title = 'New conversation', mode = 'business' }) {
    return Conversation.create({ organizationId, user: userId, title, mode, lastMessageAt: new Date() });
  }

  async updateConversation({ organizationId, userId, conversationId, payload }) {
    return Conversation.findOneAndUpdate({ _id: conversationId, organizationId, user: userId }, payload, { new: true });
  }

  async deleteConversation({ organizationId, userId, conversationId }) {
    return Conversation.findOneAndUpdate({ _id: conversationId, organizationId, user: userId }, { deletedAt: new Date() }, { new: true });
  }

  async chat({ organizationId, userId, message, conversationId, mode = 'business' }) {
    const startedAt = Date.now();
    const conversation = conversationId
      ? await Conversation.findOne({ _id: conversationId, organizationId, user: userId, deletedAt: { $exists: false } })
      : await this.createConversation({ organizationId, userId, title: message.slice(0, 64), mode });

    await Message.create({ organizationId, conversation: conversation._id, role: 'user', content: message });
    const recent = await memoryService.recentMessages(conversation._id);

    let answer;
    let sources = [];
    let usage = {};

    if (mode === 'rag') {
      const ragAnswer = await knowledgeService.answer({ organizationId, question: message });
      answer = ragAnswer.answer;
      sources = ragAnswer.sources;
    } else {
      const snapshot = await getBusinessSnapshot(organizationId);
      const prompt = await PromptService.getPrompt(mode === 'advisor' ? 'business-analysis' : 'general-chat');
      const response = await aiProviderService.complete([
        { role: 'system', content: prompt },
        { role: 'system', content: `Business context: ${JSON.stringify(snapshot).slice(0, 12000)}` },
        ...recent,
        { role: 'user', content: PromptService.sanitize(message) }
      ]);
      answer = response.content;
      usage = response.usage;
    }

    const assistantMessage = await Message.create({
      organizationId,
      conversation: conversation._id,
      role: 'assistant',
      content: answer,
      sources,
      tokenUsage: usage,
      latencyMs: Date.now() - startedAt
    });

    conversation.lastMessageAt = new Date();
    if (conversation.title === 'New conversation') conversation.title = message.slice(0, 64);
    await conversation.save();

    return { conversation, message: assistantMessage, answer, sources };
  }
}

export const chatService = new ChatService();
