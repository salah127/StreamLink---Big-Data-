export const iconNames = [
  'game',
  'sparkle',
  'analytics',
  'community',
  'chat',
  'notifications',
  'rewards',
  'lightning',
  'live',
  'launch'
] as const;

export type IconName = typeof iconNames[number];
