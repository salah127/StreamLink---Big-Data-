import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

export type ProfileSection =
  | 'edit'
  | 'notifications'
  | 'linked-accounts'
  | 'privacy-security'
  | 'theme'
  | 'language'
  | 'help-support'
  | 'export-data'
  | 'privacy-policy'
  | 'terms-of-service';

export type IoniconName = ComponentProps<typeof Ionicons>['name'];

export type ProfileSectionConfig = {
  title: string;
  description: string;
  highlights?: string[];
  primaryAction?: {
    label: string;
    note?: string;
  };
};

export const PROFILE_SECTION_CONTENT: Record<ProfileSection, ProfileSectionConfig> = {
  edit: {
    title: 'Edit Profile',
    description:
      'Update your display name, bio, and social links to keep your community in the loop.',
    highlights: [
      'Change your avatar and banner',
      'Update personal details and timezone',
      'Manage the links that appear on your channel page',
    ],
  },
  notifications: {
    title: 'Notifications',
    description:
      'Choose which alerts you receive across mobile, email, and in-app messages.',
    highlights: [
      'Set quiet hours to pause push notifications',
      'Control stream live alerts for your followed creators',
      'Toggle marketing and community updates',
    ],
  },
  'linked-accounts': {
    title: 'Linked Accounts',
    description:
      'Connect your streaming and social platforms to synchronize schedules and rewards.',
    highlights: [
      'Link Twitch, YouTube, and Kick channels',
      'Sync follower rewards and loyalty points',
      'Disconnect integrations in a single tap',
    ],
  },
  'privacy-security': {
    title: 'Privacy & Security',
    description:
      'Review your sign-in devices, enable MFA, and manage data access permissions.',
    highlights: [
      'Enable two-factor authentication for extra protection',
      'Review authorized third-party apps',
      'See recent login history and revoke suspicious sessions',
    ],
  },
  theme: {
    title: 'Theme',
    description:
      'Switch between light, dark, and high-contrast themes to match your viewing preferences.',
    highlights: [
      'Preview themes before applying them',
      'Sync theme with system settings',
      'Customize accent colors (coming soon)',
    ],
  },
  language: {
    title: 'Language',
    description:
      'Select your preferred language for the app interface and content suggestions.',
    highlights: [
      'Browse all supported locales',
      'Automatically translate streamer descriptions',
      'Request new languages for future releases',
    ],
  },
  'help-support': {
    title: 'Help & Support',
    description:
      'Find answers to common questions or contact our support team for anything else.',
    highlights: [
      'Browse the StreamLink knowledge base',
      'Track your open support tickets',
      'Access emergency streamer safety resources',
    ],
    primaryAction: {
      label: 'Contact Support',
      note: 'Opens your default mail app with a templated message.',
    },
  },
  'export-data': {
    title: 'Export Data',
    description:
      'Generate a downloadable archive of your StreamLink account activity and preferences.',
    highlights: [
      'Request a GDPR-compliant data export',
      'Receive a secure download link via email',
      'Exports expire automatically after 30 days',
    ],
  },
  'privacy-policy': {
    title: 'Privacy Policy',
    description:
      'Understand how we collect, use, and protect your data while using StreamLink.',
    highlights: [
      'Review our commitment to transparency',
      'Learn about cookies and tracking preferences',
      'See how to exercise your privacy rights',
    ],
  },
  'terms-of-service': {
    title: 'Terms of Service',
    description:
      'Read the official StreamLink terms governing your use of our platform and services.',
    highlights: [
      'Acceptable use guidelines for creators and viewers',
      'Monetization policies and payout requirements',
      'Dispute resolution and arbitration details',
    ],
  },
};

export const getProfileSectionTitle = (section: ProfileSection) =>
  PROFILE_SECTION_CONTENT[section]?.title ?? 'Profile';
