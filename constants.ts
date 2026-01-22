
import { MemeTemplate, MemeLayout, HumorStyle, Meme, Ad } from './types';

export const TRENDING_TEMPLATES: MemeTemplate[] = [
  {
    id: 'drake',
    name: 'Drake Hotline Bling',
    url: 'https://picsum.photos/seed/drake/600/600',
    layout: MemeLayout.Drake,
    tags: ['classic', 'choice']
  },
  {
    id: 'distracted',
    name: 'Distracted Boyfriend',
    url: 'https://picsum.photos/seed/boyfriend/600/400',
    layout: MemeLayout.TopBottom,
    tags: ['trending', 'love']
  },
  {
    id: 'brain',
    name: 'Expanding Brain',
    url: 'https://picsum.photos/seed/brain/600/800',
    layout: MemeLayout.Split,
    tags: ['intellectual', 'growth']
  },
  {
    id: 'modern-classic',
    name: 'Modern Caption',
    url: 'https://picsum.photos/seed/modern/600/600',
    layout: MemeLayout.Modern,
    tags: ['aesthetic', 'minimal']
  }
];

export const MOCK_ADS: Ad[] = [
  {
    id: 'ad-1',
    imageUrl: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=800',
    title: 'MemeAI Studio Pro',
    description: 'Unlock 4K exports, priority AI queue, and zero ads forever.',
    ctaText: 'GO PRO NOW',
    link: '#',
    type: 'ad'
  },
  {
    id: 'ad-2',
    imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=800',
    title: 'Retro Gamer Box',
    description: 'The ultimate subscription for classic gaming enthusiasts.',
    ctaText: 'CLAIM OFFER',
    link: '#',
    type: 'ad'
  },
  {
    id: 'ad-3',
    imageUrl: 'https://images.unsplash.com/photo-1557683311-eac922347aa1?auto=format&fit=crop&q=80&w=800',
    title: 'Cloud Storage Max',
    description: 'Never run out of space for your memes. 2TB for $1.',
    ctaText: 'UPGRADE',
    link: '#',
    type: 'ad'
  }
];

export const MOCK_FEED: Meme[] = [
  {
    id: '1',
    imageUrl: 'https://picsum.photos/seed/meme1/500/500',
    topText: 'Me waiting for the code to compile',
    bottomText: 'It has been 84 years',
    humorStyle: HumorStyle.Relatable,
    layout: MemeLayout.TopBottom,
    likes: 1240,
    creator: 'DevGod',
    timestamp: Date.now() - 3600000,
    type: 'meme'
  },
  {
    id: '2',
    imageUrl: 'https://picsum.photos/seed/meme2/500/500',
    topText: 'AI replacing my job',
    bottomText: 'Me: using AI to generate memes',
    humorStyle: HumorStyle.Sarcastic,
    layout: MemeLayout.Modern,
    likes: 856,
    creator: 'MemeLord',
    timestamp: Date.now() - 7200000,
    type: 'meme'
  }
];

export const HUMOR_STYLES_MAP: Record<HumorStyle, string> = {
  [HumorStyle.Sarcastic]: 'dry, witty, and slightly cynical',
  [HumorStyle.Wholesome]: 'sweet, positive, and heart-warming',
  [HumorStyle.Dark]: 'edgy, cynical, and unconventional',
  [HumorStyle.Relatable]: 'everyday struggles and common experiences',
  [HumorStyle.Absurdist]: 'nonsensical, surreal, and bizarre'
};
