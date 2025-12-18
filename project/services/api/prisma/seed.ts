import * as bcrypt from 'bcrypt';
import { ContentType, MiniGameType, Platform, PrismaClient, Role } from '../src/prisma-client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Create demo streamer
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const streamer = await prisma.user.upsert({
    where: { email: 'streamer@example.com' },
    update: {
      username: 'demostreamer',
      passwordHash: hashedPassword,
    },
    create: {
      email: 'streamer@example.com',
      username: 'demostreamer',
      passwordHash: hashedPassword,
      role: Role.STREAMER,
      displayName: 'Demo Streamer',
      avatarUrl: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200',
      streamerProfile: {
        create: {
          bio: 'Professional streamer and content creator',
          isPublic: true,
          links: {
            website: 'https://demostreamer.com',
            discord: 'https://discord.gg/demostreamer'
          }
        }
      }
    },
    include: {
      streamerProfile: true
    }
  });

  // Create demo viewers
  const viewers = [];
  for (let i = 1; i <= 50; i++) {
    const viewer = await prisma.user.upsert({
      where: { email: `viewer${i}@example.com` },
      update: {
        username: `viewer${i}`,
        passwordHash: hashedPassword,
      },
      create: {
        email: `viewer${i}@example.com`,
        username: `viewer${i}`,
        passwordHash: hashedPassword,
        role: Role.VIEWER,
        displayName: `Demo Viewer ${i}`,
        avatarUrl: `https://images.pexels.com/photos/${220450 + i}/pexels-photo-${220450 + i}.jpeg?auto=compress&cs=tinysrgb&w=200`,
        viewerProfile: {
          create: {
            preferences: {
              notifications: true,
              theme: 'dark'
            }
          }
        }
      },
      include: {
        viewerProfile: true
      }
    });
    viewers.push(viewer);
  }

  // Create follows
  for (let i = 0; i < 30; i++) {
    const viewer = viewers[i];
    await prisma.follow.upsert({
      where: {
        viewerId_streamerId: {
          viewerId: viewer.id,
          streamerId: streamer.id
        }
      },
      update: {},
      create: {
        viewerId: viewer.id,
        streamerId: streamer.id,
        notificationsEnabled: true
      }
    });
  }

  // Create linked platform accounts for streamer
  const platforms = [Platform.TWITCH, Platform.YOUTUBE, Platform.KICK];
  for (const platform of platforms) {
    await prisma.linkedPlatformAccount.upsert({
      where: {
        userId_platform: {
          userId: streamer.id,
          platform
        }
      },
      update: {},
      create: {
        userId: streamer.id,
        platform,
        platformUserId: `demo_${platform.toLowerCase()}_id`,
        handle: `demo_streamer_${platform.toLowerCase()}`,
        accessToken: 'encrypted_demo_token',
        refreshToken: 'encrypted_demo_refresh_token',
        scopes: ['read']
      }
    });
  }

  // Create content items
  const contentTypes = [ContentType.VIDEO, ContentType.CLIP, ContentType.LIVE];
  for (let i = 0; i < 20; i++) {
    const platform = platforms[i % platforms.length];
    const type = contentTypes[i % contentTypes.length];
    
    await prisma.contentItem.create({
      data: {
        streamerId: streamer.id,
        platform,
        platformContentId: `content_${i}`,
        type,
        title: `Demo ${type} ${i + 1}`,
        url: `https://${platform.toLowerCase()}.com/demo_content_${i}`,
        thumbnail: `https://images.pexels.com/photos/${1000000 + i}/pexels-photo-${1000000 + i}.jpeg?auto=compress&cs=tinysrgb&w=400`,
        publishedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        statsCached: {
          views: Math.floor(Math.random() * 10000),
          likes: Math.floor(Math.random() * 1000),
          comments: Math.floor(Math.random() * 500)
        }
      }
    });
  }

  // Create stats snapshots for the last 14 days
  const now = new Date();
  for (let i = 0; i < 14; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    for (const platform of platforms) {
      await prisma.statsSnapshot.upsert({
        where: {
          streamerId_platform_date: {
            streamerId: streamer.id,
            platform,
            date
          }
        },
        update: {},
        create: {
          streamerId: streamer.id,
          platform,
          date,
          followers: 10000 + i * 10,
          views: 50000 + i * 100,
          likes: 5000 + i * 5,
          comments: 1000 + i * 2,
          shares: 500 + i
        }
      });
    }
  }

  // Create live statuses
  for (const platform of platforms) {
    const isLive = true;
    const startedAt = new Date(Date.now() - Math.floor(Math.random() * 60) * 60 * 1000);
    const viewerCount = Math.floor(Math.random() * 8500) + 150;
    const title = `${platform.toString().toLowerCase()} community hangout`;
    const game = platform === Platform.TWITCH ? 'Just Chatting' : platform === Platform.KICK ? 'Apex Legends' : 'Variety';
    const thumbnailUrl = `https://images.pexels.com/photos/${300000 + Math.floor(Math.random() * 500)}?auto=compress&cs=tinysrgb&w=640`;

    await prisma.liveStatus.upsert({
      where: {
        streamerId_platform: {
          streamerId: streamer.id,
          platform
        }
      },
      update: {
        isLive,
        startedAt,
        title,
        game,
        viewerCount,
        thumbnailUrl
      },
      create: {
        streamerId: streamer.id,
        platform,
        isLive,
        startedAt,
        title,
        game,
        viewerCount,
        thumbnailUrl
      }
    });
  }

  // Create rewards
  const rewards = [
    {
      title: 'Shoutout',
      description: 'Get a shoutout on stream',
      costPoints: 100
    },
    {
      title: 'Song Request',
      description: 'Request a song to be played',
      costPoints: 50
    },
    {
      title: 'Discord VIP',
      description: 'Get VIP role in Discord server',
      costPoints: 500
    },
    {
      title: 'Game Choice',
      description: 'Choose the next game to play',
      costPoints: 1000
    }
  ];

  const createdRewards = [];
  for (const reward of rewards) {
    const createdReward = await prisma.reward.create({
      data: {
        ...reward,
        streamerId: streamer.id
      }
    });
    createdRewards.push(createdReward);
  }

  // Create point transactions and redemptions
  for (let i = 0; i < 20; i++) {
    const viewer = viewers[i];
    
    // Give points to viewer
    await prisma.pointsTransaction.create({
      data: {
        userId: viewer.id,
        streamerId: streamer.id,
        delta: Math.floor(Math.random() * 100) + 10,
        reason: 'Watching stream',
        metadata: { sessionTime: '30 minutes' }
      }
    });

    // Create some redemptions
    if (i < 10) {
      const reward = createdRewards[i % createdRewards.length];
      await prisma.redemption.create({
        data: {
          rewardId: reward.id,
          viewerId: viewer.id,
          streamerId: streamer.id,
          status: i < 5 ? 'FULFILLED' : 'PENDING',
          fulfilledAt: i < 5 ? new Date() : null
        }
      });
    }
  }

  // Create polls
  const poll = await prisma.poll.create({
    data: {
      streamerId: streamer.id,
      question: 'What game should we play next?',
      status: 'OPEN',
      endsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      options: {
        create: [
          { label: 'Minecraft', votes: 15 },
          { label: 'Fortnite', votes: 8 },
          { label: 'Among Us', votes: 12 },
          { label: 'Valorant', votes: 5 }
        ]
      }
    },
    include: {
      options: true
    }
  });

  // Create poll votes
  const pollOptions = (poll.options ?? []) as Array<{ id: string }>;

  for (let i = 0; i < 20; i++) {
    const viewer = viewers[i];
    if (!viewer || pollOptions.length === 0) {
      continue;
    }
    const option = pollOptions[i % pollOptions.length];
    
    await prisma.pollVote.create({
      data: {
        pollId: poll.id,
        optionId: option.id,
        userId: viewer.id
      }
    });
  }

  // Create mini game
  await prisma.miniGame.create({
    data: {
      streamerId: streamer.id,
      type: MiniGameType.TRIVIA,
      state: {
        question: 'What year was Minecraft released?',
        options: ['2009', '2010', '2011', '2012'],
        correctAnswer: 1,
        timeLimit: 30
      },
      endsAt: new Date(Date.now() + 60 * 60 * 1000)
    }
  });

  // Create products
  const products = [
    {
      title: '1-on-1 Gaming Coaching',
      description: 'Personal gaming session with tips and strategies',
      price: 4999 // $49.99
    },
    {
      title: 'VIP Stream Access',
      description: 'Access to exclusive VIP-only streams',
      price: 999 // $9.99
    },
    {
      title: 'Custom Discord Role',
      description: 'Get a personalized role in the Discord server',
      price: 1999 // $19.99
    }
  ];

  const createdProducts = [];
  for (const product of products) {
    const createdProduct = await prisma.product.create({
      data: {
        ...product,
        streamerId: streamer.id
      }
    });
    createdProducts.push(createdProduct);
  }

  // Create sample orders
  for (let i = 0; i < 5; i++) {
    const viewer = viewers[i];
    const product = createdProducts[i % createdProducts.length];
    
    await prisma.order.create({
      data: {
        streamerId: streamer.id,
        buyerId: viewer.id,
        productId: product.id,
        amount: product.price,
        currency: 'usd',
        status: i < 3 ? 'COMPLETED' : 'PENDING',
        completedAt: i < 3 ? new Date() : null
      }
    });
  }

  console.log('Seed completed successfully!');
  console.log(`Created streamer: ${streamer.email}`);
  console.log(`Created ${viewers.length} viewers`);
  console.log(`Created ${createdRewards.length} rewards`);
  console.log(`Created ${createdProducts.length} products`);
  console.log('Demo data is ready for development and testing!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });