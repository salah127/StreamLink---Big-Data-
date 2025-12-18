import { Ionicons } from '@expo/vector-icons';
import { Badge, Button, Card, EmptyState, theme } from '@streamlink/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toBadgePlatform, type PlatformId } from '../../../src/constants/platforms';
import { api } from '../../../src/services/api';
import type { Follow, StreamerProfile } from '../../../src/types/api';

import type { DiscoverStreamer } from './index';

type DisplayStreamer = {
  id: string;
  displayName: string;
  bio?: string;
  followers: number;
  isLive?: boolean;
  platforms: PlatformId[];
  category?: string;
};

const parseDiscoverStreamer = (value?: string): DiscoverStreamer | null => {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(decodeURIComponent(value)) as DiscoverStreamer;
  } catch (error) {
    console.warn('[StreamerProfile] Failed to parse streamer data', error);
    return null;
  }
};

const mapProfileToDisplay = (
  profile: StreamerProfile | undefined,
  fallback: DiscoverStreamer | null,
): DisplayStreamer | null => {
  if (!profile && !fallback) {
    return null;
  }

  const platforms = profile?.platforms?.map((platform) => platform.platform.toUpperCase() as PlatformId) ?? fallback?.platforms ?? [];

  return {
    id: profile?.id ?? fallback?.id ?? '',
    displayName: profile?.displayName ?? fallback?.displayName ?? 'Unknown Streamer',
    bio: profile?.bio ?? fallback?.bio,
    followers: profile?.stats?.followers ?? fallback?.followers ?? 0,
    isLive: profile?.isLive ?? fallback?.isLive ?? false,
    platforms,
    category: fallback?.category,
  };
};

export default function StreamerProfileScreen() {
  const params = useLocalSearchParams<{ streamerId?: string; data?: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const streamerId = typeof params.streamerId === 'string' ? params.streamerId : '';
  const fallbackStreamer = useMemo(() => {
    const cachedStreamers = queryClient.getQueryData<DiscoverStreamer[]>(['discover-streamers']);
    return cachedStreamers?.find((item) => item.id === streamerId) ?? parseDiscoverStreamer(params.data);
  }, [params.data, queryClient, streamerId]);

  const { data: profileData, isLoading: isLoadingProfile } = useQuery<StreamerProfile | undefined>({
    queryKey: ['streamer-profile', streamerId],
    queryFn: () => api.getStreamerProfile(streamerId),
    enabled: Boolean(streamerId),
    staleTime: 30_000,
  });

  const { data: followingData } = useQuery<Follow[]>({
    queryKey: ['following'],
    queryFn: () => api.getFollowing(),
  });

  const initialDisplay = useMemo(() => mapProfileToDisplay(profileData, fallbackStreamer), [profileData, fallbackStreamer]);

  const [displayStreamer, setDisplayStreamer] = useState<DisplayStreamer | null>(initialDisplay);
  const [isFollowed, setIsFollowed] = useState<boolean>(() => {
    if (!streamerId) {
      return false;
    }
    return Boolean(followingData?.some((item) => item.streamer.id === streamerId));
  });

  useEffect(() => {
    const combined = mapProfileToDisplay(profileData, fallbackStreamer);
    if (!combined) {
      return;
    }
    setDisplayStreamer((current) => {
      if (!current) {
        return combined;
      }
      return {
        ...combined,
        followers: current.followers,
      };
    });
  }, [fallbackStreamer, profileData]);

  useEffect(() => {
    if (!streamerId) {
      return;
    }
    setIsFollowed(Boolean(followingData?.some((item) => item.streamer.id === streamerId)));
  }, [followingData, streamerId]);

  const followMutation = useMutation<
    unknown,
    Error,
    { streamerId: string; shouldFollow: boolean }
  >({
    mutationFn: async ({ streamerId: id, shouldFollow }) => {
      if (shouldFollow) {
        return api.followStreamer(id);
      }
      return api.unfollowStreamer(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['following'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });

  const handleToggleFollow = () => {
    if (!streamerId || !displayStreamer) {
      return;
    }

    const previousIsFollowed = isFollowed;
    const previousFollowers = displayStreamer.followers;
    const previousCache = queryClient
      .getQueryData<DiscoverStreamer[]>(['discover-streamers'])
      ?.map((item) => ({ ...item }));

    const delta = previousIsFollowed ? -1 : 1;
    setIsFollowed(!previousIsFollowed);
    setDisplayStreamer((current) =>
      current ? { ...current, followers: Math.max(0, current.followers + delta) } : current,
    );

    queryClient.setQueryData<DiscoverStreamer[]>(['discover-streamers'], (existing = []) =>
      existing.map((item) =>
        item.id === streamerId
          ? { ...item, followers: Math.max(0, item.followers + delta) }
          : item
      ),
    );

    followMutation.mutate(
      { streamerId, shouldFollow: !previousIsFollowed },
      {
        onError: (error) => {
          setIsFollowed(previousIsFollowed);
          setDisplayStreamer((current) =>
            current ? { ...current, followers: previousFollowers } : current,
          );
          if (previousCache) {
            queryClient.setQueryData(['discover-streamers'], previousCache);
          }
          const message = error instanceof Error ? error.message : 'Unable to update follow status. Please try again.';
          Alert.alert('Follow failed', message);
        },
      },
    );
  };

  if (!streamerId) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          title="Missing streamer"
          description="We couldn't find the streamer you're looking for."
          icon={<Ionicons name="alert-circle-outline" size={48} color={theme.colors.textMuted} />}
          action={
            <Button
              title="Go back"
              variant="outline"
              onPress={() => router.back()}
            />
          }
        />
      </SafeAreaView>
    );
  }

  if (!displayStreamer && isLoadingProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!displayStreamer) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          title="No profile data"
          description="We couldn't load details for this streamer."
          icon={<Ionicons name="person-circle-outline" size={48} color={theme.colors.textMuted} />}
          action={
            <Button
              title="Go back"
              variant="outline"
              onPress={() => router.back()}
            />
          }
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.headerCard} variant="elevated">
          <View style={styles.headerTop}>
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={48} color={theme.colors.primary} />
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.displayName}>{displayStreamer.displayName}</Text>
              {displayStreamer.category && (
                <Badge label={displayStreamer.category} variant="secondary" size="small" />
              )}
            </View>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="people" size={20} color={theme.colors.primary} />
              <Text style={styles.metaValue}>{displayStreamer.followers.toLocaleString()}</Text>
              <Text style={styles.metaLabel}>Followers</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons
                name={displayStreamer.isLive ? 'radio-button-on' : 'radio-button-off'}
                size={20}
                color={displayStreamer.isLive ? theme.colors.error : theme.colors.textSecondary}
              />
              <Text style={styles.metaValue}>{displayStreamer.isLive ? 'Live' : 'Offline'}</Text>
              <Text style={styles.metaLabel}>Status</Text>
            </View>
          </View>

          <Button
            title={isFollowed ? 'Unfollow' : 'Follow'}
            variant={isFollowed ? 'secondary' : 'primary'}
            onPress={handleToggleFollow}
            loading={followMutation.isPending}
            disabled={followMutation.isPending}
            style={styles.followButton}
          />
        </Card>

        {(displayStreamer.bio || profileData?.bio) && (
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.sectionBody}>{displayStreamer.bio || profileData?.bio}</Text>
          </Card>
        )}

        {displayStreamer.platforms.length > 0 && (
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Platforms</Text>
            <View style={styles.platformsRow}>
              {displayStreamer.platforms.map((platform) => (
                <Badge
                  key={platform}
                  label={platform}
                  platform={toBadgePlatform(platform)}
                  size="small"
                  style={styles.platformBadge}
                />
              ))}
            </View>
          </Card>
        )}
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
  headerCard: {
    gap: theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  displayName: {
    ...theme.typography.h3,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  followButton: {
    alignSelf: 'stretch',
  },
  sectionCard: {
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    ...theme.typography.h4,
  },
  sectionBody: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  platformsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  platformBadge: {
    marginRight: theme.spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
});
