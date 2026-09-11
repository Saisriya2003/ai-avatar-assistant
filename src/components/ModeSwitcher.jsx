export default function ModeSwitcher({ mode, onChange, disabled }) {
  return (
    <div className="mode-switch" role="tablist" aria-label="Conversation mode">
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'support'}
        className={mode === 'support' ? 'is-on' : ''}
        disabled={disabled}
        onClick={() => onChange('support')}
      >
        Support
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'assistant'}
        className={mode === 'assistant' ? 'is-on' : ''}
        disabled={disabled}
        onClick={() => onChange('assistant')}
      >
        Assistant
      </button>
    </div>
  );
}
