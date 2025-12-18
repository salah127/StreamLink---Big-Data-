import { Ionicons } from '@expo/vector-icons';
import { Badge, Button, Card, EmptyState, Modal, theme } from '@streamlink/ui';
import { useQuery } from '@tanstack/react-query';
import type { ComponentProps } from 'react';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../src/services/api';
import type { Redemption } from '../../src/types/api';

const normalizeRedemptions = (value: unknown): Redemption[] => {
  if (Array.isArray(value)) {
    return value;
  }

  if (value && typeof value === 'object') {
    const { data, items } = value as { data?: unknown; items?: unknown };

    if (Array.isArray(data)) {
      return data;
    }

    if (Array.isArray(items)) {
      return items;
    }
  }

  return [];
};

export default function RewardsScreen() {
  const [isExploreOpen, setIsExploreOpen] = useState(false);
  const { data: redemptions, isLoading } = useQuery({
    queryKey: ['redemptions'],
    queryFn: () => api.getRedemptions(),
  });

  const { data: pointsData } = useQuery({
    queryKey: ['points-balance'],
    queryFn: () => api.getPointsBalance(),
  });

  const { data: availableRewards } = useQuery({
    queryKey: ['available-rewards'],
    queryFn: () => api.getRewards(),
  });

  const normalizedRedemptions = useMemo(
    () => normalizeRedemptions(redemptions),
    [redemptions]
  );

  const pendingRedemptions = normalizedRedemptions.filter((redemption) => redemption.status === 'PENDING');
  const completedRedemptions = normalizedRedemptions.filter((redemption) => redemption.status === 'FULFILLED');
  const rewardsList = availableRewards ?? [];

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingState}>
          <Text style={styles.loadingText}>Loading rewards...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Rewards</Text>
          
          <Text style={styles.subtitle}>Your redemptions and points</Text>
        </View>

        {/* Points Balance */}
        <Card style={styles.pointsCard} variant="elevated">
          <View style={styles.pointsHeader}>
            <Ionicons name="diamond" size={32} color={theme.colors.primary} />
            <View style={styles.pointsInfo}>
              <Text style={styles.pointsLabel}>Total Points</Text>
              <Text style={styles.pointsBalance}>
                {pointsData?.balance?.toLocaleString() || '0'}
              </Text>
            </View>
          </View>
          <Text style={styles.pointsDescription}>
            Earn points by watching streams, participating in polls, and engaging with content
          </Text>
        </Card>

        {/* Pending Redemptions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pending Redemptions</Text>
          {pendingRedemptions.length > 0 ? (
            pendingRedemptions.map((redemption) => (
              <RedemptionCard key={redemption.id} redemption={redemption} />
            ))
          ) : (
            <Card style={styles.emptyCard}>
              <EmptyState
                title="No pending redemptions"
                description="Your reward redemptions will appear here"
                icon={<Ionicons name="hourglass-outline" size={48} color={theme.colors.textMuted} />}
              />
            </Card>
          )}
        </View>

        {/* Redemption History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Redemption History</Text>
          {completedRedemptions.length > 0 ? (
            completedRedemptions.map((redemption) => (
              <RedemptionCard key={redemption.id} redemption={redemption} />
            ))
          ) : (
            <Card style={styles.emptyCard}>
              <EmptyState
                title="No redemption history"
                description="Start redeeming rewards to build your history"
                icon={<Ionicons name="receipt-outline" size={48} color={theme.colors.textMuted} />}
                action={
                  <Button
                    title="Explore Rewards"
                    variant="outline"
                    size="small"
                    onPress={() => setIsExploreOpen(true)}
                  />
                }
              />
            </Card>
          )}
        </View>

        {/* How to Earn Points */}
        <Card style={styles.infoCard}>
          <Text style={styles.infoTitle}>How to Earn Points</Text>
          <View style={styles.earnMethods}>
            <EarnMethod
              icon="play-circle"
              title="Watch Streams"
              description="Earn points for every minute watched"
              points="+5 per minute"
            />
            <EarnMethod
              icon="checkmark-circle"
              title="Vote in Polls"
              description="Participate in streamer polls"
              points="+10 per vote"
            />
            <EarnMethod
              icon="game-controller"
              title="Play Mini Games"
              description="Join trivia and prediction games"
              points="+25 per game"
            />
            <EarnMethod
              icon="heart"
              title="Daily Login"
              description="Log in daily for bonus points"
              points="+50 daily"
            />
          </View>
        </Card>
      </ScrollView>

      <Modal visible={isExploreOpen} onClose={() => setIsExploreOpen(false)}>
        <View style={styles.modalContent}>
          <Text style={styles.modalHeading}>Available Rewards</Text>
          {rewardsList.length > 0 ? (
            rewardsList.map((reward) => (
              <Card key={reward.id} style={styles.rewardItem}>
                <Text style={styles.rewardItemTitle}>{reward.title}</Text>
                {reward.description && (
                  <Text style={styles.rewardItemDescription}>{reward.description}</Text>
                )}
                <Text style={styles.rewardItemCost}>{reward.costPoints.toLocaleString()} pts</Text>
              </Card>
            ))
          ) : (
            <EmptyState
              title="No rewards yet"
              description="Rewards will appear here once streamers add them."
              icon={<Ionicons name="gift-outline" size={48} color={theme.colors.textMuted} />}
            />
          )}
          <Button title="Close" variant="ghost" onPress={() => setIsExploreOpen(false)} />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const RedemptionCard = ({ redemption }: { redemption: Redemption }) => (
  <Card style={styles.redemptionCard}>
    <View style={styles.redemptionHeader}>
      <View style={styles.redemptionInfo}>
        <Text style={styles.redemptionTitle}>{redemption.reward.title}</Text>
        <Text style={styles.streamerName}>
          from {redemption.streamer.displayName}
        </Text>
        {redemption.reward.description && (
          <Text style={styles.redemptionDescription}>
            {redemption.reward.description}
          </Text>
        )}
      </View>
      <Badge
        label={redemption.status}
        variant={redemption.status === 'FULFILLED' ? 'success' : 'warning'}
        size="small"
      />
    </View>
    <View style={styles.redemptionFooter}>
      <Text style={styles.redemptionCost}>
        {redemption.reward.costPoints} points
      </Text>
      <Text style={styles.redemptionDate}>
        {new Date(redemption.createdAt).toLocaleDateString()}
      </Text>
    </View>
  </Card>
);

type IoniconName = ComponentProps<typeof Ionicons>['name'];

const EarnMethod = ({ 
  icon, 
  title, 
  description, 
  points 
}: { 
  icon: IoniconName; 
  title: string; 
  description: string; 
  points: string; 
}) => (
  <View style={styles.earnMethod}>
    <Ionicons name={icon} size={24} color={theme.colors.primary} />
    <View style={styles.earnMethodInfo}>
      <Text style={styles.earnMethodTitle}>{title}</Text>
      <Text style={styles.earnMethodDescription}>{description}</Text>
    </View>
    <Text style={styles.earnMethodPoints}>{points}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: theme.spacing.lg,
  },
  title: {
    ...theme.typography.h2,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
  },
  section: {
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    ...theme.typography.h3,
    marginBottom: theme.spacing.md,
  },
  pointsCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  pointsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  pointsInfo: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  pointsLabel: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
  },
  pointsBalance: {
    ...theme.typography.h2,
    color: theme.colors.primary,
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  pointsDescription: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
  },
  redemptionCard: {
    marginBottom: theme.spacing.md,
  },
  redemptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  redemptionInfo: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  redemptionTitle: {
    ...theme.typography.h4,
    marginBottom: theme.spacing.xs,
  },
  streamerName: {
    ...theme.typography.bodySmall,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  redemptionDescription: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
  },
  redemptionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  redemptionCost: {
    ...theme.typography.body,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  redemptionDate: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
  },
  emptyCard: {
    marginBottom: theme.spacing.md,
  },
  infoCard: {
    margin: theme.spacing.lg,
  },
  infoTitle: {
    ...theme.typography.h4,
    marginBottom: theme.spacing.lg,
  },
  earnMethods: {
    gap: theme.spacing.lg,
  },
  earnMethod: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  earnMethodInfo: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  earnMethodTitle: {
    ...theme.typography.body,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  earnMethodDescription: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
  },
  earnMethodPoints: {
    ...theme.typography.bodySmall,
    color: theme.colors.success,
    fontWeight: '600',
  },
  modalContent: {
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  modalHeading: {
    ...theme.typography.h4,
    textAlign: 'center',
  },
  rewardItem: {
    gap: theme.spacing.xs,
  },
  rewardItemTitle: {
    ...theme.typography.body,
    fontWeight: '600',
  },
  rewardItemDescription: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
  },
  rewardItemCost: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    fontWeight: '600',
  },
});