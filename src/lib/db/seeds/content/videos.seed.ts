// src/lib/db/seeds/content/videos.seed.ts
import { db } from '@/lib/db';
import {
  videos,
  VideoCategoryEnum,
  VideoDifficultyEnum,
} from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { Video } from '@/lib/db/schema';

export const videoData = [
  // ============================================
  // BUSINESS CATEGORY
  // ============================================
  {
    title: 'How to start an online business in 2025',
    description:
      'Learn the fundamentals of launching a profitable online business.',
    category: VideoCategoryEnum.BUSINESS,
    difficulty: VideoDifficultyEnum.BEGINNER,
    duration: 272,
    videoUrl: 'https://cdn.boostly.buzz/videos/business-101.mp4',
    thumbnailUrl: 'https://cdn.boostly.buzz/thumbnails/business-101.jpg',
    videoKey: 'videos/business-101.mp4',
    thumbnailKey: 'thumbnails/business-101.jpg',
    rewardAmount: 40,
    bonusReward: 100,
    isSponsored: false,
  },
  {
    title: 'Top 10 side hustles for extra income',
    description: 'Explore the best side hustles to boost your income.',
    category: VideoCategoryEnum.BUSINESS,
    difficulty: VideoDifficultyEnum.INTERMEDIATE,
    duration: 428,
    videoUrl: 'https://cdn.boostly.buzz/videos/side-hustles.mp4',
    thumbnailUrl: 'https://cdn.boostly.buzz/thumbnails/side-hustles.jpg',
    videoKey: 'videos/side-hustles.mp4',
    thumbnailKey: 'thumbnails/side-hustles.jpg',
    rewardAmount: 40,
    bonusReward: 120,
    isSponsored: false,
  },

  // ============================================
  // FINANCE CATEGORY
  // ============================================
  {
    title: 'Best ways to earn money online',
    description: 'Discover proven strategies to generate income online.',
    category: VideoCategoryEnum.FINANCE,
    difficulty: VideoDifficultyEnum.BEGINNER,
    duration: 375,
    videoUrl: 'https://cdn.boostly.buzz/videos/earn-online.mp4',
    thumbnailUrl: 'https://cdn.boostly.buzz/thumbnails/earn-online.jpg',
    videoKey: 'videos/earn-online.mp4',
    thumbnailKey: 'thumbnails/earn-online.jpg',
    rewardAmount: 40,
    bonusReward: 100,
    isSponsored: false,
  },
  {
    title: 'Passive income ideas that actually work',
    description:
      'Real-world passive income strategies you can implement today.',
    category: VideoCategoryEnum.FINANCE,
    difficulty: VideoDifficultyEnum.INTERMEDIATE,
    duration: 524,
    videoUrl: 'https://cdn.boostly.buzz/videos/passive-income.mp4',
    thumbnailUrl: 'https://cdn.boostly.buzz/thumbnails/passive-income.jpg',
    videoKey: 'videos/passive-income.mp4',
    thumbnailKey: 'thumbnails/passive-income.jpg',
    rewardAmount: 40,
    bonusReward: 150,
    isSponsored: false,
  },
  {
    title: 'Money saving strategies you can start today',
    description: 'Practical tips to save money and build wealth.',
    category: VideoCategoryEnum.FINANCE,
    difficulty: VideoDifficultyEnum.BEGINNER,
    duration: 320,
    videoUrl: 'https://cdn.boostly.buzz/videos/saving-strategies.mp4',
    thumbnailUrl: 'https://cdn.boostly.buzz/thumbnails/saving-strategies.jpg',
    videoKey: 'videos/saving-strategies.mp4',
    thumbnailKey: 'thumbnails/saving-strategies.jpg',
    rewardAmount: 40,
    bonusReward: 100,
    isSponsored: false,
  },

  // ============================================
  // TECH CATEGORY
  // ============================================
  {
    title: 'Crypto and blockchain explained',
    description: 'Understanding cryptocurrency and blockchain technology.',
    category: VideoCategoryEnum.TECH,
    difficulty: VideoDifficultyEnum.BEGINNER,
    duration: 480,
    videoUrl: 'https://cdn.boostly.buzz/videos/crypto-basics.mp4',
    thumbnailUrl: 'https://cdn.boostly.buzz/thumbnails/crypto-basics.jpg',
    videoKey: 'videos/crypto-basics.mp4',
    thumbnailKey: 'thumbnails/crypto-basics.jpg',
    rewardAmount: 40,
    bonusReward: 150,
    isSponsored: false,
  },

  // ============================================
  // EDUCATION CATEGORY
  // ============================================
  {
    title: 'Digital marketing basics for beginners',
    description: 'Master the fundamentals of digital marketing.',
    category: VideoCategoryEnum.EDUCATION,
    difficulty: VideoDifficultyEnum.BEGINNER,
    duration: 312,
    videoUrl: 'https://cdn.boostly.buzz/videos/digital-marketing.mp4',
    thumbnailUrl: 'https://cdn.boostly.buzz/thumbnails/digital-marketing.jpg',
    videoKey: 'videos/digital-marketing.mp4',
    thumbnailKey: 'thumbnails/digital-marketing.jpg',
    rewardAmount: 40,
    bonusReward: 100,
    isSponsored: false,
  },

  // ============================================
  // LIFESTYLE CATEGORY
  // ============================================
  {
    title: 'Productivity hacks for busy people',
    description: 'Boost your productivity with these proven techniques.',
    category: VideoCategoryEnum.LIFESTYLE,
    difficulty: VideoDifficultyEnum.BEGINNER,
    duration: 245,
    videoUrl: 'https://cdn.boostly.buzz/videos/productivity-hacks.mp4',
    thumbnailUrl: 'https://cdn.boostly.buzz/thumbnails/productivity-hacks.jpg',
    videoKey: 'videos/productivity-hacks.mp4',
    thumbnailKey: 'thumbnails/productivity-hacks.jpg',
    rewardAmount: 40,
    bonusReward: 80,
    isSponsored: false,
  },

  // ============================================
  // GAMING CATEGORY
  // ============================================
  {
    title: 'Top 10 mobile games to earn money',
    description: 'Discover the best mobile games that pay real rewards.',
    category: VideoCategoryEnum.GAMING,
    difficulty: VideoDifficultyEnum.INTERMEDIATE,
    duration: 390,
    videoUrl: 'https://cdn.boostly.buzz/videos/gaming-earn.mp4',
    thumbnailUrl: 'https://cdn.boostly.buzz/thumbnails/gaming-earn.jpg',
    videoKey: 'videos/gaming-earn.mp4',
    thumbnailKey: 'thumbnails/gaming-earn.jpg',
    rewardAmount: 45,
    bonusReward: 120,
    isSponsored: false,
  },

  // ============================================
  // SPORTS CATEGORY
  // ============================================
  {
    title: 'How to bet responsibly and win',
    description: 'Learn responsible betting strategies and maximize your wins.',
    category: VideoCategoryEnum.SPORTS,
    difficulty: VideoDifficultyEnum.INTERMEDIATE,
    duration: 360,
    videoUrl: 'https://cdn.boostly.buzz/videos/sports-betting.mp4',
    thumbnailUrl: 'https://cdn.boostly.buzz/thumbnails/sports-betting.jpg',
    videoKey: 'videos/sports-betting.mp4',
    thumbnailKey: 'thumbnails/sports-betting.jpg',
    rewardAmount: 50,
    bonusReward: 150,
    isSponsored: false,
  },

  // ============================================
  // MUSIC CATEGORY
  // ============================================
  {
    title: 'How to make money from music streaming',
    description: 'Monetize your music and earn from streaming platforms.',
    category: VideoCategoryEnum.MUSIC,
    difficulty: VideoDifficultyEnum.ADVANCED,
    duration: 420,
    videoUrl: 'https://cdn.boostly.buzz/videos/music-monetization.mp4',
    thumbnailUrl: 'https://cdn.boostly.buzz/thumbnails/music-monetization.jpg',
    videoKey: 'videos/music-monetization.mp4',
    thumbnailKey: 'thumbnails/music-monetization.jpg',
    rewardAmount: 55,
    bonusReward: 180,
    isSponsored: false,
  },

  // ============================================
  // NEWS CATEGORY
  // ============================================
  {
    title: 'Rwanda economic growth 2025',
    description:
      'Latest updates on Rwanda economic development and opportunities.',
    category: VideoCategoryEnum.NEWS,
    difficulty: VideoDifficultyEnum.BEGINNER,
    duration: 300,
    videoUrl: 'https://cdn.boostly.buzz/videos/rwanda-economy.mp4',
    thumbnailUrl: 'https://cdn.boostly.buzz/thumbnails/rwanda-economy.jpg',
    videoKey: 'videos/rwanda-economy.mp4',
    thumbnailKey: 'thumbnails/rwanda-economy.jpg',
    rewardAmount: 40,
    bonusReward: 100,
    isSponsored: false,
  },

  // ============================================
  // TUTORIAL CATEGORY
  // ============================================
  {
    title: 'Complete guide to Boostly rewards',
    description: 'Learn how to maximize your earnings on Boostly platform.',
    category: VideoCategoryEnum.TUTORIAL,
    difficulty: VideoDifficultyEnum.BEGINNER,
    duration: 450,
    videoUrl: 'https://cdn.boostly.buzz/videos/boostly-guide.mp4',
    thumbnailUrl: 'https://cdn.boostly.buzz/thumbnails/boostly-guide.jpg',
    videoKey: 'videos/boostly-guide.mp4',
    thumbnailKey: 'thumbnails/boostly-guide.jpg',
    rewardAmount: 60,
    bonusReward: 200,
    isSponsored: false,
  },

  // ============================================
  // ENTERTAINMENT CATEGORY
  // ============================================
  {
    title: 'Best comedy shows to watch in 2025',
    description: 'Top comedy shows that will make you laugh and earn rewards.',
    category: VideoCategoryEnum.ENTERTAINMENT,
    difficulty: VideoDifficultyEnum.BEGINNER,
    duration: 280,
    videoUrl: 'https://cdn.boostly.buzz/videos/comedy-shows.mp4',
    thumbnailUrl: 'https://cdn.boostly.buzz/thumbnails/comedy-shows.jpg',
    videoKey: 'videos/comedy-shows.mp4',
    thumbnailKey: 'thumbnails/comedy-shows.jpg',
    rewardAmount: 35,
    bonusReward: 80,
    isSponsored: false,
  },

  // ============================================
  // SPONSORED VIDEOS
  // ============================================
  {
    title: 'MTN Rwanda: The Future of Mobile Connectivity',
    description:
      'Discover how MTN Rwanda is revolutionizing mobile connectivity.',
    category: VideoCategoryEnum.TECH,
    difficulty: VideoDifficultyEnum.BEGINNER,
    duration: 180,
    videoUrl: 'https://cdn.boostly.buzz/videos/mtn-future.mp4',
    thumbnailUrl: 'https://cdn.boostly.buzz/thumbnails/mtn-future.jpg',
    videoKey: 'videos/mtn-future.mp4',
    thumbnailKey: 'thumbnails/mtn-future.jpg',
    rewardAmount: 50,
    bonusReward: 150,
    isSponsored: true,
    sponsorName: 'MTN Rwanda',
    sponsorLogo: 'https://cdn.boostly.buzz/sponsors/mtn-logo.png',
    sponsorWebsite: 'https://mtn.rw',
    sponsoredUntil: new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000,
    ).toISOString(),
  },
  {
    title: 'Bank of Kigali: Digital Banking Made Simple',
    description: "Learn about BK's innovative digital banking solutions.",
    category: VideoCategoryEnum.FINANCE,
    difficulty: VideoDifficultyEnum.BEGINNER,
    duration: 195,
    videoUrl: 'https://cdn.boostly.buzz/videos/bk-digital.mp4',
    thumbnailUrl: 'https://cdn.boostly.buzz/thumbnails/bk-digital.jpg',
    videoKey: 'videos/bk-digital.mp4',
    thumbnailKey: 'thumbnails/bk-digital.jpg',
    rewardAmount: 50,
    bonusReward: 150,
    isSponsored: true,
    sponsorName: 'Bank of Kigali',
    sponsorLogo: 'https://cdn.boostly.buzz/sponsors/bk-logo.png',
    sponsorWebsite: 'https://bk.rw',
    sponsoredUntil: new Date(
      Date.now() + 45 * 24 * 60 * 60 * 1000,
    ).toISOString(),
  },
  {
    title: 'Carrefour Rwanda: Shopping Made Easy',
    description: 'Discover the best shopping experience with Carrefour Rwanda.',
    category: VideoCategoryEnum.LIFESTYLE,
    difficulty: VideoDifficultyEnum.BEGINNER,
    duration: 160,
    videoUrl: 'https://cdn.boostly.buzz/videos/carrefour-shopping.mp4',
    thumbnailUrl: 'https://cdn.boostly.buzz/thumbnails/carrefour-shopping.jpg',
    videoKey: 'videos/carrefour-shopping.mp4',
    thumbnailKey: 'thumbnails/carrefour-shopping.jpg',
    rewardAmount: 45,
    bonusReward: 120,
    isSponsored: true,
    sponsorName: 'Carrefour Rwanda',
    sponsorLogo: 'https://cdn.boostly.buzz/sponsors/carrefour-logo.png',
    sponsorWebsite: 'https://carrefour.rw',
    sponsoredUntil: new Date(
      Date.now() + 60 * 24 * 60 * 60 * 1000,
    ).toISOString(),
  },
];

export async function seedVideos(): Promise<Video[]> {
  console.log('  📺 Seeding videos...');
  const videoList: Video[] = [];

  for (const vid of videoData) {
    let existing = await db.query.videos.findFirst({
      where: eq(videos.title, vid.title),
    });

    if (!existing) {
      const [newVideo] = await db
        .insert(videos)
        .values({
          ...vid,
          status: 'ACTIVE',
          publishedAt: new Date().toISOString(),
          views: Math.floor(Math.random() * 1000),
          watchTime: Math.floor(Math.random() * 5000),
          likes: Math.floor(Math.random() * 100),
          dislikes: Math.floor(Math.random() * 10),
          shares: Math.floor(Math.random() * 50),
          saves: Math.floor(Math.random() * 30),
          completionRate: Math.floor(Math.random() * 40 + 30), // 30-70%
          createdBy: null, // Will be set by admin
          updatedBy: null,
        })
        .returning();
      videoList.push(newVideo);
      console.log(`    ✅ Created video: ${vid.title} (${vid.category})`);
    } else {
      videoList.push(existing);
      console.log(`    ⚠️ Video exists: ${vid.title}`);
    }
  }

  console.log(
    `📊 Seeded ${videoList.length} videos across ${Object.values(VideoCategoryEnum).length} categories`,
  );
  console.log(
    `- ${videoData.filter((v) => v.isSponsored).length} sponsored videos`,
  );

  return videoList;
}
