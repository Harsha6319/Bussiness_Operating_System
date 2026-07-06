import { AIReport } from '../../models/AIReport.js';
import { getBusinessSnapshot } from '../../services/reporting.service.js';
import { aiProviderService } from './ai-provider.service.js';
import { PromptService } from './prompt.service.js';

const titles = {
  sales: 'Sales Report',
  inventory: 'Inventory Report',
  customer: 'Customer Report',
  finance: 'Financial Summary',
  orders: 'Order Report',
  business: 'Business Summary',
  weekly: 'Weekly Business Report',
  monthly: 'Monthly Business Report'
};

export class ReportService {
  async list({ organizationId }) {
    return AIReport.find({ organizationId }).sort('-createdAt').limit(50);
  }

  async generate({ organizationId, userId, type = 'business', format = 'markdown' }) {
    const snapshot = await getBusinessSnapshot(organizationId);
    const promptName = ['sales', 'inventory', 'finance', 'customer'].includes(type) ? type : 'business-analysis';
    const prompt = await PromptService.getPrompt(promptName);
    const response = await aiProviderService.complete([
      { role: 'system', content: `${prompt}\nGenerate a highly concise, visually structured ${format} report strictly under 400 words. You MUST use Markdown headers (##), bold text, concise bullet points, and tables to organize the data beautifully. Do not output walls of text. Focus only on the most critical findings and actionable recommendations.` },
      { role: 'user', content: JSON.stringify(snapshot).slice(0, 14000) }
    ]);

    return AIReport.create({
      organizationId,
      type,
      title: titles[type] || 'AI Report',
      content: response.content,
      format,
      generatedBy: userId,
      metadata: { tokenUsage: response.usage }
    });
  }
}

export const reportService = new ReportService();
