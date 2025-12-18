export type SocialProviderKey = 'google' | 'kick' | 'facebook' | 'tiktok' | 'twitch' | 'youtube' | 'apple';

export interface SocialProviderConfig {
  key: SocialProviderKey;
  label: string;
}

export const SOCIAL_PROVIDERS: SocialProviderConfig[] = [
  { key: 'google', label: 'Google' },
  { key: 'kick', label: 'Kick' },
  { key: 'facebook', label: 'Facebook' },
  { key: 'tiktok', label: 'TikTok' },
  { key: 'twitch', label: 'Twitch' },
  { key: 'youtube', label: 'YouTube' },
  { key: 'apple', label: 'Apple' },
];
