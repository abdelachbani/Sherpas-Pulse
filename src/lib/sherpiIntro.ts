export const SHERPI_INTRO_STEPS = [
  { control: null, title: 'Hi, I’m Sherpi', text: 'I’ll guide you through your plan. We’ll stop at key figures to review and answer questions.' },
  { control: 'playback', title: 'Take your time', text: 'Pause anytime to review at your own pace, or press Play to carry on.' },
  { control: 'terms', title: 'Look up terms', text: 'Tap Terms for words from this chapter. Switch between Everyday Analogy and Financial Mechanics.' },
  { control: 'voice', title: 'Voice on or off', text: 'Tap the speaker to mute or enable my voice narration.' },
  { control: 'sherpi', title: 'Ask me anything', text: 'Tap Sherpi to type a question, or hold to speak.' },
  { control: null, title: 'Ready to look at your plan?', text: 'We’ll start with your financial health.' },
] as const;
