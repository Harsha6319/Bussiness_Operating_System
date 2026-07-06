import { Message } from '../../models/Message.js';

export class MemoryService {
  async recentMessages(conversationId, limit = 12) {
    return Message.find({ conversation: conversationId }).sort('-createdAt').limit(limit).lean()
      .then((messages) => messages.reverse().map((message) => ({ role: message.role, content: message.content })));
  }
}

export const memoryService = new MemoryService();
