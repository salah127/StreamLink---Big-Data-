import { Ionicons } from '@expo/vector-icons';
import { Badge, Button, Card, EmptyState, theme } from '@streamlink/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toBadgePlatform, type PlatformId } from '../../../src/constants/platforms';
import { api } from '../../../src/services/api';
import type { Follow } from '../../../src/types/api';

type DiscoverCategory = 'Gaming' | 'Art' | 'Music' | 'Education' | 'Lifestyle';

export type DiscoverStreamer = {
  id: string;
  displayName: string;
  bio: string;
  platforms: PlatformId[];
  followers: number;
  isLive: boolean;
  category: DiscoverCategory;
};

// Mock data for demo purposes
const MOCK_STREAMERS: DiscoverStreamer[] = [
  {
    id: '1',
    displayName: 'GamerPro123',
    bio: 'Professional Valorant player and content creator',
    platforms: ['TWITCH', 'YOUTUBE'],
    followers: 15420,
    isLive: true,
    category: 'Gaming',
  },
  {
    id: '2',
    displayName: 'ArtisticSoul',
    bio: 'Digital artist creating amazing illustrations',
    platforms: ['INSTAGRAM', 'TIKTOK'],
    followers: 8930,
    isLive: false,
    category: 'Art',
  },
  {
    id: '3',
    displayName: 'MusicMaven',
    bio: 'Indie musician and producer sharing my journey',
    platforms: ['YOUTUBE', 'INSTAGRAM'],
    followers: 23150,
    isLive: true,
    category: 'Music',
  },
  {
    id: '4',
    displayName: 'CodeWizard',
    bio: 'Software engineer teaching programming concepts',
    platforms: ['TWITCH', 'YOUTUBE'],
    followers: 12300,
    isLive: false,
    category: 'Education',
  },
];

const CATEGORIES: Array<'All' | DiscoverCategory> = ['All', 'Gaming', 'Art', 'Music', 'Education', 'Lifestyle'];

export default function DiscoverScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | DiscoverCategory>('All');
  const [followedStreamers, setFollowedStreamers] = useState<Set<string>>(new Set());

  const { data: streamers = [] } = useQuery<DiscoverStreamer[]>({
    queryKey: ['discover-streamers'],
    queryFn: async () => MOCK_STREAMERS.map((streamer) => ({ ...streamer })),
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const { data: following } = useQuery<Follow[]>({
    queryKey: ['following'],
    queryFn: () => api.getFollowing(),
    staleTime: 15_000,
  });

  useEffect(() => {
    if (!following) {
      return;
    }
    setFollowedStreamers(new Set(following.map((item) => item.streamer.id)));
  }, [following]);

  const followMutation = useMutation<
    unknown,
    Error,
    { streamerId: string; shouldFollow: boolean }
  >({
    mutationFn: async ({ streamerId, shouldFollow }) => {
      if (shouldFollow) {
        return api.followStreamer(streamerId);
      }
      return api.unfollowStreamer(streamerId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['following'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });

  const filteredStreamers = useMemo(() => streamers.filter((streamer) => {
    const matchesSearch = streamer.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         streamer.bio.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || streamer.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }), [streamers, searchQuery, selectedCategory]);

  const handleFollow = (streamerId: string) => {
    const currentlyFollowed = followedStreamers.has(streamerId);
  const previousFollowed = new Set(followedStreamers);
  const previousStreamers = streamers.map((streamer) => ({ ...streamer }));

    const updatedFollowed = new Set(followedStreamers);
    if (currentlyFollowed) {
      updatedFollowed.delete(streamerId);
    } else {
      updatedFollowed.add(streamerId);
    }

    const delta = currentlyFollowed ? -1 : 1;
    setFollowedStreamers(updatedFollowed);
    queryClient.setQueryData<DiscoverStreamer[]>(['discover-streamers'], (existing = []) =>
      existing.map((streamer) =>
        streamer.id === streamerId
          ? { ...streamer, followers: Math.max(0, streamer.followers + delta) }
          : streamer
      )
    );

    followMutation.mutate(
      { streamerId, shouldFollow: !currentlyFollowed },
      {
        onError: (error) => {
          setFollowedStreamers(new Set(previousFollowed));
          queryClient.setQueryData(['discover-streamers'], previousStreamers);
          const message = error instanceof Error ? error.message : 'Unable to update follow status. Please try again.';
          Alert.alert('Follow failed', message);
        },
      },
    );
  };

  const handleViewProfile = (streamerId: string) => {
    const streamer = streamers.find((item) => item.id === streamerId);
    router.push({
      pathname: '/(tabs)/discover/[streamerId]',
      params: {
        streamerId,
        data: streamer ? encodeURIComponent(JSON.stringify(streamer)) : undefined,
      },
    } as never);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Discover</Text>
        <Text style={styles.subtitle}>Find amazing streamers and creators</Text>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons 
            name="search" 
            size={20} 
            color={theme.colors.textMuted} 
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search streamers..."
            placeholderTextColor={theme.colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
        <View style={styles.categories}>
          {CATEGORIES.map((category) => (
            <Button
              key={category}
              title={category}
              variant={selectedCategory === category ? 'primary' : 'outline'}
              size="small"
              onPress={() => setSelectedCategory(category)}
              style={styles.categoryButton}
            />
          ))}
        </View>
      </ScrollView>

      <ScrollView style={styles.streamersContainer}>
        {filteredStreamers.length > 0 ? (
          <View style={styles.streamersList}>
            {filteredStreamers.map((streamer) => (
              <StreamerCard
                key={streamer.id}
                streamer={streamer}
                isFollowed={followedStreamers.has(streamer.id)}
                onFollow={() => handleFollow(streamer.id)}
                isProcessing={followMutation.isPending && followMutation.variables?.streamerId === streamer.id}
                onViewProfile={() => handleViewProfile(streamer.id)}
              />
            ))}
          </View>
        ) : (
          <EmptyState
            title="No streamers found"
            description={
              searchQuery 
                ? `No results for "${searchQuery}"`
                : "No streamers in this category"
            }
            icon={<Ionicons name="person-outline" size={48} color={theme.colors.textMuted} />}
            action={
              <Button
                title="Clear Search"
                variant="outline"
                size="small"
                onPress={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                }}
              />
            }
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const StreamerCard = ({
  streamer,
  isFollowed,
  onFollow,
  isProcessing,
  onViewProfile,
}: {
  streamer: DiscoverStreamer;
  isFollowed: boolean;
  onFollow: () => void;
  isProcessing: boolean;
  onViewProfile: () => void;
}) => (
  <Card style={styles.streamerCard} variant="elevated">
    <View style={styles.streamerHeader}>
      <View style={styles.streamerInfo}>
        <View style={styles.streamerNameRow}>
          <Text style={styles.streamerName}>{streamer.displayName}</Text>
          {streamer.isLive && (
            <Badge label="LIVE" variant="error" size="small" />
          )}
        </View>
        <Text style={styles.streamerBio} numberOfLines={2}>
          {streamer.bio}
        </Text>
        <View style={styles.streamerMeta}>
          <Text style={styles.followersCount}>
            {streamer.followers.toLocaleString()} followers
          </Text>
          <View style={styles.platformsContainer}>
            {streamer.platforms.map((platform) => (
              <Badge
                key={platform}
                label={platform}
                platform={toBadgePlatform(platform)}
                size="small"
                style={styles.platformBadge}
              />
            ))}
          </View>
        </View>
      </View>
    </View>
    
    <View style={styles.streamerActions}>
      <Button
        title={isFollowed ? 'Following' : 'Follow'}
        variant={isFollowed ? 'secondary' : 'primary'}
        size="small"
        onPress={onFollow}
        loading={isProcessing}
        disabled={isProcessing}
        style={styles.followButton}
      />
      <Button
        title="View Profile"
        variant="outline"
        size="small"
        onPress={onViewProfile}
        style={styles.profileButton}
      />
    </View>
  </Card>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
  searchSection: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
  },
  searchIcon: {
    marginRight: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    paddingVertical: theme.spacing.md,
  },
  categoriesContainer: {
    marginBottom: theme.spacing.md,
  },
  categories: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  categoryButton: {
    marginRight: theme.spacing.xs,
  },
  streamersContainer: {
    flex: 1,
  },
  streamersList: {
    padding: theme.spacing.lg,
  },
  streamerCard: {
    marginBottom: theme.spacing.md,
  },
  streamerHeader: {
    marginBottom: theme.spacing.md,
  },
  streamerInfo: {
    flex: 1,
  },
  streamerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  streamerName: {
    ...theme.typography.h4,
    flex: 1,
  },
  streamerBio: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  streamerMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  followersCount: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
  },
  platformsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  platformBadge: {
    marginLeft: theme.spacing.xs,
  },
  streamerActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  followButton: {
    flex: 1,
  },
  profileButton: {
    flex: 1,
  },
});
