import { PressStart2P_400Regular, useFonts } from '@expo-google-fonts/press-start-2p';
import { theme } from '@streamlink/ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuth } from '../src/hooks/useAuth';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore errors here since SplashScreen might already be hidden
});

const headerTitleFontFamily =
  Platform.select({
    web: '"Press Start 2P", "PressStart2P", monospace',
    default: 'PressStart2P_400Regular',
  }) ?? 'PressStart2P_400Regular';

export default function RootLayout() {
  const { initialize } = useAuth();
  const [fontsLoaded, fontsError] = useFonts({
    PressStart2P_400Regular,
  });

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await initialize();
      } catch (error) {
        console.error('Failed to initialize auth:', error);
      }
    };
    
    initializeAuth();
  }, [initialize]);

  useEffect(() => {
    if (fontsError) {
      console.error('Failed to load pixel font:', fontsError);
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsError]);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider onLayout={onLayoutRootView}>
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: theme.colors.background,
            },
            headerTintColor: theme.colors.textPrimary,
            headerTitleStyle: {
              fontFamily: headerTitleFontFamily,
              fontSize: 14,
            },
            headerShadowVisible: false,
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="light" backgroundColor={theme.colors.background} />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}