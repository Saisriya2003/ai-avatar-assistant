import assert from 'node:assert/strict';
import { test } from 'node:test';
import { localReply } from '../src/lib/localBrain.js';

const ask = (text, mode = 'support') => localReply({ mode, messages: [{ role: 'user', text }] });

test('client fallback routes the suggested prompts like the server', () => {
  assert.match(ask('What is Lumen Cloud?').reply, /Lumen Cloud is a live workspace/);
  assert.match(ask('Explain workspace pricing').reply, /Three plans/);
  assert.match(ask('How do I open a ticket?').reply, /To open a ticket/);
  assert.match(ask('What is your refund policy?').reply, /14-day full refund/);
  assert.match(ask("What's on my calendar today?", 'assistant').reply, /9:30 Standup/);
});

test('reminders echo back what was asked', () => {
  const result = ask('Remind me to send the report at 4', 'assistant');
  assert.equal(result.emotion, 'smile');
  assert.match(result.reply, /Pinned\. I will hold “send the report at 4”/);
});

test('empty input gets a listening prompt instead of a fallback', () => {
  const result = localReply({ mode: 'support', messages: [{ role: 'user', text: '   ' }] });
  assert.equal(result.emotion, 'listen');
  assert.match(result.reply, /I am listening/);
});

test('unknown questions fall back with a clarifying question', () => {
  const result = ask('quantum flux capacitor', 'assistant');
  assert.equal(result.emotion, 'think');
  assert.match(result.reply, /quantum flux capacitor/);
});
