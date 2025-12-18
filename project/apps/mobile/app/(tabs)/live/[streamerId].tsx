import { Ionicons } from '@expo/vector-icons';
import { Badge, Button, Card, EmptyState, theme } from '@streamlink/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { toBadgePlatform } from '../../../src/constants/platforms';
import type { LiveStreamer } from './index';

const parseStreamer = (value?: string): LiveStreamer | null => {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(decodeURIComponent(value)) as LiveStreamer;
  } catch (error) {
    console.warn('[LiveStream] Failed to parse streamer payload', error);
    return null;
  }
};

export default function LiveStreamScreen() {
  const params = useLocalSearchParams<{ streamerId?: string; data?: string }>();
  const router = useRouter();

  const streamer = useMemo(() => parseStreamer(params.data), [params.data]);

  const handleWatch = () => {
    if (!streamer) {
      return;
    }

    Alert.alert(
      `Joining ${streamer.displayName}'s stream`,
      `Switching you to ${streamer.platform}...`,
      [{ text: 'Great!', onPress: () => router.back() }],
    );
  };

  if (!streamer) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          title="Stream unavailable"
          description="We couldn't load this live stream."
          icon={<Ionicons name="alert-circle-outline" size={48} color={theme.colors.textMuted} />}
          action={
            <Button title="Go back" variant="outline" onPress={() => router.back()} />
          }
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.playerCard} variant="elevated">
          {streamer.thumbnail ? (
            <Image source={{ uri: streamer.thumbnail }} style={styles.thumbnail} />
          ) : (
            <View style={styles.playerPlaceholder}>
              <Ionicons name="play-circle" size={72} color={theme.colors.primary} />
              <Text style={styles.placeholderText}>Live playback coming soon</Text>
            </View>
          )}
        </Card>

        <Card style={styles.infoCard}>
          <View style={styles.headerRow}>
            <Text style={styles.displayName}>{streamer.displayName}</Text>
            <Badge label={streamer.platform} platform={toBadgePlatform(streamer.platform)} size="small" />
          </View>
          <Text style={styles.streamTitle}>{streamer.title}</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="people" size={20} color={theme.colors.primary} />
              <Text style={styles.metaValue}>{streamer.viewers.toLocaleString()}</Text>
              <Text style={styles.metaLabel}>Watching now</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="time" size={20} color={theme.colors.primary} />
              <Text style={styles.metaValue}>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              <Text style={styles.metaLabel}>Joined at</Text>
            </View>
          </View>
          <Button title="Start Watching" variant="primary" onPress={handleWatch} style={styles.watchButton} />
          <Button title="Back to Live" variant="ghost" onPress={() => router.back()} />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  playerCard: {
    overflow: 'hidden',
    borderRadius: theme.borderRadius.lg,
  },
  thumbnail: {
    width: '100%',
    height: 200,
    borderRadius: theme.borderRadius.lg,
  },
  playerPlaceholder: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
  },
  placeholderText: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
  },
  infoCard: {
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  displayName: {
    ...theme.typography.h3,
  },
  streamTitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  metaRow: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
  },
  metaItem: {
    flex: 1,
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  metaValue: {
    ...theme.typography.h4,
  },
  metaLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  watchButton: {
    marginTop: theme.spacing.sm,
  },
});
