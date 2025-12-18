import { Ionicons } from '@expo/vector-icons';
import { Badge, Button, Card, EmptyState, theme } from '@streamlink/ui';
import { useQuery } from '@tanstack/react-query';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TrendingStreamCard } from '../../src/components/streams/TrendingStreamCard';
import { TrendingStreamSkeleton } from '../../src/components/streams/TrendingStreamSkeleton';
import { toBadgePlatform } from '../../src/constants/platforms';
import { useInfiniteTrendingStreams } from '../../src/hooks/useInfiniteTrendingStreams';
import { useTrendingFilters, type CategoryFilter, type PlatformFilter } from '../../src/hooks/useTrendingFilters';
import { formatDate, t } from '../../src/lib/i18n/index';
import { api } from '../../src/services/api';
import { useAuthStore } from '../../src/store/auth';
import type { DashboardStats, Follow, StreamPlatform, TrendingStream } from '../../src/types/api';
import { formatRelativeTimeFromNow } from '../../src/utils/date';
import { formatCompactNumber } from '../../src/utils/number';
import { sanitizeName } from '../../src/utils/text';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const TRENDING_SKELETON_COUNT = 3;

type PlatformCategoriesMap = Partial<Record<PlatformFilter, string[]>>;

const PLATFORM_FILTER_OPTIONS: Array<{ label: string; value: PlatformFilter; icon: IoniconName }> = [
  { label: 'All', value: 'ALL', icon: 'earth' },
  { label: 'Twitch', value: 'TWITCH', icon: 'logo-twitch' },
  { label: 'YouTube', value: 'YOUTUBE', icon: 'logo-youtube' },
  { label: 'Kick', value: 'KICK', icon: 'flash' },
];

export default function HomeScreen() {
  const { user } = useAuthStore();
  const isStreamer = user?.role === 'STREAMER' || user?.role === 'BOTH';
  const isViewer = user?.role === 'VIEWER' || user?.role === 'BOTH';
  const { filters, updateFilters, resetFilters, hydrated } = useTrendingFilters();
  const selectedPlatform = filters.platform;
  const selectedCategory = filters.category;
  const [categoriesByPlatform, setCategoriesByPlatform] = useState<PlatformCategoriesMap>({});
  const flatListRef = useRef<FlatList<TrendingStream> | null>(null);

  const {
    data: following,
    isLoading: followingLoading,
    refetch: refetchFollowing,
  } = useQuery<Follow[]>({
    queryKey: ['following'],
    queryFn: () => api.getFollowing(),
    enabled: isViewer,
  });

  const {
    data: dashboardStats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.getDashboardStats(),
    enabled: isStreamer,
  });

  const platformsFilter = useMemo<StreamPlatform[] | undefined>(
    () => (selectedPlatform === 'ALL' ? undefined : [selectedPlatform]),
    [selectedPlatform],
  );

  const trendingQuery = useInfiniteTrendingStreams({
    limit: 10,
    platforms: platformsFilter,
    category: selectedCategory === 'ALL' ? undefined : selectedCategory,
    enabled: hydrated,
  });
  const {
    data: trendingData,
    isLoading: trendingLoading,
    isError: trendingError,
    refetch: refetchTrending,
    isRefetching: trendingRefetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = trendingQuery;

  const trendingStreams = useMemo<TrendingStream[]>(
    () => trendingData?.pages.flatMap((page) => page.items) ?? [],
    [trendingData],
  );

  const liveStreamers = useMemo(
    () => (following ?? []).filter((follow) => follow.streamer.liveStatuses.length > 0),
    [following],
  );

  const upcomingStreamers = useMemo(
    () => (following ?? []).slice(0, 5),
    [following],
  );

  const greetingUsername = useMemo(() => {
    const candidateUsername = sanitizeName(user?.username ?? null);
    if (candidateUsername.length > 0) {
      return candidateUsername;
    }

    const candidateDisplayName = sanitizeName(user?.displayName ?? null);
    return candidateDisplayName;
  }, [user?.username, user?.displayName]);

  const greetingText = greetingUsername.length
    ? t('home.greetingWithName', { username: greetingUsername })
    : t('home.greetingFallback');

  const dateSubtitle = useMemo(
    () =>
      formatDate(new Date(), {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    [],
  );

  const handleRefresh = useCallback(() => {
    const requests: Array<Promise<unknown>> = [];

    if (isViewer) {
      requests.push(refetchFollowing());
    }

    if (isStreamer) {
      requests.push(refetchStats());
    }

    if (hydrated) {
      requests.push(refetchTrending());
    }
    return Promise.all(requests);
  }, [hydrated, isStreamer, isViewer, refetchFollowing, refetchStats, refetchTrending]);

  const onRefresh = useCallback(() => {
    void handleRefresh();
  }, [handleRefresh]);

  const handleLoadMore = useCallback(() => {
    if (!hydrated) {
      return;
    }

    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, hydrated, isFetchingNextPage]);

  const handleSelectPlatform = useCallback((value: PlatformFilter) => {
    updateFilters({ platform: value, category: 'ALL' });
  }, [updateFilters]);

  const handleSelectCategory = useCallback((value: CategoryFilter) => {
    updateFilters({ category: value });
  }, [updateFilters]);

  const isTrendingLoading = !hydrated || trendingLoading;
  const isRefreshing = !hydrated || trendingRefetching || followingLoading || statsLoading;

  const handleResetFilters = useCallback(() => {
    resetFilters();
  }, [resetFilters]);

  useEffect(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  }, [selectedPlatform, selectedCategory]);

  useEffect(() => {
    const categoryNames = Array.from(
      new Set(
        (trendingData?.pages ?? [])
          .flatMap((page) => page.items)
          .map((item) => item.category)
          .filter((value): value is string => Boolean(value && value.trim().length > 0))
          .map((value) => value.trim()),
      ),
    );

    if (categoryNames.length === 0) {
      return;
    }

    setCategoriesByPlatform((prev) => {
      const existing = prev[selectedPlatform] ?? [];
      const merged = Array.from(new Set([...existing, ...categoryNames]));

      const isSameLength = merged.length === existing.length;
      const isSameOrder = isSameLength && merged.every((value, index) => value === existing[index]);

      if (isSameLength && isSameOrder) {
        return prev;
      }

      const sorted = merged.slice().sort((a, b) => a.localeCompare(b));

      return {
        ...prev,
        [selectedPlatform]: sorted,
      };
    });
  }, [selectedPlatform, trendingData]);

  const activePlatformLabel = useMemo(() => {
    return PLATFORM_FILTER_OPTIONS.find((option) => option.value === selectedPlatform)?.label ?? 'All';
  }, [selectedPlatform]);

  const availableCategories = useMemo(() => categoriesByPlatform[selectedPlatform] ?? [], [categoriesByPlatform, selectedPlatform]);

  useEffect(() => {
    if (selectedCategory === 'ALL') {
      return;
    }

    if (!availableCategories.includes(selectedCategory)) {
      updateFilters({ category: 'ALL' });
    }
  }, [availableCategories, selectedCategory, updateFilters]);

  const headerComponent = useMemo(
    () => (
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <Text style={styles.greeting} accessibilityRole="header">
            {greetingText}
          </Text>
          <Text style={styles.subtitle}>{dateSubtitle}</Text>
        </View>

        {isStreamer && (
          <Card style={styles.statsCard}>
            <Text style={styles.sectionTitle}>Your Stats</Text>
            <View style={styles.statsGrid}>
              <StatItem label="Followers" value={dashboardStats?.followers ?? 0} icon="people" />
              <StatItem label="Total Views" value={dashboardStats?.totalViews ?? 0} icon="eye" />
              <StatItem label="Recent Content" value={dashboardStats?.recentContent ?? 0} icon="videocam" />
              <StatItem label="Pending Rewards" value={dashboardStats?.pendingRedemptions ?? 0} icon="gift" />
            </View>
          </Card>
        )}

        {isViewer && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Live Now</Text>
              {liveStreamers.length > 0 ? (
                liveStreamers.map((follow) => <LiveStreamerCard key={follow.id} follow={follow} />)
              ) : (
                <Card style={styles.emptyCard}>
                  <EmptyState
                    title="No one is live"
                    description="None of your followed streamers are currently streaming"
                    icon={<Ionicons name="videocam-off" size={48} color={theme.colors.textMuted} />}
                  />
                </Card>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your Following</Text>
              {upcomingStreamers.length > 0 ? (
                upcomingStreamers.map((follow) => <FollowCard key={follow.id} follow={follow} />)
              ) : (
                <Card style={styles.emptyCard}>
                  <EmptyState
                    title="No followed streamers"
                    description="Discover and follow streamers to see them here"
                    icon={<Ionicons name="heart-outline" size={48} color={theme.colors.textMuted} />}
                    action={
                      <Button title="Discover Streamers" variant="outline" size="small" onPress={() => {}} />
                    }
                  />
                </Card>
              )}
            </View>
          </>
        )}

        <View style={styles.trendingIntro}>
          <Text style={styles.sectionTitle}>Trending live streams</Text>
          <Text style={styles.sectionSubtitle}>
            The hottest creators across Twitch, YouTube, Kick, and more.
          </Text>
          <View style={styles.filterRow}>
            {PLATFORM_FILTER_OPTIONS.map((option) => (
              <FilterChip
                key={option.value}
                label={option.label}
                icon={option.icon}
                selected={option.value === selectedPlatform}
                onPress={() => handleSelectPlatform(option.value)}
              />
            ))}
          </View>
          {availableCategories.length > 0 && (
            <View style={styles.categoryRow}>
              {["ALL", ...availableCategories].map((category) => (
                <FilterChip
                  key={category === 'ALL' ? 'ALL_CATEGORIES' : category}
                  label={category === 'ALL' ? 'All topics' : category}
                  icon={category === 'ALL' ? 'albums' : 'pricetag'}
                  selected={selectedCategory === category}
                  onPress={() => handleSelectCategory(category as CategoryFilter)}
                />
              ))}
            </View>
          )}
        </View>
      </View>
    ),
    [
      dashboardStats?.followers,
      dashboardStats?.pendingRedemptions,
      dashboardStats?.recentContent,
      dashboardStats?.totalViews,
      dateSubtitle,
      greetingText,
      isStreamer,
      isViewer,
      liveStreamers,
      upcomingStreamers,
      selectedPlatform,
      selectedCategory,
      availableCategories,
      handleSelectCategory,
      handleSelectPlatform,
    ],
  );

  const emptyComponent = useMemo(() => {
    if (isTrendingLoading) {
      return (
        <View style={styles.skeletonContainer}>
          {Array.from({ length: TRENDING_SKELETON_COUNT }).map((_, index) => (
            <TrendingStreamSkeleton key={`trending-skeleton-${index}`} />
          ))}
        </View>
      );
    }

    if (hydrated && trendingError) {
      return (
        <Card style={styles.emptyCard}>
          <EmptyState
            title="Unable to load trending streams"
            description="Please try again in a moment."
            icon={<Ionicons name="alert-circle" size={48} color={theme.colors.textMuted} />}
            action={
              <Button title="Retry" variant="outline" size="small" onPress={() => refetchTrending()} />
            }
          />
        </Card>
      );
    }

    const isPlatformFiltered = selectedPlatform !== 'ALL';
    const isCategoryFiltered = selectedCategory !== 'ALL';

    const platformSegment = isPlatformFiltered ? `${activePlatformLabel} ` : '';
    const categorySegment = isCategoryFiltered ? `${selectedCategory} ` : '';

    const title = isPlatformFiltered || isCategoryFiltered
      ? `No ${platformSegment}${categorySegment}streams trending right now`
      : 'No trending streams right now';

    const description = isPlatformFiltered || isCategoryFiltered
      ? 'Try a different filter combination or reset to see more streams.'
      : 'Check back soon to see who goes live next.';

    const shouldShowReset = isPlatformFiltered || isCategoryFiltered;

    const action = shouldShowReset
      ? (
          <Button
            title="Reset filters"
            variant="outline"
            size="small"
            onPress={handleResetFilters}
          />
        )
      : undefined;

    return (
      <Card style={styles.emptyCard}>
        <EmptyState
          title={title}
          description={description}
          icon={<Ionicons name="videocam-off" size={48} color={theme.colors.textMuted} />}
          action={action}
        />
      </Card>
    );
  }, [activePlatformLabel, handleResetFilters, hydrated, isTrendingLoading, refetchTrending, selectedCategory, selectedPlatform, trendingError]);

  const footerComponent = useMemo(() => {
    if (!hydrated) {
      return <View style={styles.footerSpacer} />;
    }

    if (isFetchingNextPage) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      );
    }

    if (!hasNextPage && trendingStreams.length > 0) {
      return (
        <View style={styles.footerMessage}>
          <Text style={styles.footerText}>You’re all caught up for now.</Text>
        </View>
      );
    }

    return <View style={styles.footerSpacer} />;
  }, [hasNextPage, hydrated, isFetchingNextPage, trendingStreams.length]);

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={trendingStreams}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TrendingStreamCard stream={item} />}
        ListHeaderComponent={headerComponent}
        ListEmptyComponent={emptyComponent}
        ListFooterComponent={footerComponent}
        contentContainerStyle={styles.listContent}
        style={styles.list}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.6}
        refreshing={isRefreshing}
        onRefresh={onRefresh}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const StatItem = ({ label, value, icon }: { label: string; value: number; icon: IoniconName }) => (
  <View style={styles.statItem}>
    <Ionicons name={icon} size={24} color={theme.colors.primary} />
    <Text style={styles.statValue}>{formatCompactNumber(value)}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const LiveStreamerCard = ({ follow }: { follow: Follow }) => {
  const primaryStatus = follow.streamer.liveStatuses[0];
  const platformBadge = primaryStatus ? toBadgePlatform(primaryStatus.platform) : undefined;
  const liveTitle = primaryStatus?.title ?? 'Untitled Stream';
  const relativeStarted = formatRelativeTimeFromNow(primaryStatus?.startedAt ?? null);

  return (
    <Card style={styles.streamerCard} variant="elevated">
      <View style={styles.streamerHeader}>
        <View style={styles.streamerInfo}>
          <Text style={styles.streamerName}>{follow.streamer.displayName ?? follow.streamer.id}</Text>
          <View style={styles.liveBadges}>
            <Badge label="LIVE" variant="error" size="small" />
            {platformBadge && <Badge label={primaryStatus?.platform ?? 'LIVE'} platform={platformBadge} size="small" />}
          </View>
        </View>
        <Text style={styles.liveTitle}>{liveTitle}</Text>
        {relativeStarted && <Text style={styles.liveMeta}>{`Started ${relativeStarted}`}</Text>}
      </View>
      <Button title="Watch Now" variant="primary" size="small" onPress={() => {}} />
    </Card>
  );
};

const FollowCard = ({ follow }: { follow: Follow }) => (
  <Card style={styles.streamerCard}>
    <View style={styles.streamerInfo}>
      <Text style={styles.streamerName}>{follow.streamer.displayName}</Text>
      <Text style={styles.streamerBio} numberOfLines={2}>
        {follow.streamer.streamerProfile?.bio || 'No bio available'}
      </Text>
    </View>
  </Card>
);

const FilterChip = ({
  label,
  icon,
  selected,
  onPress,
}: {
  label: string;
  icon: IoniconName;
  selected: boolean;
  onPress: () => void;
}) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="button"
    style={[styles.filterChip, selected && styles.filterChipSelected]}
  >
    <Ionicons
      name={icon}
      size={16}
      color={selected ? theme.colors.background : theme.colors.textSecondary}
    />
    <Text style={[styles.filterChipLabel, selected && styles.filterChipLabelSelected]}>{label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  headerContainer: {
    gap: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  header: {
    gap: theme.spacing.xs,
  },
  greeting: {
    ...theme.typography.h2,
  },
  subtitle: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
  },
  section: {
    gap: theme.spacing.md,
  },
  sectionTitle: {
    ...theme.typography.h3,
  },
  sectionSubtitle: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
  },
  statsCard: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.lg,
  },
  statItem: {
    flexBasis: '45%',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  statValue: {
    ...theme.typography.h3,
    color: theme.colors.primary,
  },
  statLabel: {
    ...theme.typography.caption,
    textAlign: 'center',
  },
  streamerCard: {
    gap: theme.spacing.md,
  },
  streamerHeader: {
    gap: theme.spacing.sm,
  },
  streamerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  liveBadges: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  streamerName: {
    flex: 1,
    ...theme.typography.h4,
  },
  liveTitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  liveMeta: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
  },
  streamerBio: {
    flex: 1,
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
  },
  emptyCard: {
    padding: theme.spacing.lg,
  },
  trendingIntro: {
    gap: theme.spacing.xs,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  filterChipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterChipLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  filterChipLabelSelected: {
    color: theme.colors.background,
  },
  skeletonContainer: {
    gap: theme.spacing.md,
  },
  footerLoader: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  footerMessage: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  footerText: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
  },
  footerSpacer: {
    paddingVertical: theme.spacing.lg,
  },
});