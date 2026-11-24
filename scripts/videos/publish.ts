// scripts/videos/publish.ts
//
// Uploads the prepared clips (../video-staging, built by the collector) to
// Cloudflare R2 and adds them to the videos table. Each video gets a small
// reward and its own budget, and its description credits the source/licence.
//
//   dry run:   npx dotenv -e .env.production -- tsx scripts/videos/publish.ts
//   publish:   ... --apply
//   also hide the old seeded videos whose files are missing:  ... --retire-broken
//   options:   --dir=/path/to/video-staging  --reward=15  --budget=5000  --limit=120
//
// Safe to re-run: clips already in the table (same R2 key) are skipped.
import fs from 'node:fs';
import path from 'node:path';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { eq, inArray } from 'drizzle-orm';
import { db } from '../../src/lib/db';
import { videos, type VideoCategory } from '../../src/lib/db/schema';
import { BUCKET, getR2PublicUrl, isR2Configured, r2 } from '../../src/utils/r2/config';

interface Clip {
  slug: string;
  title: string;
  description: string;
  category: string;
  durationSeconds: number;
  source: string;
  sourceUrl: string;
  license: string;
  author?: string;
  credit?: string;
}

const arg = (name: string, fallback: string) =>
  process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=').slice(1).join('=') ?? fallback;

const CATEGORIES = new Set<VideoCategory>(['BUSINESS', 'FINANCE', 'TECH', 'EDUCATION', 'ENTERTAINMENT', 'LIFESTYLE', 'GAMING', 'SPORTS', 'MUSIC', 'NEWS', 'TUTORIAL']);

async function put(key: string, file: string, contentType: string) {
  await r2.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: fs.readFileSync(file),
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  );
}

async function main() {
  const apply = process.argv.includes('--apply');
  const dir = arg('dir', path.resolve(process.cwd(), '../video-staging'));
  const reward = Number(arg('reward', '15'));
  const budget = Number(arg('budget', '5000'));
  const limit = Number(arg('limit', '1000'));

  const manifest: Clip[] = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
  console.log(`${apply ? 'APPLYING' : 'DRY RUN (add --apply)'} · ${manifest.length} clips in ${dir} · ${reward} RWF each · budget ${budget} RWF per video`);
  if (apply && !isR2Configured()) throw new Error('R2 is not configured (R2_* env vars).');

  let added = 0;
  let skipped = 0;
  for (const clip of manifest.slice(0, limit)) {
    const mp4 = path.join(dir, `${clip.slug}.mp4`);
    const jpg = path.join(dir, `${clip.slug}.jpg`);
    if (!fs.existsSync(mp4) || !fs.existsSync(jpg)) {
      console.log(`missing ${clip.slug} (files not found)`);
      continue;
    }
    const videoKey = `videos/shorts/${clip.slug}.mp4`;
    const thumbKey = `videos/shorts/${clip.slug}.jpg`;
    const exists = await db.query.videos.findFirst({ where: eq(videos.videoKey, videoKey) });
    if (exists) {
      skipped += 1;
      continue;
    }
    const category = (CATEGORIES.has(clip.category as VideoCategory) ? clip.category : 'EDUCATION') as VideoCategory;
    const credit = clip.credit || clip.author || clip.source;
    const description = `${clip.description}\n\nCredit: ${credit} · ${clip.license} · ${clip.source}`.slice(0, 1000);
    added += 1;
    console.log(`add  ${String(clip.durationSeconds).padStart(2)}s  ${category.padEnd(13)} ${clip.title.slice(0, 60)}`);
    if (!apply) continue;

    await put(videoKey, mp4, 'video/mp4');
    await put(thumbKey, jpg, 'image/jpeg');
    const now = new Date().toISOString();
    await db.insert(videos).values({
      title: clip.title.slice(0, 120),
      description,
      category,
      duration: Math.round(clip.durationSeconds),
      videoUrl: getR2PublicUrl(videoKey),
      thumbnailUrl: getR2PublicUrl(thumbKey),
      videoKey,
      thumbnailKey: thumbKey,
      rewardAmount: reward,
      rewardBudget: budget,
      rewardSpent: 0,
      isSponsored: false,
      status: 'ACTIVE',
      publishedAt: now,
    });
  }

  let retired = 0;
  if (process.argv.includes('--retire-broken')) {
    // Old seeded rows that point at files which were never uploaded.
    const active = await db.query.videos.findMany({ where: eq(videos.status, 'ACTIVE') });
    const broken: string[] = [];
    for (const v of active) {
      if (!v.videoUrl || v.videoKey?.startsWith('videos/shorts/')) continue;
      const res = await fetch(v.videoUrl, { method: 'HEAD' }).catch(() => null);
      if (!res || res.status >= 400) {
        broken.push(v.id);
        console.log(`retire  ${v.title.slice(0, 60)} (${res?.status ?? 'unreachable'})`);
      }
    }
    retired = broken.length;
    if (apply && broken.length) {
      await db.update(videos).set({ status: 'INACTIVE', updatedAt: new Date().toISOString() }).where(inArray(videos.id, broken));
    }
  }

  console.log(`${added} to add, ${skipped} already there, ${retired} broken to retire.${apply ? '' : ' Nothing written.'}`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
