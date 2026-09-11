import { useEffect, useRef } from 'react';

export default function MessageList({ messages, pending, error }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, pending, error]);

  if (!messages.length && !pending) {
    return (
      <div className="msg-empty">
        <p>No messages yet. The avatar is ready when you are.</p>
      </div>
    );
  }

  return (
    <div className="msg-list" aria-live="polite">
      {messages.map((msg) => (
        <article key={msg.id} className={`msg msg-${msg.role}`}>
          <header>
            <span>{msg.role === 'aria' ? 'Avatar' : 'You'}</span>
            <time>{formatTime(msg.at)}</time>
          </header>
          <p>{msg.text}</p>
        </article>
      ))}

      {pending ? (
        <article className="msg msg-aria is-pending">
          <header>
            <span>Avatar</span>
            <time>thinking</time>
          </header>
          <p className="dots" aria-label="The avatar is thinking">
            <span />
            <span />
            <span />
          </p>
        </article>
      ) : null}

      {error ? (
        <article className="msg msg-error">
          <header>
            <span>Connection</span>
          </header>
          <p>{error}</p>
        </article>
      ) : null}

      <div ref={endRef} />
    </div>
  );
}

function formatTime(at) {
  if (!at) return '';
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(at));
  } catch {
    return '';
  }
}
