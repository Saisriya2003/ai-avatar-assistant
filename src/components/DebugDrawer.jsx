export default function DebugDrawer({ open, onToggle, state, health, controller }) {
  return (
    <section className={`debug${open ? ' is-open' : ''}`}>
      <button type="button" className="debug-toggle" onClick={onToggle} aria-expanded={open}>
        <span>Avatar API</span>
        <em>{open ? 'Hide' : 'Inspect'}</em>
      </button>
      {open ? (
        <div className="debug-body">
          <p className="debug-lead">
            Live <code>AvatarEngine</code> state. The same methods drive the SVG now and can sit in
            front of Ready Player Me or D-ID later.
          </p>
          <dl>
            <div>
              <dt>emotion</dt>
              <dd>{state.emotion}</dd>
            </div>
            <div>
              <dt>viseme</dt>
              <dd>{state.viseme}</dd>
            </div>
            <div>
              <dt>listening</dt>
              <dd>{String(state.listening)}</dd>
            </div>
            <div>
              <dt>speaking</dt>
              <dd>{String(state.speaking)}</dd>
            </div>
            <div>
              <dt>lookAt</dt>
              <dd>
                {state.lookAt.x.toFixed(2)}, {state.lookAt.y.toFixed(2)}
              </dd>
            </div>
            <div>
              <dt>engine</dt>
              <dd>{health.server ? (health.llm ? 'openai' : 'server-local') : 'client-fallback'}</dd>
            </div>
          </dl>
          <div className="debug-actions">
            {controller.emotions.map((emotion) => (
              <button key={emotion} type="button" onClick={() => controller.setEmotion(emotion)}>
                {emotion}
              </button>
            ))}
          </div>
          <div className="debug-actions">
            {controller.visemes.map((viseme) => (
              <button key={viseme} type="button" onClick={() => controller.setViseme(viseme)}>
                {viseme}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
