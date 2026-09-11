import { useEffect, useRef, useState } from 'react';

const EMOTION = {
  neutral: { browL: 0, browR: 0, mouthCurve: 3, eye: 1, lidBias: 0 },
  smile: { browL: 3, browR: 3, mouthCurve: 10, eye: 0.92, lidBias: 2 },
  listen: { browL: 5, browR: 5, mouthCurve: 2, eye: 1.08, lidBias: -1 },
  think: { browL: 7, browR: -3, mouthCurve: 0, eye: 0.96, lidBias: 1 },
  concern: { browL: -5, browR: -5, mouthCurve: -6, eye: 1.04, lidBias: 0 },
};

const VISEME = {
  closed: { h: 2.2, w: 28 },
  small: { h: 7, w: 26 },
  mid: { h: 13, w: 30 },
  open: { h: 21, w: 32 },
  wide: { h: 15, w: 40 },
};

export default function Avatar({ controller, state }) {
  const [motion, setMotion] = useState({ sway: 0, bob: 0, breath: 1 });
  const stageRef = useRef(null);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced.current) return undefined;

    let frame = 0;
    const tick = (now) => {
      const t = now / 1000;
      setMotion({
        sway: Math.sin(t * 0.55) * 1.85,
        bob: Math.sin(t * 0.82) * 2.1,
        breath: 1 + Math.sin(t * 1.15) * 0.012,
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  function onMove(event) {
    const node = stageRef.current;
    if (!node) return;
    const box = node.getBoundingClientRect();
    const x = ((event.clientX - box.left) / box.width) * 2 - 1;
    const y = ((event.clientY - box.top) / box.height) * 2 - 1;
    controller.lookAt(x, y, 'pointer');
  }

  const emotion = EMOTION[state.emotion] || EMOTION.neutral;
  const viseme = VISEME[state.viseme] || VISEME.closed;
  const lx = state.lookAt.x * 3.4;
  const ly = (state.emotion === 'think' ? -3.2 : 0) + state.lookAt.y * 2.8;
  const lidClose = state.blink ? 1 : 0.08 + emotion.lidBias * 0.02;
  const head = `translate(0 ${motion.bob}) rotate(${motion.sway} 180 210)`;
  const body = `translate(180 392) scale(${motion.breath}) translate(-180 -392)`;

  return (
    <div
      className={`avatar-stage${state.listening ? ' is-listening' : ''}${state.speaking ? ' is-speaking' : ''}`}
      ref={stageRef}
      onPointerMove={onMove}
      onPointerLeave={() => controller.releaseLook()}
    >
      <div className="avatar-glow" aria-hidden="true" />
      <div className="avatar-orb avatar-orb-a" aria-hidden="true" />
      <div className="avatar-orb avatar-orb-b" aria-hidden="true" />

      <svg className="avatar-svg" viewBox="0 0 360 480" role="img" aria-label="The AI avatar">
        <defs>
          <radialGradient id="skin" cx="42%" cy="32%" r="70%">
            <stop offset="0%" stopColor="#f0c7b0" />
            <stop offset="42%" stopColor="#d4a183" />
            <stop offset="100%" stopColor="#a56b4e" />
          </radialGradient>
          <radialGradient id="skinShadow" cx="50%" cy="80%" r="70%">
            <stop offset="0%" stopColor="#8f5e45" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#8f5e45" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="hair" x1="20%" y1="0%" x2="90%" y2="100%">
            <stop offset="0%" stopColor="#3d2a1c" />
            <stop offset="45%" stopColor="#1a120c" />
            <stop offset="100%" stopColor="#2c1b14" />
          </linearGradient>
          <linearGradient id="hairShine" x1="30%" y1="0%" x2="70%" y2="80%">
            <stop offset="0%" stopColor="#c9844a" stopOpacity="0.55" />
            <stop offset="38%" stopColor="#c9844a" stopOpacity="0" />
            <stop offset="100%" stopColor="#e8a87c" stopOpacity="0.15" />
          </linearGradient>
          <linearGradient id="garment" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2a241c" />
            <stop offset="100%" stopColor="#14110d" />
          </linearGradient>
          <radialGradient id="iris" cx="38%" cy="34%" r="70%">
            <stop offset="0%" stopColor="#e8a87c" />
            <stop offset="45%" stopColor="#8b5a3c" />
            <stop offset="100%" stopColor="#2a1b14" />
          </radialGradient>
          <radialGradient id="room" cx="40%" cy="30%" r="75%">
            <stop offset="0%" stopColor="#1c1812" />
            <stop offset="100%" stopColor="#0c0a08" />
          </radialGradient>
          <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.1" result="b" />
            <feBlend in="SourceGraphic" in2="b" mode="normal" />
          </filter>
          <filter id="blush" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
          <filter id="grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="4" />
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncA type="table" tableValues="0 0.22" />
            </feComponentTransfer>
          </filter>
          <clipPath id="faceClip">
            <ellipse cx="180" cy="196" rx="78" ry="92" />
          </clipPath>
        </defs>

        <rect width="360" height="480" fill="url(#room)" />
        <ellipse cx="180" cy="210" rx="150" ry="170" fill="#e8a87c" opacity="0.05" />
        <ellipse cx="180" cy="430" rx="130" ry="28" fill="#000" opacity="0.35" />

        <g className="avatar-body" transform={body}>
          <path
            d="M48 478 C70 368 118 332 180 330 C242 332 290 368 312 478 Z"
            fill="url(#garment)"
          />
          <path
            d="M118 348 C148 338 212 338 242 348"
            fill="none"
            stroke="#e8a87c"
            strokeWidth="1.2"
            opacity="0.55"
          />
          <path d="M168 356 H192" stroke="#c9844a" strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />
        </g>

        <g className="avatar-head" transform={head}>
          <path
            d="M86 168 C78 108 118 58 180 54 C248 50 286 108 274 176 C292 210 268 268 180 278 C92 268 70 214 86 168 Z"
            fill="url(#hair)"
          />
          <path
            d="M104 120 C140 72 230 68 262 128 C240 88 170 78 104 120 Z"
            fill="url(#hairShine)"
          />

          <path d="M102 200 C96 230 108 268 128 286 C118 250 112 220 102 200 Z" fill="#1a120c" />
          <path d="M258 198 C266 230 252 268 232 286 C244 248 250 220 258 198 Z" fill="#1a120c" />

          <ellipse cx="180" cy="196" rx="78" ry="92" fill="url(#skin)" />
          <ellipse cx="180" cy="220" rx="70" ry="78" fill="url(#skinShadow)" />
          <ellipse cx="148" cy="214" rx="18" ry="10" fill="#e7b8a8" opacity="0.45" filter="url(#blush)" />
          <ellipse cx="212" cy="214" rx="18" ry="10" fill="#e7b8a8" opacity="0.45" filter="url(#blush)" />

          <path d="M180 278 C166 302 152 324 148 348 C168 340 192 340 212 348 C208 324 194 302 180 278 Z" fill="url(#skin)" />
          <path d="M168 300 C176 312 184 312 192 300" fill="none" stroke="#8f5e45" strokeWidth="2" opacity="0.25" />

          <g transform={`translate(0 ${emotion.browL * 0.15})`}>
            <path
              d={`M132 ${168 - emotion.browL} Q152 ${160 - emotion.browL} 168 ${168 - emotion.browL * 0.4}`}
              fill="none"
              stroke="#2a1b14"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
            <path
              d={`M192 ${168 - emotion.browR * 0.4} Q208 ${160 - emotion.browR} 228 ${168 - emotion.browR}`}
              fill="none"
              stroke="#2a1b14"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
          </g>

          <Eye cx={152} cy={192} lx={lx} ly={ly} scale={emotion.eye} lid={lidClose} />
          <Eye cx={208} cy={192} lx={lx} ly={ly} scale={emotion.eye} lid={lidClose} />

          <path d="M180 204 C176 218 178 226 180 230 C182 226 184 218 180 204 Z" fill="#c99578" />
          <path d="M180 230 C176 236 176 240 180 241" fill="none" stroke="#8f5e45" strokeWidth="1.1" opacity="0.55" />

          <Mouth viseme={viseme} curve={emotion.mouthCurve} speaking={state.speaking} />

          <path
            d="M96 150 C70 210 92 280 138 300 C110 240 100 190 96 150 Z"
            fill="url(#hair)"
          />
          <path
            d="M118 78 C150 96 128 150 146 188 C120 150 108 110 118 78 Z"
            fill="#1a120c"
          />
          <path
            d="M236 70 C210 110 248 160 250 210 C268 150 272 100 236 70 Z"
            fill="#1a120c"
            opacity="0.95"
          />

          <circle cx="258" cy="214" r="3.2" fill="#e8a87c" className={state.speaking ? 'earring pulse' : 'earring'} />
          <circle cx="258" cy="222" r="1.3" fill="#c9844a" />
        </g>

        <rect width="360" height="480" filter="url(#grain)" opacity="0.18" style={{ mixBlendMode: 'overlay' }} />

        <g className="listen-ring" opacity={state.listening ? 1 : 0}>
          <ellipse cx="180" cy="220" rx="118" ry="138" fill="none" stroke="#e8a87c" strokeWidth="1.2" />
          <ellipse cx="180" cy="220" rx="132" ry="154" fill="none" stroke="#7eb8a2" strokeWidth="0.6" opacity="0.7" />
        </g>
      </svg>

      <div className="avatar-nameplate">
        <p className="avatar-kicker">Avatar engine</p>
        <h1>AI Avatar Integration System</h1>
        <p className="avatar-tag">An AI avatar for support and assisted conversations.</p>
      </div>
    </div>
  );
}

function Eye({ cx, cy, lx, ly, scale, lid }) {
  const irisR = 7.2 * scale;
  const cover = 22 * Math.max(0.06, Math.min(1, lid));
  return (
    <g transform={`translate(${cx} ${cy})`}>
      <ellipse cx="0" cy="0" rx="16" ry="10.5" fill="#f4ece1" />
      <circle cx={lx} cy={ly} r={irisR} fill="url(#iris)" />
      <circle cx={lx} cy={ly} r={irisR * 0.42} fill="#0c0a08" />
      <circle cx={lx - 2.1} cy={ly - 2.4} r="1.7" fill="#f4ece1" opacity="0.9" />
      <rect x="-17" y="-12" width="34" height={cover} fill="#d4a183" />
      <rect x="-17" y={10.5 - cover * 0.22} width="34" height={cover * 0.28} fill="#c99578" />
      <path d="M-15 -1 Q0 -11 15 -1" fill="none" stroke="#2a1b14" strokeWidth="2.4" strokeLinecap="round" />
    </g>
  );
}

function Mouth({ viseme, curve, speaking }) {
  const w = viseme.w;
  const h = viseme.h;
  const y = 248;
  const open = h > 4;
  const lip = speaking ? '#c9844a' : '#b07060';

  if (!open) {
    const rise = curve;
    return (
      <path
        d={`M${180 - w / 2} ${y} Q 180 ${y + rise} ${180 + w / 2} ${y}`}
        fill="none"
        stroke={lip}
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    );
  }

  const top = y - Math.max(1, curve * 0.15);
  return (
    <g>
      <ellipse cx="180" cy={top + h * 0.35} rx={w / 2} ry={h / 2} fill="#3a1f1c" />
      <ellipse cx="180" cy={top + h * 0.55} rx={w / 3.4} ry={h / 4.2} fill="#e07a6a" opacity="0.55" />
      <path
        d={`M${180 - w / 2} ${top} Q 180 ${top - 2 + curve * 0.1} ${180 + w / 2} ${top}`}
        fill="none"
        stroke={lip}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </g>
  );
}
