import { theme } from '@streamlink/ui';
import { Stack } from 'expo-router';
import { PROFILE_SECTION_CONTENT, type ProfileSection } from '../../../src/features/profile/sections';

export default function ProfileSettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.background,
        },
        headerTintColor: theme.colors.textPrimary,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="[section]"
        options={({ route }) => {
          const params = route.params as { section?: string } | undefined;
          const rawSection = Array.isArray(params?.section)
            ? params?.section[0]
            : params?.section;
          const section = (rawSection ?? 'edit') as ProfileSection;
          return {
            title: PROFILE_SECTION_CONTENT[section]?.title ?? 'Profile',
          };
        }}
      />
    </Stack>
  );
}
