import { theme } from '@streamlink/ui';
import { Stack } from 'expo-router';

export default function DiscoverLayout() {
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
      <Stack.Screen name="[streamerId]" options={{ title: 'Streamer Profile' }} />
    </Stack>
  );
}
