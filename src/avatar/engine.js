/**
 * AvatarEngine — local avatar integration API.
 *
 * Other surfaces (chat, mic, debug drawer) talk to the avatar through this
 * controller instead of reaching into the SVG. A production swap-in
 * (Ready Player Me, D-ID, HeyGen) can implement the same methods.
 */

const VISEMES = ['closed', 'small', 'mid', 'open', 'wide'];
const EMOTIONS = ['neutral', 'smile', 'listen', 'think', 'concern'];

function visemeFromChunk(chunk) {
  const raw = String(chunk || '').toLowerCase();
  const ch = raw.replace(/[^a-z]/g, '')[0];
  if (!ch) return 'closed';
  if ('mbp'.includes(ch)) return 'closed';
  if ('fv'.includes(ch)) return 'small';
  if ('sztdn'.includes(ch)) return 'small';
  if ('l'.includes(ch)) return 'mid';
  if ('eiy'.includes(ch)) return 'mid';
  if ('a'.includes(ch)) return 'open';
  if ('ouw'.includes(ch)) return 'wide';
  if ('r'.includes(ch)) return 'wide';
  return 'mid';
}

function pickVoice() {
  if (typeof speechSynthesis === 'undefined') return null;
  const voices = speechSynthesis.getVoices();
  const scored = voices
    .filter((v) => /^en/i.test(v.lang))
    .map((v) => {
      let score = 0;
      if (/neural|natural|premium|online/i.test(v.name)) score += 4;
      if (/female|zira|samantha|susan|hazel|siri|jenny|aria|google uk english female/i.test(v.name)) {
        score += 6;
      }
      if (/en-US|en-GB/i.test(v.lang)) score += 2;
      return { v, score };
    })
    .sort((a, b) => b.score - a.score);
  return scored[0]?.v || voices.find((v) => v.lang.startsWith('en')) || voices[0] || null;
}

export function createAvatarController() {
  const state = {
    emotion: 'neutral',
    viseme: 'closed',
    listening: false,
    speaking: false,
    lookAt: { x: 0, y: 0 },
    blink: false,
  };

  const listeners = new Set();
  let blinkTimer = 0;
  let wanderTimer = 0;
  let blinkHold = 0;
  let visemeTimer = 0;
  let utterance = null;
  let lookLocked = false;
  let destroyed = false;

  function emit() {
    const snapshot = getState();
    listeners.forEach((fn) => fn(snapshot));
  }

  function getState() {
    return {
      emotion: state.emotion,
      viseme: state.viseme,
      listening: state.listening,
      speaking: state.speaking,
      lookAt: { ...state.lookAt },
      blink: state.blink,
    };
  }

  function setEmotion(emotion) {
    if (!EMOTIONS.includes(emotion)) return;
    state.emotion = emotion;
    emit();
  }

  function setViseme(viseme) {
    if (!VISEMES.includes(viseme)) return;
    state.viseme = viseme;
    emit();
  }

  function setListening(value) {
    state.listening = Boolean(value);
    if (state.listening && !state.speaking) {
      state.emotion = 'listen';
    }
    emit();
  }

  function setSpeaking(value) {
    state.speaking = Boolean(value);
    if (!state.speaking && state.viseme !== 'closed') {
      state.viseme = 'closed';
    }
    emit();
  }

  function lookAt(x, y, source = 'script') {
    if (source === 'pointer') lookLocked = true;
    if (source === 'idle' && lookLocked) return;
    state.lookAt = {
      x: Math.max(-1, Math.min(1, Number(x) || 0)),
      y: Math.max(-1, Math.min(1, Number(y) || 0)),
    };
    emit();
  }

  function releaseLook() {
    lookLocked = false;
    state.lookAt = { x: 0, y: 0 };
    emit();
  }

  function blink() {
    state.blink = true;
    emit();
    window.clearTimeout(blinkHold);
    blinkHold = window.setTimeout(() => {
      state.blink = false;
      emit();
    }, 120);
  }

  function scheduleBlink() {
    window.clearTimeout(blinkTimer);
    const wait = 2400 + Math.random() * 3400;
    blinkTimer = window.setTimeout(() => {
      if (!destroyed) {
        blink();
        scheduleBlink();
      }
    }, wait);
  }

  function scheduleWander() {
    window.clearTimeout(wanderTimer);
    wanderTimer = window.setTimeout(() => {
      if (destroyed) return;
      if (!state.speaking && !state.listening && !lookLocked) {
        lookAt((Math.random() - 0.5) * 0.35, (Math.random() - 0.45) * 0.22, 'idle');
        window.setTimeout(() => {
          if (!lookLocked && !state.listening) lookAt(0, 0, 'idle');
        }, 900 + Math.random() * 700);
      }
      scheduleWander();
    }, 4200 + Math.random() * 2800);
  }

  // Each driveVisemes() call gets a generation id. Clearing the ticker bumps the
  // id so stale closures (interval ticks or late onboundary events) become no-ops.
  let visemeGen = 0;

  function clearVisemeTicker() {
    window.clearInterval(visemeTimer);
    visemeTimer = 0;
    visemeGen += 1;
  }

  function driveVisemes(text) {
    const chars = String(text);
    let i = 0;
    clearVisemeTicker();
    const gen = visemeGen;
    const tick = () => {
      if (gen !== visemeGen) return;
      while (i < chars.length && /[\s.,!?';:]/.test(chars[i])) i += 1;
      if (i >= chars.length) {
        // Text exhausted: close the mouth once and stop ticking so manual
        // setViseme() calls (e.g. from the Avatar API drawer) are not overridden.
        clearVisemeTicker();
        setViseme('closed');
        return;
      }
      setViseme(visemeFromChunk(chars.slice(i, i + 3)));
      i += 1;
    };
    tick();
    visemeTimer = window.setInterval(tick, 75);
    return (charIndex) => {
      i = Math.max(0, charIndex);
      tick();
    };
  }

  function stop() {
    clearVisemeTicker();
    if (typeof speechSynthesis !== 'undefined') {
      speechSynthesis.cancel();
    }
    utterance = null;
    state.speaking = false;
    state.viseme = 'closed';
    emit();
  }

  function speak(text) {
    const spoken = String(text || '').replace(/\s+/g, ' ').trim();
    stop();
    if (!spoken) return Promise.resolve();

    return new Promise((resolve) => {
      if (typeof speechSynthesis === 'undefined' || typeof SpeechSynthesisUtterance === 'undefined') {
        setSpeaking(true);
        const jump = driveVisemes(spoken);
        window.setTimeout(() => {
          jump(spoken.length);
          setSpeaking(false);
          resolve();
        }, Math.min(8000, 420 + spoken.length * 55));
        return;
      }

      const utter = new SpeechSynthesisUtterance(spoken);
      utterance = utter;
      utter.rate = 0.96;
      utter.pitch = 1.02;
      utter.lang = 'en-US';
      const voice = pickVoice();
      if (voice) utter.voice = voice;

      const sync = driveVisemes(spoken);
      setSpeaking(true);

      utter.onboundary = (event) => {
        if (typeof event.charIndex === 'number') sync(event.charIndex);
      };

      let safety = 0;
      const finish = () => {
        if (utterance !== utter) return;
        window.clearTimeout(safety);
        utter.onboundary = null;
        utter.onend = null;
        utter.onerror = null;
        clearVisemeTicker();
        utterance = null;
        setSpeaking(false);
        resolve();
      };

      utter.onend = finish;
      utter.onerror = finish;
      speechSynthesis.speak(utter);

      // Some browsers never fire onend (no voices installed, muted tab, headless).
      // After the estimated duration, release the speaking state; if the engine
      // still reports activity, give it a little longer, up to a hard cap.
      const startedAt = Date.now();
      const estimate = Math.min(30000, 1500 + spoken.length * 90);
      const check = () => {
        if (utterance !== utter) return;
        const stillBusy = speechSynthesis.speaking || speechSynthesis.pending;
        if (stillBusy && Date.now() - startedAt < estimate + 15000) {
          safety = window.setTimeout(check, 1500);
          return;
        }
        finish();
      };
      safety = window.setTimeout(check, estimate);
    });
  }

  if (typeof speechSynthesis !== 'undefined') {
    speechSynthesis.addEventListener('voiceschanged', pickVoice);
  }

  /** Start (or restart) idle blinking and gaze wander. Safe to call repeatedly. */
  function start() {
    destroyed = false;
    scheduleBlink();
    scheduleWander();
  }

  /** Stop speech and idle timers. A later start() brings the avatar back to life. */
  function destroy() {
    destroyed = true;
    stop();
    window.clearTimeout(blinkTimer);
    window.clearTimeout(wanderTimer);
    window.clearTimeout(blinkHold);
  }

  start();

  return {
    start,
    setEmotion,
    setViseme,
    setListening,
    setSpeaking,
    speak,
    stop,
    blink,
    lookAt,
    releaseLook,
    subscribe(fn) {
      listeners.add(fn);
      fn(getState());
      return () => listeners.delete(fn);
    },
    getState,
    destroy,
    visemes: VISEMES,
    emotions: EMOTIONS,
  };
}

export { visemeFromChunk, VISEMES, EMOTIONS };
