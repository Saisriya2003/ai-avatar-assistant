import { localReply } from './localBrain.js';

const TIMEOUT_MS = 9000;

export async function sendChat({ messages, mode }) {
  const payload = { messages, mode };
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    window.clearTimeout(timer);
    if (!res.ok) throw new Error('chat-failed');
    const data = await res.json();
    if (!data?.reply) throw new Error('empty');
    return {
      reply: data.reply,
      emotion: data.emotion || 'neutral',
      source: 'server',
    };
  } catch {
    window.clearTimeout(timer);
    const local = localReply(payload);
    return { ...local, source: 'local' };
  }
}

export async function fetchHealth() {
  try {
    const res = await fetch('/api/health', { cache: 'no-store' });
    if (!res.ok) throw new Error('health');
    const data = await res.json();
    return { server: true, llm: Boolean(data.llm), engine: data.engine || 'local' };
  } catch {
    return { server: false, llm: false, engine: 'client-fallback' };
  }
}
