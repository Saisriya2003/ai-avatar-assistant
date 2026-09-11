import assert from 'node:assert/strict';
import { test } from 'node:test';

// The engine is browser code; give it the globals it expects. There is no
// speechSynthesis in Node, so speak() exercises the timed fallback path.
globalThis.window = globalThis;
const { createAvatarController, visemeFromChunk, VISEMES, EMOTIONS } = await import('../src/avatar/engine.js');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

test('visemes are derived from the leading sound of each chunk', () => {
  assert.equal(visemeFromChunk('mmm'), 'closed');
  assert.equal(visemeFromChunk('ban'), 'closed');
  assert.equal(visemeFromChunk('fee'), 'small');
  assert.equal(visemeFromChunk('see'), 'small');
  assert.equal(visemeFromChunk('lee'), 'mid');
  assert.equal(visemeFromChunk('eat'), 'mid');
  assert.equal(visemeFromChunk('all'), 'open');
  assert.equal(visemeFromChunk('oh'), 'wide');
  assert.equal(visemeFromChunk('who'), 'wide');
  assert.equal(visemeFromChunk('...'), 'closed');
  assert.equal(visemeFromChunk(''), 'closed');
  assert.deepEqual(VISEMES, ['closed', 'small', 'mid', 'open', 'wide']);
  assert.deepEqual(EMOTIONS, ['neutral', 'smile', 'listen', 'think', 'concern']);
});

test('controller starts neutral and publishes snapshots to subscribers', () => {
  const c = createAvatarController();
  try {
    assert.deepEqual(c.getState(), {
      emotion: 'neutral',
      viseme: 'closed',
      listening: false,
      speaking: false,
      lookAt: { x: 0, y: 0 },
      blink: false,
    });
    const seen = [];
    const unsubscribe = c.subscribe((s) => seen.push(s.emotion));
    assert.deepEqual(seen, ['neutral'], 'subscribe delivers the current state immediately');
    c.setEmotion('smile');
    c.setEmotion('not-an-emotion');
    assert.deepEqual(seen, ['neutral', 'smile'], 'invalid emotions are ignored');
    unsubscribe();
    c.setEmotion('think');
    assert.equal(seen.length, 2, 'unsubscribed listeners stop receiving');
    assert.equal(c.getState().emotion, 'think');
  } finally {
    c.destroy();
  }
});

test('listening switches the face; gaze is clamped and pointer-locked', () => {
  const c = createAvatarController();
  try {
    c.setListening(true);
    assert.equal(c.getState().listening, true);
    assert.equal(c.getState().emotion, 'listen');

    c.lookAt(5, -7, 'script');
    assert.deepEqual(c.getState().lookAt, { x: 1, y: -1 });

    c.lookAt(0.25, 0.5, 'pointer');
    c.lookAt(-0.9, -0.9, 'idle');
    assert.deepEqual(c.getState().lookAt, { x: 0.25, y: 0.5 }, 'idle wander cannot override the pointer');
    c.releaseLook();
    assert.deepEqual(c.getState().lookAt, { x: 0, y: 0 });
    c.lookAt(-0.3, 0.1, 'idle');
    assert.deepEqual(c.getState().lookAt, { x: -0.3, y: 0.1 }, 'idle wander resumes after release');

    c.setViseme('wide');
    assert.equal(c.getState().viseme, 'wide');
    c.setSpeaking(false);
    assert.equal(c.getState().viseme, 'closed', 'mouth closes when speaking ends');
  } finally {
    c.destroy();
  }
});

test('blink is a short pulse', async () => {
  const c = createAvatarController();
  try {
    c.blink();
    assert.equal(c.getState().blink, true);
    await sleep(180);
    assert.equal(c.getState().blink, false);
  } finally {
    c.destroy();
  }
});

test('speak animates the mouth, then resolves with the mouth closed', async () => {
  const c = createAvatarController();
  try {
    const visemes = new Set();
    c.subscribe((s) => visemes.add(s.viseme));
    const done = c.speak('Hello there, how are you today?');
    assert.equal(c.getState().speaking, true);
    await sleep(200);
    assert.ok(visemes.size >= 2, 'several mouth shapes were shown while speaking');
    await done;
    assert.equal(c.getState().speaking, false);
    assert.equal(c.getState().viseme, 'closed');
    await c.speak('   '); // empty text resolves immediately
    assert.equal(c.getState().speaking, false);
  } finally {
    c.destroy();
  }
});

test('stop() interrupts speech and manual visemes are not overridden afterwards', async () => {
  const c = createAvatarController();
  try {
    const done = c.speak('A fairly long sentence that would keep the mouth moving for a while.');
    await sleep(120);
    c.stop();
    assert.equal(c.getState().speaking, false);
    c.setViseme('open');
    await sleep(200);
    assert.equal(c.getState().viseme, 'open', 'stale ticker did not clobber the manual viseme');
    await done;
  } finally {
    c.destroy();
  }
});

test('destroy() is reversible: start() brings the idle life back and keeps subscribers', async () => {
  const c = createAvatarController();
  const seen = [];
  c.subscribe((s) => seen.push(s));
  c.destroy();
  c.start();
  c.setEmotion('concern');
  assert.equal(seen.at(-1).emotion, 'concern', 'subscriber survived destroy/start');
  c.destroy();
});
