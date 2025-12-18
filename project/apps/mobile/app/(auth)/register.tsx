import { Button, Card, Input, theme } from '@streamlink/ui';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SocialProviderKey } from '../../src/constants/socialProviders';
import { useSocialAuth } from '../../src/hooks/useSocialAuth';
import { api } from '../../src/services/api';
import { useAuthStore } from '../../src/store/auth';

const RegisterScreen = () => {
  const router = useRouter();
  const { login } = useAuthStore();

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { providers: socialProviders, authenticate, processingProvider } = useSocialAuth({
    context: 'register',
    onSuccess: () => router.replace('/(tabs)'),
    onError: (error) => {
      Alert.alert('Sign-up failed', error.message);
    },
  });

  const handleRegister = async () => {
    const trimmedEmail = email.trim();
    const trimmedUsername = username.trim();
    const trimmedDisplayName = displayName.trim();

    if (!trimmedDisplayName || !trimmedEmail || !trimmedUsername || !password) {
      Alert.alert('Missing information', 'Please fill out display name, email, username, and password.');
      return;
    }

    if (!/^[a-zA-Z0-9_.-]{3,}$/.test(trimmedUsername)) {
      Alert.alert('Invalid username', 'Usernames must be at least 3 characters and contain only letters, numbers, or .-_');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must contain at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.register({
        email: trimmedEmail,
        password,
        displayName: trimmedDisplayName,
        username: trimmedUsername.toLowerCase(),
      });
      await login(response.user, response.access_token);
      router.replace('/(tabs)');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create account';
      Alert.alert('Registration failed', message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialAuth = async (provider: SocialProviderKey) => {
    try {
      await authenticate(provider);
    } catch {
      // onError callback will surface feedback
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
              <Text style={styles.title}>Create account</Text>
              <Text style={styles.subtitle}>Join the StreamLink community in seconds</Text>
            </View>

            <Card variant="elevated" style={styles.formCard}>
              <Input
                label="Display name"
                value={displayName}
                onChangeText={setDisplayName}
                autoCapitalize="words"
                placeholder="Jane Doe"
                returnKeyType="next"
                variant="outline"
              />

              <Input
                label="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="you@example.com"
                returnKeyType="next"
                variant="outline"
              />

              <Input
                label="Username"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="yourhandle"
                helperText="Unique name, 3+ characters"
                returnKeyType="next"
                variant="outline"
              />

              <Input
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                helperText="At least 6 characters"
                placeholder="Enter a secure password"
                returnKeyType="done"
                variant="outline"
              />

              <Button
                title="Create account"
                onPress={handleRegister}
                loading={isLoading}
                style={styles.submitButton}
              />
            </Card>

            <View style={styles.socialSection}>
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerLabel}>Or sign up with</Text>
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
                      accessibilityLabel={`Create account with ${provider.label}`}
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
              <Text style={styles.footerText}>Already have an account?</Text>
              <Button
                title="Sign in"
                onPress={() => router.push('/(auth)/login')}
                variant="ghost"
                size="small"
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

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
    maxWidth: 520,
    paddingHorizontal: theme.spacing.xl,
    alignSelf: 'center',
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
    padding: theme.spacing.xl,
    gap: theme.spacing.lg,
    width: '100%',
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

export default RegisterScreen;
