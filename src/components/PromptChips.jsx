export default function PromptChips({ prompts, onPick, disabled }) {
  return (
    <div className="chips" aria-label="Suggested prompts">
      {prompts.map((prompt) => (
        <button key={prompt} type="button" disabled={disabled} onClick={() => onPick(prompt)}>
          {prompt}
        </button>
      ))}
    </div>
  );
}
