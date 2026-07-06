import { AgentTask } from '../models/AgentTask.js';
import { DocumentChunk } from '../models/DocumentChunk.js';
import { KnowledgeDocument } from '../models/KnowledgeDocument.js';
import { Message } from '../models/Message.js';
import { agentService } from '../ai/services/agent.service.js';
import { chatService } from '../ai/services/chat.service.js';
import { knowledgeService } from '../ai/services/knowledge.service.js';
import { reportService } from '../ai/services/report.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

export const chat = asyncHandler(async (req, res) => {
  const data = await chatService.chat({
    organizationId: req.organizationId,
    userId: req.user._id,
    message: req.body.message,
    conversationId: req.body.conversationId,
    mode: req.body.mode || 'business'
  });
  res.json({ data });
});

export const streamChat = asyncHandler(async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  const data = await chatService.chat({
    organizationId: req.organizationId,
    userId: req.user._id,
    message: req.body.message,
    conversationId: req.body.conversationId,
    mode: req.body.mode || 'business'
  });
  const words = data.answer.split(' ');
  for (const word of words) {
    res.write(`data: ${JSON.stringify({ token: `${word} ` })}\n\n`);
  }
  res.write(`data: ${JSON.stringify({ done: true, conversationId: data.conversation._id, sources: data.sources })}\n\n`);
  res.end();
});

export const listConversations = asyncHandler(async (req, res) => {
  const data = await chatService.listConversations({ organizationId: req.organizationId, userId: req.user._id, search: req.query.search });
  res.json({ data });
});

export const updateConversation = asyncHandler(async (req, res) => {
  const data = await chatService.updateConversation({ organizationId: req.organizationId, userId: req.user._id, conversationId: req.params.id, payload: req.body });
  if (!data) throw new ApiError(404, 'Conversation not found');
  res.json({ data });
});

export const deleteConversation = asyncHandler(async (req, res) => {
  const data = await chatService.deleteConversation({ organizationId: req.organizationId, userId: req.user._id, conversationId: req.params.id });
  if (!data) throw new ApiError(404, 'Conversation not found');
  res.json({ data });
});

export const conversationMessages = asyncHandler(async (req, res) => {
  const data = await Message.find({ organizationId: req.organizationId, conversation: req.params.id }).sort('createdAt');
  res.json({ data });
});

export const uploadDocument = asyncHandler(async (req, res) => {
  const data = await knowledgeService.upload({ organizationId: req.organizationId, userId: req.user._id, file: req.file, title: req.body.title });
  res.status(201).json({ data });
});

export const listDocuments = asyncHandler(async (req, res) => {
  const data = await KnowledgeDocument.find({ organizationId: req.organizationId, deletedAt: { $exists: false } }).sort('-createdAt');
  res.json({ data });
});

export const deleteDocument = asyncHandler(async (req, res) => {
  const document = await KnowledgeDocument.findOneAndUpdate({ _id: req.params.id, organizationId: req.organizationId }, { deletedAt: new Date() }, { new: true });
  if (!document) throw new ApiError(404, 'Document not found');
  await DocumentChunk.deleteMany({ organizationId: req.organizationId, document: document._id });
  res.json({ data: document });
});

export const askKnowledge = asyncHandler(async (req, res) => {
  const data = await knowledgeService.answer({ organizationId: req.organizationId, question: req.body.question, topK: req.body.topK || 5 });
  res.json({ data });
});

export const listReports = asyncHandler(async (req, res) => {
  const data = await reportService.list({ organizationId: req.organizationId });
  res.json({ data });
});

export const generateReport = asyncHandler(async (req, res) => {
  const data = await reportService.generate({ organizationId: req.organizationId, userId: req.user._id, type: req.body.type, format: req.body.format || 'markdown' });
  res.status(201).json({ data });
});

export const runAgent = asyncHandler(async (req, res) => {
  const data = await agentService.run({ organizationId: req.organizationId, userId: req.user._id, workflow: req.body.workflow });
  res.status(202).json({ data });
});

export const workflowLogs = asyncHandler(async (req, res) => {
  const data = await agentService.logs({ organizationId: req.organizationId });
  res.json({ data });
});

export const agentTasks = asyncHandler(async (req, res) => {
  const data = await AgentTask.find({ organizationId: req.organizationId }).sort('-createdAt').limit(50);
  res.json({ data });
});
