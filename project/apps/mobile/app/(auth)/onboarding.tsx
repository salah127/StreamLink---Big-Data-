import { Button, Icon, theme, type IconName } from '@streamlink/ui';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OnboardingScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.title}>StreamLink</Text>
          <Text style={styles.subtitle}>
            Your universal companion for streaming and content creation
          </Text>
          <Text style={styles.description}>
            Connect all your platforms, engage with your audience, and grow your community in one place.
          </Text>
        </View>

        <View style={styles.features}>
          <FeatureItem
            icon="game"
            title="Multi-Platform"
            description="Connect Twitch, YouTube, Kick, and more"
          />
          <FeatureItem
            icon="sparkle"
            title="Rewards System"
            description="Earn and redeem points across all platforms"
          />
          <FeatureItem
            icon="analytics"
            title="Analytics"
            description="Track your growth and engagement"
          />
        </View>

        <View style={styles.actions}>
          <Button
            title="Get Started"
            onPress={() => router.push('/(auth)/register')}
            variant="primary"
            style={styles.primaryButton}
          />
          <Button
            title="I already have an account"
            onPress={() => router.push('/(auth)/login')}
            variant="ghost"
            style={styles.secondaryButton}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
const FeatureItem = ({ icon, title, description }: {
  icon: IconName;
  title: string;
  description: string;
}) => (
  <View style={styles.featureItem}>
  <Icon name={icon} size="lg" color={theme.colors.primary} style={styles.featureIcon} />
    <View style={styles.featureText}>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  hero: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.primary,
    marginBottom: theme.spacing.md,
    fontSize: 42,
  },
  subtitle: {
    ...theme.typography.h4,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  description: {
    ...theme.typography.body,
    textAlign: 'center',
    color: theme.colors.textSecondary,
  },
  features: {
    flex: 1,
    justifyContent: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  featureIcon: {
    marginRight: theme.spacing.md,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    ...theme.typography.h4,
    marginBottom: theme.spacing.xs,
  },
  featureDescription: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
  },
  actions: {
    paddingVertical: theme.spacing.xl,
  },
  primaryButton: {
    marginBottom: theme.spacing.md,
  },
  secondaryButton: {
    marginTop: theme.spacing.sm,
  },
});