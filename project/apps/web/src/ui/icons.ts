import type { IconName } from '@streamlink/ui';
import { type IconType } from 'react-icons';
import {
    PiBellBold,
    PiChartLineUpBold,
    PiChatTeardropDotsFill,
    PiGameControllerFill,
    PiGiftFill,
    PiLightningFill,
    PiRecordFill,
    PiRocketLaunchFill,
    PiStarFourFill,
    PiUsersThreeFill
} from 'react-icons/pi';

const iconDefinitions: Record<IconName, IconType> = {
  game: PiGameControllerFill,
  sparkle: PiStarFourFill,
  analytics: PiChartLineUpBold,
  community: PiUsersThreeFill,
  chat: PiChatTeardropDotsFill,
  notifications: PiBellBold,
  rewards: PiGiftFill,
  lightning: PiLightningFill,
  live: PiRecordFill,
  launch: PiRocketLaunchFill
};

export const iconMap: Record<IconName, IconType> = iconDefinitions;
