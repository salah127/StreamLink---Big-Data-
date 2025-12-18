import { Ionicons } from '@expo/vector-icons';
import { Badge, Button, Card, EmptyState, Modal, theme } from '@streamlink/ui';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toBadgePlatform, type PlatformId } from '../../../src/constants/platforms';

const MOCK_LIVE_DATA = {
  polls: [
    {
      id: '1',
      question: 'What game should we play next?',
      status: 'OPEN' as const,
      options: [
        { id: '1', label: 'Minecraft', votes: 15 },
        { id: '2', label: 'Fortnite', votes: 8 },
        { id: '3', label: 'Among Us', votes: 12 },
        { id: '4', label: 'Valorant', votes: 5 },
      ],
      createdAt: new Date().toISOString(),
      endsAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
  pointsBalance: 1_250,
  activeStreamers: [
    {
      id: '1',
      displayName: 'GamerPro123',
      platform: 'TWITCH' as PlatformId,
      title: 'Ranked Valorant Grind!',
      viewers: 1_420,
      thumbnail: 'https://images.pexels.com/photos/907221/pexels-photo-907221.jpeg?auto=compress&cs=tinysrgb&w=640',
    },
    {
      id: '2',
      displayName: 'MusicMaven',
      platform: 'YOUTUBE' as PlatformId,
      title: 'Live Music Session',
      viewers: 850,
      thumbnail: 'https://images.pexels.com/photos/164772/pexels-photo-164772.jpeg?auto=compress&cs=tinysrgb&w=640',
    },
  ],
};

export type LiveStreamer = typeof MOCK_LIVE_DATA.activeStreamers[number];
type LivePoll = typeof MOCK_LIVE_DATA.polls[number];

export default function LiveScreen() {
  const router = useRouter();
  const [selectedPoll, setSelectedPoll] = useState<string | null>(null);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [joiningStreamId, setJoiningStreamId] = useState<string | null>(null);

  const handleVote = (pollId: string, optionId: string) => {
    console.log('Voting in poll:', pollId, 'option:', optionId);
    setSelectedPoll(null);
  };

  const handleRedeem = (rewardId: string) => {
    console.log('Redeeming reward:', rewardId);
    setShowRedeemModal(false);
  };

  const handleJoinStream = (streamer: LiveStreamer) => {
    setJoiningStreamId(streamer.id);
    router.push({
      pathname: '/(tabs)/live/[streamerId]',
      params: {
        streamerId: streamer.id,
        data: encodeURIComponent(JSON.stringify(streamer)),
      },
    } as never);
  };

  const polls = useMemo(() => MOCK_LIVE_DATA.polls, []);
  const activeStreamers = useMemo(() => MOCK_LIVE_DATA.activeStreamers, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Live Interactions</Text>
          <Text style={styles.subtitle}>Engage with your favorite streamers</Text>
        </View>

        <Card style={styles.pointsCard} variant="elevated">
          <View style={styles.pointsHeader}>
            <Text style={styles.pointsTitle}>Your Points</Text>
            <Text style={styles.pointsBalance}>{MOCK_LIVE_DATA.pointsBalance.toLocaleString()}</Text>
          </View>
          <Button
            title="Redeem Rewards"
            variant="primary"
            size="small"
            onPress={() => setShowRedeemModal(true)}
          />
        </Card>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Live Now</Text>
          {activeStreamers.map((streamer) => (
            <LiveStreamerCard
              key={streamer.id}
              streamer={streamer}
              onJoin={() => handleJoinStream(streamer)}
              isJoining={joiningStreamId === streamer.id}
            />
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Polls</Text>
          {polls.map((poll) => (
            <PollCard
              key={poll.id}
              poll={poll}
              onVote={() => setSelectedPoll(poll.id)}
            />
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mini Games</Text>
          <Card style={styles.emptyCard}>
            <EmptyState
              title="No active games"
              description="Check back later for trivia and prediction games"
              icon={<Ionicons name="game-controller-outline" size={48} color={theme.colors.textMuted} />}
            />
          </Card>
        </View>
      </ScrollView>

      <Modal visible={selectedPoll !== null} onClose={() => setSelectedPoll(null)}>
        {selectedPoll && (
          <PollVotingModal
            poll={polls.find((p) => p.id === selectedPoll)!}
            onVote={handleVote}
            onClose={() => setSelectedPoll(null)}
          />
        )}
      </Modal>

      <Modal visible={showRedeemModal} onClose={() => setShowRedeemModal(false)}>
        <RedeemModal
          pointsBalance={MOCK_LIVE_DATA.pointsBalance}
          onRedeem={handleRedeem}
          onClose={() => setShowRedeemModal(false)}
        />
      </Modal>
    </SafeAreaView>
  );
}

const LiveStreamerCard = ({
  streamer,
  onJoin,
  isJoining,
}: {
  streamer: LiveStreamer;
  onJoin: () => void;
  isJoining: boolean;
}) => (
  <Card style={styles.streamerCard}>
    <View style={styles.streamerHeader}>
      <View style={styles.streamerInfo}>
        <Text style={styles.streamerName}>{streamer.displayName}</Text>
        <Text style={styles.streamerTitle}>{streamer.title}</Text>
        <View style={styles.streamerMeta}>
          <Badge label="LIVE" variant="error" size="small" />
          <Badge label={streamer.platform} platform={toBadgePlatform(streamer.platform)} size="small" />
          <Text style={styles.viewerCount}>{streamer.viewers.toLocaleString()} viewers</Text>
        </View>
      </View>
    </View>
    <Button
      title="Join Stream"
      variant="primary"
      size="small"
      onPress={onJoin}
      loading={isJoining}
      disabled={isJoining}
    />
  </Card>
);

const PollCard = ({ poll, onVote }: { poll: LivePoll; onVote: () => void }) => (
  <Card style={styles.pollCard}>
    <Text style={styles.pollQuestion}>{poll.question}</Text>
    <View style={styles.pollOptions}>
      {poll.options.map((option) => (
        <View key={option.id} style={styles.pollOption}>
          <Text style={styles.pollOptionLabel}>{option.label}</Text>
          <Text style={styles.pollOptionVotes}>{option.votes} votes</Text>
        </View>
      ))}
    </View>
    <Button title="Vote" variant="outline" size="small" onPress={onVote} style={styles.voteButton} />
  </Card>
);

const PollVotingModal = ({ poll, onVote, onClose }: { poll: LivePoll; onVote: (pollId: string, optionId: string) => void; onClose: () => void }) => (
  <View>
    <Text style={styles.modalTitle}>{poll.question}</Text>
    <View style={styles.pollVotingOptions}>
      {poll.options.map((option) => (
        <Button
          key={option.id}
          title={`${option.label} (${option.votes} votes)`}
          variant="outline"
          onPress={() => onVote(poll.id, option.id)}
          style={styles.voteOptionButton}
        />
      ))}
    </View>
    <Button title="Cancel" variant="ghost" onPress={onClose} />
  </View>
);

const RedeemModal = ({
  pointsBalance,
  onRedeem,
  onClose,
}: {
  pointsBalance: number;
  onRedeem: (rewardId: string) => void;
  onClose: () => void;
}) => {
  const mockRewards: Array<{ id: string; title: string; costPoints: number; description: string }> = [
    { id: '1', title: 'Shoutout', costPoints: 100, description: 'Get a shoutout on stream' },
    { id: '2', title: 'Song Request', costPoints: 50, description: 'Request a song to be played' },
    { id: '3', title: 'Discord VIP', costPoints: 500, description: 'Get VIP role in Discord' },
  ];

  return (
    <View>
      <Text style={styles.modalTitle}>Redeem Rewards</Text>
      <Text style={styles.pointsBalanceText}>Available Points: {pointsBalance.toLocaleString()}</Text>
      <View style={styles.rewardsContainer}>
        {mockRewards.map((reward) => (
          <Card key={reward.id} style={styles.rewardCard}>
            <Text style={styles.rewardTitle}>{reward.title}</Text>
            <Text style={styles.rewardDescription}>{reward.description}</Text>
            <Text style={styles.rewardCost}>{reward.costPoints} points</Text>
            <Button
              title="Redeem"
              variant={pointsBalance >= reward.costPoints ? 'primary' : 'secondary'}
              disabled={pointsBalance < reward.costPoints}
              size="small"
              onPress={() => onRedeem(reward.id)}
            />
          </Card>
        ))}
      </View>
      <Button title="Close" variant="ghost" onPress={onClose} />
    </View>
  );
};

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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  pointsTitle: {
    ...theme.typography.h4,
  },
  pointsBalance: {
    ...theme.typography.h3,
    color: theme.colors.primary,
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
  streamerName: {
    ...theme.typography.h4,
    marginBottom: theme.spacing.xs,
  },
  streamerTitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  streamerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  viewerCount: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
  },
  pollCard: {
    marginBottom: theme.spacing.md,
  },
  pollQuestion: {
    ...theme.typography.h4,
    marginBottom: theme.spacing.md,
  },
  pollOptions: {
    marginBottom: theme.spacing.md,
  },
  pollOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  pollOptionLabel: {
    ...theme.typography.body,
  },
  pollOptionVotes: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
  },
  voteButton: {
    alignSelf: 'flex-start',
  },
  emptyCard: {
    marginBottom: theme.spacing.md,
  },
  modalTitle: {
    ...theme.typography.h3,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  pollVotingOptions: {
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  voteOptionButton: {
    marginBottom: theme.spacing.sm,
  },
  pointsBalanceText: {
    ...theme.typography.body,
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  rewardsContainer: {
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  rewardCard: {
    padding: theme.spacing.sm,
  },
  rewardTitle: {
    ...theme.typography.h4,
    marginBottom: theme.spacing.xs,
  },
  rewardDescription: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  rewardCost: {
    ...theme.typography.body,
    color: theme.colors.primary,
    fontWeight: '600',
  },
});
