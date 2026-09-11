import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { replyTo } from './brain.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const PORT = Number(process.env.PORT) || 5060;
const app = express();

app.use(cors({ origin: true }));
app.use(express.json({ limit: '64kb' }));

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    llm: Boolean(process.env.OPENAI_API_KEY),
    engine: process.env.OPENAI_API_KEY ? 'openai' : 'local',
  });
});

app.post('/api/chat', async (req, res) => {
  const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
  const mode = req.body?.mode === 'assistant' ? 'assistant' : 'support';

  try {
    const result = await replyTo({ messages, mode });
    res.json({
      reply: result.reply,
      emotion: result.emotion || 'neutral',
    });
  } catch {
    res.status(200).json({
      reply:
        'I hit a fault in the live engine and switched to a local answer. Try that question once more, or ask about plans, tickets, or the calendar.',
      emotion: 'concern',
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  const llm = Boolean(process.env.OPENAI_API_KEY);
  console.log(`Aria server listening on http://127.0.0.1:${PORT}`);
  console.log(`Reply engine: ${llm ? 'OpenAI' : 'local intents'}`);
});
