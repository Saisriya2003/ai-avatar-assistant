export default function Composer({
  value,
  onChange,
  onSend,
  onMic,
  micOn,
  micSupported,
  pending,
}) {
  function submit(event) {
    event.preventDefault();
    onSend(value);
  }

  function onKey(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      onSend(value);
    }
  }

  return (
    <form className="composer" onSubmit={submit}>
      <label className="sr-only" htmlFor="aria-input">
        Message Aria
      </label>
      <textarea
        id="aria-input"
        rows={2}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKey}
        placeholder={micOn ? 'Listening…' : 'Ask Aria, or use the mic'}
        disabled={pending}
      />
      <div className="composer-actions">
        <button
          type="button"
          className={`btn ghost mic${micOn ? ' is-live' : ''}`}
          onClick={onMic}
          disabled={pending || !micSupported}
          aria-pressed={micOn}
          aria-label={micOn ? 'Stop listening' : 'Speak to Aria'}
          title={micSupported ? 'Speak to Aria' : 'Voice is not available in this browser'}
        >
          <MicIcon live={micOn} />
          {micOn ? 'Listening' : 'Mic'}
        </button>
        <button type="submit" className="btn primary" disabled={pending || !value.trim()}>
          Send
        </button>
      </div>
    </form>
  );
}

function MicIcon({ live }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
      <rect x="6" y="1.5" width="4" height="8" rx="2" fill={live ? '#0c0a08' : 'currentColor'} />
      <path
        d="M3.5 7.5a4.5 4.5 0 0 0 9 0"
        fill="none"
        stroke={live ? '#0c0a08' : 'currentColor'}
        strokeWidth="1.4"
      />
      <path d="M8 12v2.5" stroke={live ? '#0c0a08' : 'currentColor'} strokeWidth="1.4" />
    </svg>
  );
}
