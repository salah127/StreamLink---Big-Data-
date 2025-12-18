import { Card, theme } from '@streamlink/ui';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export const TrendingStreamSkeleton: React.FC = () => {
  return (
    <Card variant="elevated" style={styles.card}>
      <View style={styles.thumbnail} />
      <View style={styles.meta}>
        <View style={styles.title} />
        <View style={styles.subtitle} />
        <View style={styles.badgeRow}>
          <View style={styles.badge} />
          <View style={styles.badgeSmall} />
        </View>
        <View style={styles.button} />
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    backgroundColor: theme.colors.surfaceElevated,
  },
  thumbnail: {
    height: 160,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
  },
  meta: {
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  title: {
    height: 18,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
    width: '80%',
  },
  subtitle: {
    height: 14,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
    width: '60%',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  badge: {
    width: 90,
    height: 20,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surface,
  },
  badgeSmall: {
    width: 70,
    height: 20,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surface,
  },
  button: {
    marginTop: theme.spacing.sm,
    height: 40,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.surface,
  },
});
