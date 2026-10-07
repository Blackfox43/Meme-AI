
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

export type MemeFont = 'Bangers' | 'Impact' | 'Inter' | 'Comic';

export interface TextStyle {
  fontSize: number;
  color: string;
  strokeWidth: number;
  fontFamily?: MemeFont;
  textTransform?: 'uppercase' | 'none';
}

export interface MemeSticker {
  id: string;
  emoji: string;
  x: number; // percentage 0 - 100
  y: number; // percentage 0 - 100
  scale?: number;
}

export interface MemeComment {
  id: string;
  author: string;
  text: string;
  timestamp: number;
}

export interface MemeTemplate {
  id: string;
  name: string;
  url: string;
  layout: MemeLayout;
  tags: string[];
  suggestedTop?: string;
  suggestedBottom?: string;
}

export interface CaptionSuggestion {
  id: string;
  topText: string;
  bottomText: string;
  humorStyle: HumorStyle;
  pitch?: string;
}

export interface DailyChallenge {
  id: string;
  dateKey: string;
  title: string;
  theme: string;
  description: string;
  prompt: string;
  tag: string;
  rewardPoints: number;
  rewardBadge: string;
  suggestedTemplateUrl?: string;
  suggestedTop?: string;
  suggestedBottom?: string;
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
  creatorUid?: string;
  timestamp: number;
  textStyle?: TextStyle;
  reactions?: Record<string, number>;
  comments?: MemeComment[];
  stickers?: MemeSticker[];
  tags?: string[];
  isChallengeEntry?: boolean;
  challengeTheme?: string;
  isProCreator?: boolean;
}

export interface ModerationResult {
  safe: boolean;
  reason?: string;
  flagCategory?: string;
}

export interface AIResponse {
  topText: string;
  bottomText: string;
  explanation?: string;
  variations?: {
    topText: string;
    bottomText: string;
    style: string;
  }[];
}
