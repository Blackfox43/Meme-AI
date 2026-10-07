
import { MemeTemplate, MemeLayout, HumorStyle, Meme } from './types';

export const TRENDING_TEMPLATES: MemeTemplate[] = [
  {
    id: 'drake',
    name: 'Drake Approves / Disapproves',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&h=600&q=80',
    layout: MemeLayout.Drake,
    tags: ['Classic', 'Comparison', 'Relatable'],
    suggestedTop: 'Writing code for 8 hours without testing',
    suggestedBottom: 'It compiles on the first try'
  },
  {
    id: 'distracted',
    name: 'Distracted Focus',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&h=600&q=80',
    layout: MemeLayout.TopBottom,
    tags: ['Trending', 'Choice', 'Work'],
    suggestedTop: 'Me with 10 deadlines due tomorrow',
    suggestedBottom: 'Researching how memes are born'
  },
  {
    id: 'brain',
    name: 'Expanding Cosmic Brain',
    url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&h=600&q=80',
    layout: MemeLayout.Modern,
    tags: ['Intellectual', 'Galaxy Brain', 'Tech'],
    suggestedTop: 'When you fix a bug by deleting the entire file',
    suggestedBottom: 'Modern problems require modern solutions'
  },
  {
    id: 'cat-chaos',
    name: 'Chaotic Cat Glare',
    url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&h=600&q=80',
    layout: MemeLayout.TopBottom,
    tags: ['Cats', 'Drama', 'Mood'],
    suggestedTop: 'I told you not to push to main',
    suggestedBottom: 'I pushed to main'
  },
  {
    id: 'coffee-overload',
    name: 'Monday Espresso Panic',
    url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&h=600&q=80',
    layout: MemeLayout.Modern,
    tags: ['Coffee', 'Office', 'Monday'],
    suggestedTop: 'First coffee of the morning',
    suggestedBottom: 'I can hear colors now'
  },
  {
    id: 'hacker-matrix',
    name: 'Cyberpunk Mastermind',
    url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&h=600&q=80',
    layout: MemeLayout.TopBottom,
    tags: ['Coding', 'Tech', 'Dark'],
    suggestedTop: 'Hacking the mainframe with inspect element',
    suggestedBottom: 'I am inside'
  },
  {
    id: 'doge-zen',
    name: 'Zen Doge Vibes',
    url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=600&h=600&q=80',
    layout: MemeLayout.TopBottom,
    tags: ['Wholesome', 'Animals', 'Chill'],
    suggestedTop: 'Everything is crashing around me',
    suggestedBottom: 'This is completely fine'
  },
  {
    id: 'neon-gamer',
    name: 'Late Night Gamer',
    url: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=600&h=600&q=80',
    layout: MemeLayout.Modern,
    tags: ['Gaming', 'Night Owl', 'Sarcastic'],
    suggestedTop: 'Just one more quick game before bed',
    suggestedBottom: 'Sun is rising outside'
  }
];

export const MOCK_FEED: Meme[] = [
  {
    id: '1',
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&h=600&q=80',
    topText: 'Me waiting for the code to compile',
    bottomText: 'It has been 84 years',
    humorStyle: HumorStyle.Relatable,
    layout: MemeLayout.TopBottom,
    likes: 1240,
    creator: 'DevGod',
    timestamp: Date.now() - 3600000,
    reactions: { '🔥': 89, '😂': 234, '💀': 145, '🧠': 23 },
    tags: ['#coding', '#devlife', '#relatable'],
    comments: [
      { id: 'c1', author: 'CodeNinja', text: 'Literally my Monday morning routine 💀', timestamp: Date.now() - 1800000 },
      { id: 'c2', author: 'PixelSam', text: 'This hit way too close to home', timestamp: Date.now() - 900000 }
    ],
    stickers: [
      { id: 's1', emoji: '💀', x: 80, y: 15, scale: 1.2 }
    ]
  },
  {
    id: '2',
    imageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&h=600&q=80',
    topText: 'AI replacing my job',
    bottomText: 'Me: using AI to generate memes all day',
    humorStyle: HumorStyle.Sarcastic,
    layout: MemeLayout.Modern,
    likes: 856,
    creator: 'MemeLord',
    timestamp: Date.now() - 7200000,
    reactions: { '🔥': 142, '😂': 320, '🧠': 98 },
    tags: ['#ai', '#sarcastic', '#work', '#tech'],
    comments: [
      { id: 'c3', author: 'ByteSip', text: 'The ultimate survival strategy 😂', timestamp: Date.now() - 3600000 }
    ]
  },
  {
    id: '3',
    imageUrl: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=600&h=600&q=80',
    topText: 'Server is down in production',
    bottomText: 'Me pretending to check the logs',
    humorStyle: HumorStyle.Relatable,
    layout: MemeLayout.TopBottom,
    likes: 642,
    creator: 'BugHunter',
    timestamp: Date.now() - 14400000,
    reactions: { '🔥': 54, '😂': 180, '💀': 88 },
    tags: ['#production', '#bug', '#devlife', '#relatable'],
    comments: []
  }
];

export const STICKER_PRESETS = [
  { emoji: '🕶️', label: 'Thug Life Glasses' },
  { emoji: '🔥', label: 'Fire' },
  { emoji: '💀', label: 'Dead / Skull' },
  { emoji: '👑', label: 'King Crown' },
  { emoji: '🧢', label: 'Cap' },
  { emoji: '💯', label: '100' },
  { emoji: '🤡', label: 'Clown' },
  { emoji: '🚀', label: 'To The Moon' },
  { emoji: '🧠', label: 'Big Brain' },
  { emoji: '✨', label: 'Sparkles' }
];

export const HUMOR_STYLES_MAP: Record<HumorStyle, string> = {
  [HumorStyle.Sarcastic]: 'dry, witty, and slightly cynical',
  [HumorStyle.Wholesome]: 'sweet, positive, and heart-warming',
  [HumorStyle.Dark]: 'edgy, cynical, and unconventional',
  [HumorStyle.Relatable]: 'everyday struggles and common experiences',
  [HumorStyle.Absurdist]: 'nonsensical, surreal, and bizarre'
};

export const DAILY_CHALLENGES = [
  {
    id: 'dc-ai-takeover',
    title: "AI Overlord Takeover",
    theme: "Meme of the Day: When AI Takes The Wheel",
    description: "Create a meme showing the hilarious chaos when AI writes your code, writes your emails, or solves everyday tasks.",
    prompt: "When you ask the AI to fix a minor typo and it rewrites the entire architecture",
    tag: "#MemeOfTheDay",
    rewardPoints: 250,
    rewardBadge: "Pro Creator",
    suggestedTemplateUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&h=800&q=80",
    suggestedTop: "AI: I OPTIMIZED YOUR PROJECT",
    suggestedBottom: "ME: YOU DELETED ALL THE TESTS",
  },
  {
    id: 'dc-monday-survival',
    title: "Monday Morning Coffee Glitch",
    theme: "Meme of the Day: Monday Morning Survival",
    description: "Show the real struggle of pretending to be an operational human before coffee cup #2 kicks in.",
    prompt: "Waiting for caffeine to synchronize with consciousness on a Monday morning",
    tag: "#MemeOfTheDay",
    rewardPoints: 250,
    rewardBadge: "Pro Creator",
    suggestedTemplateUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&h=800&q=80",
    suggestedTop: "FIRST 20 MINUTES AT WORK",
    suggestedBottom: "JUST STARING AT THE DESKTOP WALLPAPER",
  },
  {
    id: 'dc-meeting-email',
    title: "This Meeting Could Be An Email",
    theme: "Meme of the Day: Corporate Survival",
    description: "Capture the profound emotional stillness of nodding knowingly during a 45-minute sync that solved nothing.",
    prompt: "Surviving a meeting that could have been a single sentence Slack message",
    tag: "#MemeOfTheDay",
    rewardPoints: 250,
    rewardBadge: "Pro Creator",
    suggestedTemplateUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&h=800&q=80",
    suggestedTop: "45 MINUTES INTO A 10-PERSON SYNC",
    suggestedBottom: "\"LET'S CIRCLE BACK OFFLINE\"",
  },
  {
    id: 'dc-phantom-bug',
    title: "The Ghost In The Machine",
    theme: "Meme of the Day: The Bug That Vanished",
    description: "When an inexplicable error plagues you for 6 hours, then disappears when you show your screen to a colleague.",
    prompt: "When the bug mysteriously vanishes the second you call someone over to look",
    tag: "#MemeOfTheDay",
    rewardPoints: 250,
    rewardBadge: "Pro Creator",
    suggestedTemplateUrl: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=800&h=800&q=80",
    suggestedTop: "BUG WHEN I'M ALONE: TOTAL COLLAPSE",
    suggestedBottom: "BUG WHEN SCREEN SHARING: COMPLETELY FINE",
  },
  {
    id: 'dc-midnight-brain',
    title: "Midnight Brain Overclock",
    theme: "Meme of the Day: 3 AM Brain Thoughts",
    description: "When your brain decides 3:15 AM is the premier time to replay an awkward interaction from 7 years ago.",
    prompt: "Brain at midnight: remember that weird handshake in 2018?",
    tag: "#MemeOfTheDay",
    rewardPoints: 250,
    rewardBadge: "Pro Creator",
    suggestedTemplateUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&h=800&q=80",
    suggestedTop: "ME: TIME FOR A HEALTHY 8 HOURS OF SLEEP",
    suggestedBottom: "MY BRAIN: LET'S REPLAY THAT AWKWARD 2017 WAVE",
  },
];

export function getTodayDailyChallenge(targetDate?: Date) {
  const d = targetDate || new Date();
  const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  // Deterministic daily index using day of year
  const start = new Date(d.getFullYear(), 0, 0);
  const diff = d.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  const challenge = DAILY_CHALLENGES[dayOfYear % DAILY_CHALLENGES.length];
  
  return {
    ...challenge,
    dateKey,
  };
}
