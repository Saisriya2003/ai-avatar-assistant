export function speechSupported() {
  if (typeof window === 'undefined') {
    return { listen: false, speak: false };
  }
  const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
  return {
    listen: Boolean(Rec),
    speak: 'speechSynthesis' in window,
  };
}

export function createRecognizer({ onInterim, onFinal, onError, onStart, onEnd }) {
  const Rec = typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

  if (!Rec) {
    return {
      supported: false,
      start() {
        onError?.('Voice input is not available in this browser. Type instead — Chrome on Windows works best.');
      },
      stop() {},
    };
  }

  let rec = null;
  let active = false;

  function attach(instance) {
    instance.lang = 'en-US';
    instance.interimResults = true;
    instance.continuous = false;
    instance.maxAlternatives = 1;

    instance.onstart = () => {
      active = true;
      onStart?.();
    };

    instance.onresult = (event) => {
      let interim = '';
      let finalText = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const piece = event.results[i][0]?.transcript || '';
        if (event.results[i].isFinal) finalText += piece;
        else interim += piece;
      }
      if (interim) onInterim?.(interim.trim());
      if (finalText) onFinal?.(finalText.trim());
    };

    instance.onerror = (event) => {
      const code = event.error;
      if (code === 'aborted' || code === 'no-speech') {
        onEnd?.();
        return;
      }
      if (code === 'not-allowed') {
        onError?.('Microphone permission was denied. Allow the mic, or keep typing.');
      } else {
        onError?.('I could not hear that clearly. Try again, or type the question.');
      }
    };

    instance.onend = () => {
      active = false;
      onEnd?.();
    };
  }

  return {
    supported: true,
    start() {
      if (active) return;
      rec = new Rec();
      attach(rec);
      try {
        rec.start();
      } catch {
        onError?.('The microphone is busy. Stop the current listen and try again.');
      }
    },
    stop() {
      try {
        rec?.stop();
      } catch {
        /* already stopped */
      }
      active = false;
    },
  };
}
