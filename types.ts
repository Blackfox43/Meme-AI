
export enum HumorStyle {
  Sarcastic = 'Sarcastic',
  Wholesome = 'Wholesome',
  Dark = 'Dark',
  Relatable = 'Relatable',
  Absurdist = 'Absurdist'
}

export enum MemeLayout {
  TopBottom = 'top-bottom',
  Modern = 'modern',
  Drake = 'drake',
  Split = 'split'
}

export interface MemeTemplate {
  id: string;
  name: string;
  url: string;
  layout: MemeLayout;
  tags: string[];
}

export interface Meme {
  id: string;
  imageUrl: string;
  topText: string;
  bottomText: string;
  humorStyle: HumorStyle;
  layout: MemeLayout;
  likes: number;
  creator: string;
  timestamp: number;
  isProMeme?: boolean;
  type?: 'meme';
}

export interface Ad {
  id: string;
  imageUrl: string;
  title: string;
  description: string;
  ctaText: string;
  link: string;
  type: 'ad';
}

export type FeedItem = Meme | Ad;

export interface UserSettings {
  handle: string;
  isPro: boolean;
  hasOnboarded: boolean;
  theme: 'dark' | 'light';
  blockedCreators: string[];
}

export interface AIResponse {
  topText: string;
  bottomText: string;
  explanation?: string;
}
