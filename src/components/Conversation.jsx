import Composer from './Composer.jsx';
import DebugDrawer from './DebugDrawer.jsx';
import MessageList from './MessageList.jsx';
import ModeSwitcher from './ModeSwitcher.jsx';
import PromptChips from './PromptChips.jsx';
import { MODES } from '../data/content.js';

export default function Conversation({
  mode,
  onMode,
  messages,
  pending,
  error,
  input,
  onInput,
  onSend,
  onMic,
  micOn,
  micSupported,
  debugOpen,
  onDebug,
  avatarState,
  health,
  controller,
}) {
  const meta = MODES[mode];

  return (
    <section className="conversation">
      <header className="convo-head">
        <div>
          <p className="kicker">{meta.kicker}</p>
          <h2>{meta.title}</h2>
          <p className="lede">{meta.blurb}</p>
        </div>
        <ModeSwitcher mode={mode} onChange={onMode} disabled={pending} />
      </header>

      <MessageList messages={messages} pending={pending} error={error} />
      <PromptChips prompts={meta.prompts} onPick={onSend} disabled={pending} />
      <Composer
        value={input}
        onChange={onInput}
        onSend={onSend}
        onMic={onMic}
        micOn={micOn}
        micSupported={micSupported}
        pending={pending}
      />
      <DebugDrawer
        open={debugOpen}
        onToggle={onDebug}
        state={avatarState}
        health={health}
        controller={controller}
      />
    </section>
  );
}
