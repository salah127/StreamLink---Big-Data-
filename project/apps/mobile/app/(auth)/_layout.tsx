import { Stack } from 'expo-router';
import { theme } from '@streamlink/ui';

export default function AuthLayout() {
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
        name="onboarding" 
        options={{ 
          headerShown: false,
          title: 'Welcome' 
        }} 
      />
      <Stack.Screen 
        name="login" 
        options={{ 
          title: 'Sign In',
          headerBackTitle: 'Back' 
        }} 
      />
      <Stack.Screen 
        name="register" 
        options={{ 
          title: 'Create Account',
          headerBackTitle: 'Back' 
        }} 
      />
    </Stack>
  );
}