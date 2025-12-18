import { Button, Card, theme } from '@streamlink/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    PROFILE_SECTION_CONTENT,
    type ProfileSection,
} from '../../../src/features/profile/sections';

const SUPPORT_EMAIL = 'support@streamlink.tv';

export default function ProfileSectionScreen() {
  const params = useLocalSearchParams<{ section?: string }>();
  const router = useRouter();

  const sectionKey = useMemo<ProfileSection | null>(() => {
    const value = params.section;
    if (Array.isArray(value)) {
      return (value[0] ?? null) as ProfileSection | null;
    }
    return (value ?? null) as ProfileSection | null;
  }, [params.section]);

  const content = sectionKey ? PROFILE_SECTION_CONTENT[sectionKey] : undefined;

  const handlePrimaryAction = async () => {
    if (!sectionKey || !content?.primaryAction) {
      return;
    }

    if (sectionKey === 'help-support') {
      const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('StreamLink Support Request')}`;
      const canOpen = await Linking.canOpenURL(mailto);
      if (canOpen) {
        await Linking.openURL(mailto);
      }
      return;
    }

    router.back();
  };

  if (!content) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Section not found</Text>
          <Text style={styles.emptyDescription}>
            The page you are looking for is unavailable. Please try again later.
          </Text>
          <Button title="Back to profile" onPress={() => router.replace('/(tabs)/profile')} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          <Text style={styles.title}>{content.title}</Text>
          <Text style={styles.description}>{content.description}</Text>

          {content.highlights && (
            <View style={styles.highlightList}>
              {content.highlights.map((highlight) => (
                <View key={highlight} style={styles.highlightItem}>
                  <View style={styles.bullet} />
                  <Text style={styles.highlightText}>{highlight}</Text>
                </View>
              ))}
            </View>
          )}

          {content.primaryAction && (
            <View style={styles.actionContainer}>
              <Button title={content.primaryAction.label} onPress={handlePrimaryAction} />
              {content.primaryAction.note && (
                <Text style={styles.actionNote}>{content.primaryAction.note}</Text>
              )}
            </View>
          )}
        </Card>

        <Button
          title="Done"
          variant="ghost"
          onPress={() => router.back()}
          style={styles.doneButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  card: {
    gap: theme.spacing.md,
  },
  title: {
    ...theme.typography.h3,
  },
  description: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  highlightList: {
    gap: theme.spacing.sm,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
  },
  highlightText: {
    flex: 1,
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
  },
  actionContainer: {
    gap: theme.spacing.xs,
  },
  actionNote: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
  },
  doneButton: {
    alignSelf: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  emptyTitle: {
    ...theme.typography.h3,
  },
  emptyDescription: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});
