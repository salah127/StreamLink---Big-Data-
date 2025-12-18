import { Button, Card, Input, theme } from '@streamlink/ui';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SocialProviderKey } from '../../src/constants/socialProviders';
import { useSocialAuth } from '../../src/hooks/useSocialAuth';
import { api } from '../../src/services/api';
import { useAuthStore } from '../../src/store/auth';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { providers: socialProviders, authenticate, processingProvider } = useSocialAuth({
    context: 'login',
    onSuccess: () => router.replace('/(tabs)'),
    onError: (error) => {
      Alert.alert('Sign-in failed', error.message);
    },
  });

  const handleLogin = async () => {
    if (!loginId.trim() || !password) {
      Alert.alert('Error', 'Please enter your email or username and password.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.login({ loginId: loginId.trim(), password });
      await login(response.user, response.access_token);
      router.replace('/(tabs)');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid credentials. Please try again.';
      Alert.alert('Login Failed', message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialAuth = async (provider: SocialProviderKey) => {
    try {
      await authenticate(provider);
    } catch {
      // onError callback handles user feedback
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.select({ ios: 'padding', default: undefined })}
        keyboardVerticalOffset={Platform.select({ ios: 24, default: 0 })}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="automatic"
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>Sign in to your StreamLink account</Text>
            </View>

            <Card variant="elevated" style={styles.formCard}>
              <Input
                label="Email or Username"
                value={loginId}
                onChangeText={setLoginId}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="you@example.com or yourhandle"
                variant="outline"
              />

              <Input
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                placeholder="Enter your password"
                variant="outline"
              />

              <Button
                title="Sign In"
                onPress={handleLogin}
                loading={isLoading}
                style={styles.submitButton}
              />
            </Card>

            <View style={styles.socialSection}>
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerLabel}>Or continue with</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.socialGrid}>
                {socialProviders.map((provider) => {
                  const isProcessing = processingProvider === provider.key;
                  const isDisabled = processingProvider !== null && !isProcessing;
                  return (
                    <TouchableOpacity
                      key={provider.key}
                      style={[
                        styles.socialButton,
                        isProcessing && styles.socialButtonActive,
                        isDisabled && styles.socialButtonDisabled,
                      ]}
                      onPress={() => handleSocialAuth(provider.key)}
                      activeOpacity={0.85}
                      disabled={processingProvider !== null}
                      accessibilityRole="button"
                      accessibilityLabel={`Continue with ${provider.label}`}
                    >
                      <View style={styles.socialBadge}>
                        {isProcessing ? (
                          <ActivityIndicator color={theme.colors.primary} size="small" />
                        ) : (
                          <Text style={styles.socialBadgeText}>{provider.label.slice(0, 1)}</Text>
                        )}
                      </View>
                      <Text style={styles.socialButtonText}>
                        {isProcessing ? 'Connecting…' : provider.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account?</Text>
              <Button
                title="Create Account"
                onPress={() => router.push('/(auth)/register')}
                variant="ghost"
                size="small"
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: theme.spacing.xxl,
  },
  content: {
    width: '100%',
    maxWidth: 480,
    paddingHorizontal: theme.spacing.xl,
    alignSelf: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xxl,
  },
  header: {
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  title: {
    ...theme.typography.h2,
    textAlign: 'center',
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  formCard: {
    width: '100%',
    padding: theme.spacing.xl,
    gap: theme.spacing.lg,
  },
  socialSection: {
    width: '100%',
    gap: theme.spacing.md,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.border,
  },
  dividerLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  socialGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  socialButton: {
    flexGrow: 1,
    minWidth: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  socialButtonActive: {
    borderColor: theme.colors.primary,
  },
  socialButtonDisabled: {
    opacity: 0.65,
  },
  socialBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceElevated,
  },
  socialBadgeText: {
    ...theme.typography.button,
    color: theme.colors.textPrimary,
  },
  socialButtonText: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    flexShrink: 1,
  },
  submitButton: {
    marginTop: theme.spacing.sm,
    width: '100%',
  },
  footer: {
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  footerText: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
  },
});