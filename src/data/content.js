export const MODES = {
  support: {
    id: 'support',
    label: 'Support',
    kicker: 'Lumen Cloud',
    title: 'Customer support',
    blurb: 'Plans, tickets, refunds — spoken or typed.',
    prompts: [
      'What is Lumen Cloud?',
      'Explain workspace pricing',
      'How do I open a ticket?',
      'What is your refund policy?',
    ],
  },
  assistant: {
    id: 'assistant',
    label: 'Assistant',
    kicker: 'Personal',
    title: 'Virtual assistant',
    blurb: 'Calendar, reminders, and a clear next step.',
    prompts: [
      "What's on my calendar today?",
      'Remind me to send the report at 4',
      'Help me plan tomorrow morning',
      'Draft a short status update',
    ],
  },
};

export function seedMessages(mode) {
  if (mode === 'assistant') {
    return [
      {
        id: 'seed-a1',
        role: 'aria',
        text: 'I am Aria, your virtual assistant. I can walk through Friday, pin reminders, and help you think out loud.',
        emotion: 'smile',
        at: Date.now() - 40000,
      },
      {
        id: 'seed-a2',
        role: 'aria',
        text: 'The day already has standup, an integration review, a critique at 14:00, and a ship block at 16:30. Tap a prompt or just speak.',
        emotion: 'neutral',
        at: Date.now() - 20000,
      },
    ];
  }

  return [
    {
      id: 'seed-s1',
      role: 'aria',
      text: 'Welcome to Lumen Cloud support. I am Aria. Ask about plans, tickets, or refunds — or tap a prompt to begin.',
      emotion: 'smile',
      at: Date.now() - 40000,
    },
    {
      id: 'seed-s2',
      role: 'aria',
      text: 'Spark is free. Halo and Nova add shared vaults and stronger support. I can file a draft ticket if you describe the issue in one line.',
      emotion: 'neutral',
      at: Date.now() - 20000,
    },
  ];
}

export function newId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `m-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
