import type { IconName } from './iconNames';

export type PixelPath = {
  d: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
};

export type PixelIconDefinition = {
  viewBox: string;
  paths: PixelPath[];
};

export const pixelIconDefinitions: Record<IconName, PixelIconDefinition> = {
  game: {
    viewBox: '0 0 24 24',
    paths: [
      {
        d: 'M2 5h20v14H2V5zm18 12V7H4v10h16zM8 9h2v2h2v2h-2v2H8v-2H6v-2h2V9zm6 0h2v2h-2V9zm4 4h-2v2h2v-2z',
        fill: 'currentColor'
      }
    ]
  },
  sparkle: {
    viewBox: '0 0 24 24',
    paths: [
      {
        d: 'M13 3h-2v2h2V3zm4 2h2v2h-2V5zm-6 6h2v2h-2v-2zm-8 0h2v2H3v-2zm18 0h-2v2h2v-2zM5 5h2v2H5V5zm14 14h-2v-2h2v2zm-8 2h2v-2h-2v2zm-4-2H5v-2h2v2zM9 7h6v2H9V7zm0 8H7V9h2v6zm0 0v2h6v-2h2V9h-2v6H9z',
        fill: 'currentColor'
      }
    ]
  },
  analytics: {
    viewBox: '0 0 24 24',
    paths: [
      {
        d: 'M3 3h18v18H3V3zm16 2H5v14h14V5zM7 12h2v5H7v-5zm10-5h-2v10h2V7zm-6 3h2v2h-2v-2zm2 4h-2v3h2v-3z',
        fill: 'currentColor'
      }
    ]
  },
  community: {
    viewBox: '0 0 24 24',
    paths: [
      {
        d: 'M3 3h18v18H3V3zm2 2v14h14V5H5zm2 2h4v4H7V7zm6 0h4v4h-4V7zm-6 6h4v4H7v-4zm6 0h4v4h-4v-4z',
        fill: 'currentColor'
      }
    ]
  },
  chat: {
    viewBox: '0 0 24 24',
    paths: [
      {
        d: 'M20 2H2v20h2V4h16v12H6v2H4v2h2v-2h16V2h-2z',
        fill: 'currentColor'
      }
    ]
  },
  notifications: {
    viewBox: '0 0 24 24',
    paths: [
      {
        d: 'M14 4V2h-4v2H5v2h14V4h-5zm5 12H5v-4H3v6h5v4h2v-4h4v2h-4v2h6v-4h5v-6h-2V6h-2v8h2v2zM5 6v8h2V6H5z',
        fill: 'currentColor'
      }
    ]
  },
  rewards: {
    viewBox: '0 0 24 24',
    paths: [
      {
        d: 'M19 12v8h-7m7-8h2V8h-3m1 4H5m13-4V4h-6m6 4H6m0 0V4h6M6 8H3v4h2m0 0v8h7m0 0V4',
        stroke: 'currentColor',
        strokeWidth: 2
      }
    ]
  },
  lightning: {
    viewBox: '0 0 24 24',
    paths: [
      {
        d: 'M12 1h2v8h8v4h-2v-2h-8V5h-2V3h2V1zM8 7V5h2v2H8zM6 9V7h2v2H6zm-2 2V9h2v2H4zm10 8v2h-2v2h-2v-8H2v-4h2v2h8v6h2zm2-2v2h-2v-2h2zm2-2v2h-2v-2h2zm0 0h2v-2h-2v2z',
        fill: 'currentColor'
      }
    ]
  },
  live: {
    viewBox: '0 0 24 24',
    paths: [
      {
        d: 'M18 2H6v2H4v2H2v12h2v2h2v2h12v-2h2v-2h2V6h-2V4h-2V2zm0 2v2h2v12h-2v2H6v-2H4V6h2V4h12zm-8 6h4v4h-4v-4zM8 6h8v2H8V6zm0 10H6V8h2v8zm8 0v2H8v-2h8zm0 0h2V8h-2v8z',
        fill: 'currentColor'
      }
    ]
  },
  launch: {
    viewBox: '0 0 24 24',
    paths: [
      {
        d: 'M11 20h2V8h2V6h-2V4h-2v2H9v2h2v12zM7 10V8h2v2H7zm0 0v2H5v-2h2zm10 0V8h-2v2h2zm0 0v2h2v-2h-2z',
        fill: 'currentColor'
      }
    ]
  }
};
