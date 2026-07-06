import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const promptDir = path.resolve(__dirname, '../prompts');

export class PromptService {
  static async getPrompt(name) {
    const filePath = path.join(promptDir, `${name}.md`);
    return fs.readFile(filePath, 'utf8');
  }

  static sanitize(input = '') {
    return String(input).replace(/```/g, "'''").slice(0, 4000);
  }
}
