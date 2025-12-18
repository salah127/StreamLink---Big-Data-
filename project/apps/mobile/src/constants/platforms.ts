import type { BadgeProps } from '@streamlink/ui';

export type PlatformId = 'TWITCH' | 'YOUTUBE' | 'KICK' | 'INSTAGRAM' | 'TIKTOK' | 'X';

const PLATFORM_BADGE_MAP: Record<PlatformId, NonNullable<BadgeProps['platform']>> = {
  TWITCH: 'twitch',
  YOUTUBE: 'youtube',
  KICK: 'kick',
  INSTAGRAM: 'instagram',
  TIKTOK: 'tiktok',
  X: 'x',
};

export const toBadgePlatform = (platform: string): BadgeProps['platform'] => {
  const normalized = platform.toUpperCase();
  if (normalized in PLATFORM_BADGE_MAP) {
    return PLATFORM_BADGE_MAP[normalized as PlatformId];
  }
  return undefined;
};
