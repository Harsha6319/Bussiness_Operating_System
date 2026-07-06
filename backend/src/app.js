import 'dotenv/config';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { errorHandler, notFound } from './middleware/error.middleware.js';
import { auditMiddleware } from './middleware/audit.middleware.js';
import routes from './routes/index.js';

export const app = express();



app.use(cors({
  origin: 'https://bussiness-operating-system-git-main-harsha6319.vercel.app',
  credentials: true // Include this if your app uses cookies or sessions
}));


app.use(helmet());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ai-bos-api', timestamp: new Date().toISOString() });
});

app.use(auditMiddleware);
app.use('/api/v1', routes);
app.use(notFound);
app.use(errorHandler);
