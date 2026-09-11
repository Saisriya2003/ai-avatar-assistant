const SUPPORT_FACTS = `
You are Aria, a calm editorial AI avatar for Lumen Cloud customer support.
Lumen Cloud is a live collaborative workspace (canvases + decision vaults).
Plans: Spark free (personal, 3 guests); Halo $18/user/mo (shared vaults, Slack, GitHub);
Nova $42/user/mo (SSO, 24/7 support, audit log). Annual Halo/Nova is 15% off.
Tickets: Help → New ticket. Sample ids LC-48219.
Refunds: 14-day full refund on annual if under 5 active canvases; then prorated credit.
Status: operational, 99.97% thirty-day uptime.
Voice: short paragraphs, no exclamation spam, no emoji.
Always return useful next steps. If the user is upset, be precise and kind.
`;

const ASSISTANT_FACTS = `
You are Aria, a virtual assistant avatar.
Today in this demo is Friday 11 September 2026.
Seeded calendar: 9:30 Standup with Lumen Cloud success; 11:00 Review avatar integration notes;
14:00 Design critique; 16:30 Wrap and ship the portfolio cut.
You can pin reminders for the session, draft short status updates, and reshape the day.
Voice: short paragraphs, no exclamation spam, no emoji.
`;

const SUPPORT_INTENTS = [
  {
    keys: ['hello', 'hi', 'hey', 'good morning', 'who are you'],
    emotion: 'smile',
    reply:
      'I am Aria, the Lumen Cloud support avatar. I can walk you through plans, tickets, billing, and refunds. What do you need?',
  },
  {
    keys: ['what is', 'lumen', 'product', 'about', 'workspace', 'canvas'],
    emotion: 'smile',
    reply:
      'Lumen Cloud is a live workspace for teams that think in canvases. You sketch together, keep decisions in a vault, and let notes land after every meeting. Spark is free. Halo and Nova add shared vaults, integrations, and stronger support.',
  },
  {
    keys: ['price', 'pricing', 'cost', 'plan', 'plans', 'how much', 'spark', 'halo', 'nova', 'billing'],
    emotion: 'neutral',
    reply:
      'Three plans. Spark is free for personal canvases with three guests. Halo is $18 per user each month for shared vaults, Slack, and GitHub. Nova is $42 per user each month and adds SSO, an audit log, and 24/7 support. Annual billing takes 15% off Halo and Nova.',
  },
  {
    keys: ['ticket', 'support', 'issue', 'bug', 'incident', 'help desk', 'open a'],
    emotion: 'listen',
    reply:
      'To open a ticket: Help in the Lumen sidebar, then New ticket. Choose outage, access, or billing so it routes cleanly. I can file a draft here as LC-48219 if you describe the problem in one sentence.',
  },
  {
    keys: ['refund', 'cancel', 'money back', 'charge', 'charged'],
    emotion: 'concern',
    reply:
      'Annual plans have a 14-day full refund if the workspace stayed under five active canvases. After that, unused months on Halo or Nova are prorated as credit. Monthly plans can be cancelled before the next invoice. I can start a refund review as LC-R-1106 — tell me the workspace name.',
  },
  {
    keys: ['status', 'uptime', 'down', 'outage', 'operational'],
    emotion: 'neutral',
    reply:
      'Lumen Cloud is operational. Trailing thirty-day uptime is 99.97%. The last incident was a 12-minute ingest delay on 2 September, already closed. Status lives at status.lumen.example if you want the public board.',
  },
  {
    keys: ['slack', 'github', 'figma', 'integration', 'sso', 'okta'],
    emotion: 'smile',
    reply:
      'Halo and Nova connect Slack, GitHub, Figma, and Google Calendar. Nova also does Okta or Entra SSO. From Settings, open Connections, then authorize the app.',
  },
  {
    keys: ['how do', 'how to', 'invite', 'share', 'permission', 'vault'],
    emotion: 'neutral',
    reply:
      'Invite from the people glyph on any canvas. Guests on Spark can comment. Halo members can edit vault pages. Nova lets you lock a vault to a role. Share links expire in seven days unless you pin them.',
  },
  {
    keys: ['thanks', 'thank you', 'perfect'],
    emotion: 'smile',
    reply: 'Glad that helped. I will stay on this thread if you want to file a ticket or compare plans.',
  },
  {
    keys: ['bye', 'goodbye', "that's all", 'that is all'],
    emotion: 'smile',
    reply: 'I will close this conversation on my side. Open it again anytime.',
  },
];

const ASSISTANT_INTENTS = [
  {
    keys: ['hello', 'hi', 'hey', 'who are you', 'what can you'],
    emotion: 'smile',
    reply:
      'I am Aria, your virtual assistant. I can walk the day, hold reminders, and help you draft the next thing. What should we do first?',
  },
  {
    keys: ['calendar', 'schedule', 'today', 'agenda', 'meetings', 'what is on'],
    emotion: 'neutral',
    reply:
      'Friday 11 September 2026. 9:30 Standup with Lumen Cloud success. 11:00 Review avatar integration notes. 14:00 Design critique. 16:30 Wrap and ship the portfolio cut. I can move the critique or hold the afternoon if you want air.',
  },
  {
    keys: ['remind', 'reminder', 'remember to', 'ping me'],
    emotion: 'smile',
    reply:
      'Pinned. I will hold that reminder in this session. Ask me what is open and I will read it back.',
  },
  {
    keys: ['plan', 'tomorrow', 'morning', 'focus', 'priorit'],
    emotion: 'think',
    reply:
      'A clean morning: protect 8:30 to 10:30 for deep work, keep standup standing, and leave a 20-minute gap before the critique so notes can land. I can draft a status line for 16:30 when you are ready.',
  },
  {
    keys: ['draft', 'status', 'write', 'email', 'update'],
    emotion: 'smile',
    reply:
      'Draft status: “Avatar engine is live with visemes, emotion, and a local reply path. Support and assistant modes share the same Aria surface. Next is an optional OpenAI bind behind the existing /api/chat contract.”',
  },
  {
    keys: ['time', 'date', 'what day'],
    emotion: 'neutral',
    reply:
      'This demo treats today as Friday, 11 September 2026, so the seeded calendar stays consistent.',
  },
  {
    keys: ['help', 'what can', 'capabilities'],
    emotion: 'listen',
    reply:
      'I can read the seeded calendar, pin reminders, draft short updates, and talk through a next step. Switch to Support for Lumen Cloud plans or tickets.',
  },
  {
    keys: ['thanks', 'thank you'],
    emotion: 'smile',
    reply: 'Of course. I am here when the next block starts.',
  },
  {
    keys: ['bye', 'goodbye'],
    emotion: 'smile',
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

function lastUserText(messages) {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i]?.role === 'user' || messages[i]?.role === 'assistant') {
      if (messages[i].role === 'user') return messages[i].text || messages[i].content || '';
    }
  }
  const last = messages[messages.length - 1];
  return last?.text || last?.content || '';
}

function matchIntent(text, intents) {
  let best = null;
  let bestScore = 0;
  const hay = normalize(text);
  for (const intent of intents) {
    let score = 0;
    for (const key of intent.keys) {
      if (hay.includes(key)) score += key.includes(' ') ? 3 : 2;
    }
    if (score > bestScore) {
      best = intent;
      bestScore = score;
    }
  }
  return bestScore >= 2 ? best : null;
}

export function localServerReply({ messages = [], mode = 'support' } = {}) {
  const text = lastUserText(messages);
  const intents = mode === 'assistant' ? ASSISTANT_INTENTS : SUPPORT_INTENTS;
  const hit = matchIntent(text, intents);
  if (hit) return { reply: hit.reply, emotion: hit.emotion };

  if (mode === 'assistant') {
    return {
      emotion: 'think',
      reply: `I heard you. I can put that against the Friday calendar, pin a reminder, or draft a status line. Which of those should I do with “${String(text).slice(0, 72)}”?`,
    };
  }
  return {
    emotion: 'think',
    reply: `I can take that as a Lumen Cloud question. Tell me if this is about plans, a ticket, or a refund, or describe the workspace symptom in one line.`,
  };
}

function inferEmotion(reply, mode) {
  const t = normalize(reply);
  if (/(sorry|refund|outage|issue|cannot)/.test(t)) return 'concern';
  if (/(glad|welcome|pinned|draft|here to)/.test(t)) return 'smile';
  if (/(consider|usually|next|option)/.test(t)) return 'think';
  return mode === 'support' ? 'neutral' : 'smile';
}

export async function replyTo({ messages = [], mode = 'support' } = {}) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return localServerReply({ messages, mode });
  }

  const system = mode === 'assistant' ? ASSISTANT_FACTS : SUPPORT_FACTS;
  const payload = {
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    temperature: 0.5,
    messages: [
      { role: 'system', content: system },
      ...messages.map((m) => ({
        role: m.role === 'aria' || m.role === 'assistant' ? 'assistant' : 'user',
        content: m.text || m.content || '',
      })),
    ],
  };

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    return localServerReply({ messages, mode });
  }

  const data = await response.json();
  const reply = data?.choices?.[0]?.message?.content?.trim();
  if (!reply) return localServerReply({ messages, mode });
  return { reply, emotion: inferEmotion(reply, mode) };
}
