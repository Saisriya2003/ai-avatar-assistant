import assert from 'node:assert/strict';
import { test } from 'node:test';
import { localServerReply, replyTo } from '../server/brain.js';

const ask = (text, mode = 'support') => localServerReply({ mode, messages: [{ role: 'user', text }] });

test('every suggested support prompt reaches its own intent', () => {
  assert.match(ask('What is Lumen Cloud?').reply, /Lumen Cloud is a live workspace/);
  assert.match(ask('Explain workspace pricing').reply, /Three plans/);
  assert.match(ask('How do I open a ticket?').reply, /To open a ticket/);
  assert.match(ask('What is your refund policy?').reply, /14-day full refund/);
});

test('every suggested assistant prompt reaches its own intent', () => {
  assert.match(ask("What's on my calendar today?", 'assistant').reply, /9:30 Standup/);
  assert.match(ask('Remind me to send the report at 4', 'assistant').reply, /Pinned/);
  assert.match(ask('Help me plan tomorrow morning', 'assistant').reply, /clean morning/);
  assert.match(ask('Draft a short status update', 'assistant').reply, /Draft status/);
});

test('specific topic words outrank generic question words', () => {
  assert.match(ask('hello, what is the refund policy').reply, /refund/i);
  assert.match(ask('is lumen down right now').reply, /operational/);
  assert.match(ask('which plan is cheaper').reply, /Three plans/);
  assert.match(ask('I was charged twice this month').reply, /refund/i);
  assert.match(ask('how do I invite a teammate to a vault').reply, /Invite from/);
});

test('keys match whole words, so short keys do not fire inside other words', () => {
  // "hi" must not match "this"; with no topic word the support fallback answers.
  const fallback = ask('this is broken');
  assert.equal(fallback.emotion, 'think');
  assert.match(fallback.reply, /plans, a ticket, or a refund/);
  assert.match(ask('hi').reply, /I am the Lumen Cloud support avatar/);
});

test('replies carry an emotion the avatar can render', () => {
  const emotions = new Set(['neutral', 'smile', 'listen', 'think', 'concern']);
  for (const text of ['hi', 'pricing', 'refund', 'ticket', 'status', 'bye', 'gibberish']) {
    assert.ok(emotions.has(ask(text).emotion), `${text} -> ${ask(text).emotion}`);
  }
  assert.equal(ask('What is your refund policy?').emotion, 'concern');
});

test('replyTo uses the local engine when no OpenAI key is configured', async () => {
  const saved = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  try {
    const result = await replyTo({ mode: 'support', messages: [{ role: 'user', text: 'How much does Halo cost?' }] });
    assert.match(result.reply, /\$18/);
  } finally {
    if (saved !== undefined) process.env.OPENAI_API_KEY = saved;
  }
});
