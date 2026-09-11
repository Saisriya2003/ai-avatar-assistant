const PRODUCT = {
  name: 'Lumen Cloud',
  plans: [
    { id: 'spark', name: 'Spark', price: 'Free', note: 'personal canvases, 3 guests' },
    { id: 'halo', name: 'Halo', price: '$18 / user / month', note: 'shared vaults, Slack + GitHub' },
    { id: 'nova', name: 'Nova', price: '$42 / user / month', note: 'SSO, 24/7 support, audit log' },
  ],
};

const CALENDAR = [
  { time: '9:30', title: 'Standup with Lumen Cloud success' },
  { time: '11:00', title: 'Review avatar integration notes' },
  { time: '14:00', title: 'Design critique' },
  { time: '16:30', title: 'Wrap and ship the portfolio cut' },
];

const SUPPORT_INTENTS = [
  {
    id: 'greeting',
    emotion: 'smile',
    keys: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'who are you'],
    reply:
      'I am Aria, the Lumen Cloud support avatar. I can walk you through plans, tickets, billing, and refunds. What do you need?',
  },
  {
    id: 'product',
    emotion: 'smile',
    keys: ['what is', 'lumen', 'product', 'about', 'workspace', 'canvas'],
    reply:
      'Lumen Cloud is a live workspace for teams that think in canvases. You sketch together, keep decisions in a vault, and let Aria-style notes land after every meeting. Spark is free. Halo and Nova add shared vaults, integrations, and stronger support.',
  },
  {
    id: 'pricing',
    emotion: 'neutral',
    keys: ['price', 'pricing', 'cost', 'plan', 'plans', 'how much', 'spark', 'halo', 'nova', 'billing'],
    reply:
      'Three plans. Spark is free for personal canvases with three guests. Halo is $18 per user each month for shared vaults, Slack, and GitHub. Nova is $42 per user each month and adds SSO, an audit log, and 24/7 support. Annual billing takes 15% off Halo and Nova.',
  },
  {
    id: 'ticket',
    emotion: 'listen',
    keys: ['ticket', 'support', 'issue', 'bug', 'incident', 'help desk', 'open a'],
    reply:
      'To open a ticket: Help in the Lumen sidebar, then New ticket. Choose outage, access, or billing so it routes cleanly. I can file a draft here as LC-48219 if you describe the problem in one sentence.',
  },
  {
    id: 'refund',
    emotion: 'concern',
    keys: ['refund', 'cancel', 'money back', 'charge', 'charged'],
    reply:
      'Annual plans have a 14-day full refund if the workspace stayed under five active canvases. After that, unused months on Halo or Nova are prorated as credit. Monthly plans can be cancelled before the next invoice. I can start a refund review as LC-R-1106 — tell me the workspace name.',
  },
  {
    id: 'status',
    emotion: 'neutral',
    keys: ['status', 'uptime', 'down', 'outage', 'operational'],
    reply:
      'Lumen Cloud is operational. Trailing thirty-day uptime is 99.97%. The last incident was a 12-minute ingest delay on 2 September, already closed. Status lives at status.lumen.example if you want the public board.',
  },
  {
    id: 'integrations',
    emotion: 'smile',
    keys: ['slack', 'github', 'figma', 'calendar', 'integration', 'sso', 'okta'],
    reply:
      'Halo and Nova connect Slack, GitHub, Figma, and Google Calendar. Nova also does Okta or Entra SSO. From Settings, open Connections, then authorize the app. Canvas comments can land in a Slack channel without extra bots.',
  },
  {
    id: 'howto',
    emotion: 'neutral',
    keys: ['how do', 'how to', 'invite', 'share', 'permission', 'vault'],
    reply:
      'Invite from the people glyph on any canvas. Guests on Spark can comment. Halo members can edit vault pages. Nova lets you lock a vault to a role. Share links expire in seven days unless you pin them in workspace settings.',
  },
  {
    id: 'thanks',
    emotion: 'smile',
    keys: ['thanks', 'thank you', 'perfect', 'great', 'awesome'],
    reply: 'Glad that helped. I will stay on this thread if you want to file a ticket or compare plans.',
  },
  {
    id: 'bye',
    emotion: 'smile',
    keys: ['bye', 'goodbye', 'that is all', "that's all", 'done'],
    reply: 'I will close this conversation on my side. Open it again anytime — Aria will pick up from the last ticket you mentioned.',
  },
];

const ASSISTANT_INTENTS = [
  {
    id: 'greeting',
    emotion: 'smile',
    keys: ['hello', 'hi', 'hey', 'who are you', 'what can you'],
    reply:
      'I am Aria, your virtual assistant. I can walk the day, hold reminders, and help you draft the next thing. What should we do first?',
  },
  {
    id: 'calendar',
    emotion: 'neutral',
    keys: ['calendar', 'schedule', 'today', 'agenda', 'meetings', 'what is on'],
    reply: `Friday 11 September 2026. ${CALENDAR.map((e) => `${e.time} ${e.title}`).join('. ')}. I can move the critique or hold the afternoon if you want air.`,
  },
  {
    id: 'remind',
    emotion: 'smile',
    keys: ['remind', 'reminder', 'remember to', 'ping me', 'do not let me forget'],
    reply:
      'I will hold that reminder for this session and surface it when you ask what is open. If you want a time, say it plainly — for example, four o’clock. I will treat it as pinned until you dismiss it.',
  },
  {
    id: 'open',
    emotion: 'listen',
    keys: ['what are my reminders', 'what did i ask', 'open reminders', 'pinned'],
    reply:
      'I keep reminders in this conversation. Scan the last notes you asked me to hold, or tell me a new one and I will pin it on top.',
  },
  {
    id: 'plan',
    emotion: 'think',
    keys: ['plan', 'tomorrow', 'morning', 'focus', 'priorit'],
    reply:
      'A clean morning: protect 8:30 to 10:30 for deep work, keep standup standing, and leave a 20-minute gap before the critique so the avatar notes can land. I can draft a status line for 16:30 when you are ready.',
  },
  {
    id: 'draft',
    emotion: 'smile',
    keys: ['draft', 'status', 'write', 'email', 'update'],
    reply:
      'Draft status: “Avatar engine is live with visemes, emotion, and a local reply path. Support and assistant modes share the same Aria surface. Next is an optional OpenAI bind behind the existing /api/chat contract.” I can shorten that.',
  },
  {
    id: 'time',
    emotion: 'neutral',
    keys: ['time', 'date', 'day', 'what day'],
    reply:
      'This demo treats today as Friday, 11 September 2026 — the date the portfolio session was cut. Your machine clock may differ; I will stay consistent with the seeded calendar.',
  },
  {
    id: 'help',
    emotion: 'listen',
    keys: ['help', 'what can', 'capabilities', 'assist'],
    reply:
      'I can read the seeded calendar, pin reminders, draft short updates, and talk through a next step. Switch to Support if you need Lumen Cloud plans or tickets instead.',
  },
  {
    id: 'thanks',
    emotion: 'smile',
    keys: ['thanks', 'thank you', 'perfect'],
    reply: 'Of course. I am here when the next block starts.',
  },
  {
    id: 'bye',
    emotion: 'smile',
    keys: ['bye', 'goodbye', 'that is all', "that's all"],
    reply: 'I will keep the reminders from this session. Come back when you want the afternoon reshaped.',
  },
];

function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[^a-z0-9'\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function scoreIntent(text, intent) {
  let score = 0;
  for (const key of intent.keys) {
    if (text.includes(key)) score += key.includes(' ') ? 3 : 2;
  }
  return score;
}

function lastUserText(messages) {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i]?.role === 'user') return messages[i].text;
  }
  return '';
}

function fallback(mode, text) {
  if (mode === 'support') {
    return {
      emotion: 'think',
      reply: `I can take that as a Lumen Cloud question. For "${text.slice(0, 80)}" I would usually check plans, tickets, or refunds. Tell me which of those you want, or describe the workspace symptom in one line.`,
    };
  }
  return {
    emotion: 'think',
    reply: `I heard you. I can put that against the Friday calendar, pin a reminder, or draft a status line. Which of those should I do with “${text.slice(0, 72)}”?`,
  };
}

export function localReply({ messages = [], mode = 'support' } = {}) {
  const text = normalize(lastUserText(messages));
  if (!text) {
    return {
      emotion: 'listen',
      reply:
        mode === 'support'
          ? 'I am listening. Ask about Lumen Cloud plans, tickets, or refunds.'
          : 'I am listening. Ask about the calendar, a reminder, or a draft.',
    };
  }

  const intents = mode === 'assistant' ? ASSISTANT_INTENTS : SUPPORT_INTENTS;
  let best = null;
  let bestScore = 0;
  for (const intent of intents) {
    const score = scoreIntent(text, intent);
    if (score > bestScore) {
      best = intent;
      bestScore = score;
    }
  }

  if (best && bestScore >= 2) {
    if (best.id === 'remind') {
      const cleaned = lastUserText(messages).replace(/^(please\s+)?remind me( to)?/i, '').trim();
      return {
        emotion: best.emotion,
        reply: cleaned
          ? `Pinned. I will hold “${cleaned}” in this session. Ask me what is open and I will read it back.`
          : best.reply,
      };
    }
    return { emotion: best.emotion, reply: best.reply };
  }

  return fallback(mode, lastUserText(messages));
}

export { PRODUCT, CALENDAR };
