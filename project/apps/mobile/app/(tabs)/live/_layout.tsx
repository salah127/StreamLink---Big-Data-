import { theme } from '@streamlink/ui';
import { Stack } from 'expo-router';

export default function LiveLayout() {
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
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[streamerId]" options={{ title: 'Live Stream' }} />
    </Stack>
  );
}
