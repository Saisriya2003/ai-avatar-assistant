import { useEffect, useMemo, useRef, useState } from 'react';
import Avatar from './avatar/Avatar.jsx';
import { createAvatarController } from './avatar/engine.js';
import Conversation from './components/Conversation.jsx';
import { seedMessages, newId } from './data/content.js';
import { fetchHealth, sendChat } from './lib/api.js';
import { createRecognizer, speechSupported } from './lib/speech.js';

export default function App() {
  const controllerRef = useRef(null);
  if (!controllerRef.current) controllerRef.current = createAvatarController();
  const controller = controllerRef.current;
  const [avatarState, setAvatarState] = useState(() => controller.getState());
  const [mode, setMode] = useState('support');
  const [messages, setMessages] = useState(() => seedMessages('support'));
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [micOn, setMicOn] = useState(false);
  const [debugOpen, setDebugOpen] = useState(false);
  const [health, setHealth] = useState({ server: false, llm: false, engine: 'client-fallback' });
  const support = useMemo(() => speechSupported(), []);
  const recRef = useRef(null);
  const sending = useRef(false);
  const messagesRef = useRef(messages);
  const sendRef = useRef(null);
  messagesRef.current = messages;

  useEffect(() => controller.subscribe(setAvatarState), [controller]);

  useEffect(
    () => () => {
      controller.destroy();
      controllerRef.current = null;
    },
    [controller],
  );

  useEffect(() => {
    fetchHealth().then(setHealth);
    const id = window.setInterval(() => fetchHealth().then(setHealth), 20000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    recRef.current = createRecognizer({
      onStart() {
        setMicOn(true);
        controller.setListening(true);
        controller.setEmotion('listen');
      },
      onInterim(text) {
        setInput(text);
      },
      onFinal(text) {
        setMicOn(false);
        controller.setListening(false);
        recRef.current?.stop();
        if (text) sendRef.current?.(text);
      },
      onError(message) {
        setMicOn(false);
        controller.setListening(false);
        setError(message);
      },
      onEnd() {
        setMicOn(false);
        controller.setListening(false);
      },
    });
    return () => recRef.current?.stop();
  }, [controller]);

  async function send(raw) {
    const text = String(raw || '').trim();
    if (!text || sending.current) return;

    sending.current = true;
    setError('');
    setInput('');
    recRef.current?.stop();
    controller.stop();
    controller.setListening(false);
    controller.setEmotion('think');
    setPending(true);

    const userMsg = { id: newId(), role: 'user', text, at: Date.now() };
    const next = [...messagesRef.current, userMsg];
    messagesRef.current = next;
    setMessages(next);

    const result = await sendChat({
      messages: next.map(({ role, text: body }) => ({ role, text: body })),
      mode,
    });

    const ariaMsg = {
      id: newId(),
      role: 'aria',
      text: result.reply,
      emotion: result.emotion,
      at: Date.now(),
    };
    setMessages((prev) => {
      const all = [...prev, ariaMsg];
      messagesRef.current = all;
      return all;
    });
    setPending(false);
    sending.current = false;
    controller.setEmotion(result.emotion || 'neutral');
    await controller.speak(result.reply);
  }

  sendRef.current = send;

  function changeMode(next) {
    if (next === mode) return;
    controller.stop();
    recRef.current?.stop();
    const seeded = seedMessages(next);
    setMode(next);
    messagesRef.current = seeded;
    setMessages(seeded);
    setInput('');
    setError('');
    controller.setEmotion('smile');
  }

  function toggleMic() {
    if (!support.listen) {
      setError('Voice input is not available in this browser. Type instead — Chrome on Windows works best.');
      return;
    }
    if (micOn) {
      recRef.current?.stop();
      controller.setListening(false);
      setMicOn(false);
      return;
    }
    setError('');
    recRef.current?.start();
  }

  const status = pending
    ? 'Thinking'
    : avatarState.speaking
      ? 'Speaking'
      : avatarState.listening
        ? 'Listening'
        : 'Ready';

  return (
    <div className="app">
      <div className="grain" aria-hidden="true" />
      <main className="shell">
        <div className="stage-col">
          <Avatar controller={controller} state={avatarState} />
          <div className={`status-pill${avatarState.listening ? ' live' : ''}${avatarState.speaking ? ' talk' : ''}`}>
            <i />
            {status}
            <span className="status-src">
              {health.server ? (health.llm ? 'OpenAI' : 'Local server') : 'On-device fallback'}
            </span>
          </div>
        </div>
        <Conversation
          mode={mode}
          onMode={changeMode}
          messages={messages}
          pending={pending}
          error={error}
          input={input}
          onInput={setInput}
          onSend={send}
          onMic={toggleMic}
          micOn={micOn}
          micSupported={support.listen}
          debugOpen={debugOpen}
          onDebug={() => setDebugOpen((v) => !v)}
          avatarState={avatarState}
          health={health}
          controller={controller}
        />
      </main>
    </div>
  );
}
