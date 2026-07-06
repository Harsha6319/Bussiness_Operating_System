import { Router } from 'express';
import multer from 'multer';
import { STAFF_ROLES } from '../constants/roles.js';
import {
  agentTasks,
  askKnowledge,
  chat,
  conversationMessages,
  deleteConversation,
  deleteDocument,
  generateReport,
  listConversations,
  listDocuments,
  listReports,
  runAgent,
  streamChat,
  updateConversation,
  uploadDocument,
  workflowLogs
} from '../controllers/ai.controller.js';
import { authorize, protect } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { agentRunSchema, aiChatSchema, conversationUpdateSchema, idParamSchema, ragQuestionSchema, reportRequestSchema } from '../validators/schemas.js';

const router = Router();
const upload = multer({
  dest: 'src/uploads/knowledge',
  limits: { fileSize: 10 * 1024 * 1024 }
});

router.use(protect, authorize(...STAFF_ROLES));

router.post('/chat', validate(aiChatSchema), chat);
router.post('/chat/stream', validate(aiChatSchema), streamChat);
router.get('/conversations', listConversations);
router.get('/conversations/:id/messages', validate(idParamSchema), conversationMessages);
router.patch('/conversations/:id', validate(conversationUpdateSchema), updateConversation);
router.delete('/conversations/:id', validate(idParamSchema), deleteConversation);

router.post('/upload-document', upload.single('document'), uploadDocument);
router.get('/documents', listDocuments);
router.delete('/documents/:id', validate(idParamSchema), deleteDocument);
router.post('/knowledge/ask', validate(ragQuestionSchema), askKnowledge);

router.get('/reports', listReports);
router.post('/generate-report', validate(reportRequestSchema), generateReport);

router.post('/agents/run', validate(agentRunSchema), runAgent);
router.get('/agents/logs', workflowLogs);
router.get('/agents/tasks', agentTasks);

export default router;
