import { Ionicons } from '@expo/vector-icons';
import { Badge, Button, Card, theme } from '@streamlink/ui';
import React, { useCallback } from 'react';
import {
    Image,
    Linking,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { toBadgePlatform } from '../../constants/platforms';
import type { TrendingStream } from '../../types/api';
import { formatRelativeTimeFromNow } from '../../utils/date';
import { formatCompactNumber } from '../../utils/number';

const THUMBNAIL_HEIGHT = 180;

export const TrendingStreamCard: React.FC<{ stream: TrendingStream }> = ({ stream }) => {
  const platformBadge = toBadgePlatform(stream.platform);
  const relativeStarted = formatRelativeTimeFromNow(stream.startedAt);
  const viewerCopy = `${formatCompactNumber(stream.viewerCount)} watching`;

  const handleOpen = useCallback(async () => {
    if (!stream.url) {
      return;
    }

    try {
      const canOpen = await Linking.canOpenURL(stream.url);
      if (canOpen) {
        await Linking.openURL(stream.url);
      }
    } catch (error) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('Failed to open stream URL', error);
      }
    }
  }, [stream.url]);

  return (
    <Card variant="elevated" style={styles.card}>
      <Pressable
        onPress={handleOpen}
        accessibilityRole="button"
        accessibilityLabel={`Watch ${stream.title} on ${stream.platform}`}
        style={styles.pressable}
      >
        {stream.thumbnail ? (
          <Image
            source={{ uri: stream.thumbnail }}
            resizeMode="cover"
            style={styles.thumbnail}
            accessible
            accessibilityRole="image"
            accessibilityLabel={`${stream.title} thumbnail`}
          />
        ) : (
          <View style={[styles.thumbnail, styles.thumbnailFallback]}>
            <Ionicons name="videocam" size={48} color={theme.colors.textMuted} />
          </View>
        )}

        <View style={styles.meta}>
          <View style={styles.headerRow}>
            <Text style={styles.title} numberOfLines={2}>
              {stream.title}
            </Text>
            {platformBadge && (
              <Badge label={stream.platform} platform={platformBadge} size="small" />
            )}
          </View>

          <View style={styles.creatorRow}>
            <Ionicons name="person-circle" size={20} color={theme.colors.textSecondary} />
            <Text style={styles.creatorName} numberOfLines={1}>
              {stream.creator.displayName || stream.creator.username || 'Unknown Creator'}
            </Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="people" size={16} color={theme.colors.textSecondary} />
              <Text style={styles.statText}>{viewerCopy}</Text>
            </View>
            {relativeStarted && (
              <View style={styles.statItem}>
                <Ionicons name="time" size={16} color={theme.colors.textSecondary} />
                <Text style={styles.statText}>{relativeStarted}</Text>
              </View>
            )}
          </View>

          {stream.category && (
            <View style={styles.categoryPill}>
              <Ionicons name="pricetag" size={14} color={theme.colors.textSecondary} />
              <Text style={styles.categoryText} numberOfLines={1}>
                {stream.category}
              </Text>
            </View>
          )}
        </View>
      </Pressable>

      <Button
        title="Watch now"
        onPress={handleOpen}
        variant="primary"
        style={styles.watchButton}
      />
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  pressable: {
    gap: theme.spacing.md,
  },
  thumbnail: {
    width: '100%',
    height: THUMBNAIL_HEIGHT,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.surface,
  },
  thumbnailFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {
    gap: theme.spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  title: {
    flex: 1,
    ...theme.typography.h3,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  creatorName: {
    flex: 1,
    ...theme.typography.bodySmall,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    flexWrap: 'wrap',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  statText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  categoryPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surface,
  },
  categoryText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  watchButton: {
    alignSelf: 'stretch',
  },
});
