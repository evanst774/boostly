#!/usr/bin/env node
// Boostly short-video collector — LOCAL ONLY (no uploads, no database writes).
//
// Collects openly licensed short videos from NASA Image & Video Library,
// NASA Scientific Visualization Studio (SVS) and Wikimedia Commons, trims each to
// its best <= 55 s segment, encodes web-friendly H.264/AAC MP4s, picks a good
// thumbnail and writes manifest.json for a later (separately approved) upload step.
//
// Usage:
//   node scripts/videos/collect.mjs all          # discover + process + manifest + report
//   node scripts/videos/collect.mjs discover     # (re)build the candidate list only
//   node scripts/videos/collect.mjs process      # process candidates (resumable)
//   node scripts/videos/collect.mjs manifest     # rebuild manifest.json + CREDITS.txt + report
//   node scripts/videos/collect.mjs validate     # ffprobe every output again
// Options:
//   --out <dir>        output dir (default ../video-staging next to the repo)
//   --refresh          ignore cached candidates.json and re-query the APIs
//   --only <slug,...>  process just these slugs
//   --retry-failed     retry candidates that failed earlier
//   --jobs <n>         parallel encodes (default 2)
//   --source <s>       only process candidates whose query starts with s (nasa|svs|commons)
//   --minutes <n>      stop starting new clips after n minutes (run again to continue)
//
// Re-running is safe: finished slugs (mp4 + jpg + meta) are skipped.

import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  BLOCK_WORDS,
  COMMONS_QUERIES,
  NASA_QUERIES,
  SVS_QUERIES,
} from './sources.config.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '../..');

// ---------------------------------------------------------------- settings
const args = process.argv.slice(2);
const cmd = args[0] && !args[0].startsWith('--') ? args[0] : 'all';
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  if (i === -1) return def;
  const v = args[i + 1];
  return v && !v.startsWith('--') ? v : true;
};
const OUT = path.resolve(opt('out', path.resolve(REPO, '../video-staging')));
const WORK = path.join(OUT, '.work');
const META_DIR = path.join(WORK, 'meta');
const TMP = path.join(WORK, 'tmp');
const CACHE = path.join(WORK, 'api-cache');
const CANDIDATES = path.join(WORK, 'candidates.json');
const FAILED = path.join(WORK, 'failed.json');
const JOBS = Number(opt('jobs', 2)) || 2;
const DEADLINE = Date.now() + (Number(opt('minutes', 0)) || 1e7) * 60_000;

const UA = 'BoostlyVideoCollector/1.0';
const API_DELAY_MS = 700;
const MAX_CLIP = 55; // seconds kept per clip
const MIN_CLIP = 12; // shortest acceptable output
const MIN_SRC = 14; // shortest source worth considering
const DL_CAP = 150; // seconds of source downloaded for long videos
const MAX_MP4_BYTES = 8 * 1024 * 1024;

const ALLOWED_CATEGORIES = new Set([
  'BUSINESS', 'FINANCE', 'TECH', 'EDUCATION', 'ENTERTAINMENT', 'LIFESTYLE',
  'GAMING', 'SPORTS', 'MUSIC', 'NEWS', 'TUTORIAL',
]); // == VideoCategoryEnum in src/lib/db/schema/videos.ts

for (const d of [OUT, WORK, META_DIR, TMP, CACHE]) fs.mkdirSync(d, { recursive: true });

// ---------------------------------------------------------------- helpers
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const sha = (s) => createHash('sha1').update(String(s)).digest('hex');
const readJson = (p, def) => {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return def; }
};
const writeJson = (p, v) => {
  fs.writeFileSync(`${p}.tmp`, JSON.stringify(v, null, 2));
  fs.renameSync(`${p}.tmp`, p);
};

let lastApiCall = 0;
async function getJson(url, { cache = true, tries = 4 } = {}) {
  const cfile = path.join(CACHE, `${sha(url)}.json`);
  if (cache && fs.existsSync(cfile)) return readJson(cfile);
  for (let attempt = 1; attempt <= tries; attempt++) {
    const wait = lastApiCall + API_DELAY_MS - Date.now();
    if (wait > 0) await sleep(wait);
    lastApiCall = Date.now();
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(45_000),
      });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (cache) writeJson(cfile, data);
      return data;
    } catch (e) {
      if (attempt === tries) {
        log(`  ! GET failed ${url}: ${e.message}`);
        return null;
      }
      await sleep(1500 * attempt ** 2);
    }
  }
  return null;
}

const CHILDREN = new Set();
for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.on(sig, () => { for (const c of CHILDREN) c.kill('SIGKILL'); process.exit(130); });
}

function run(bin, argv, { timeoutMs = 20 * 60_000 } = {}) {
  return new Promise((resolve) => {
    const p = spawn(bin, argv, { stdio: ['ignore', 'pipe', 'pipe'] });
    CHILDREN.add(p);
    p.on('exit', () => CHILDREN.delete(p));
    let out = '';
    let err = '';
    const t = setTimeout(() => p.kill('SIGKILL'), timeoutMs);
    p.stdout.on('data', (d) => { out += d; });
    p.stderr.on('data', (d) => { err += d; if (err.length > 4e6) err = err.slice(-2e6); });
    p.on('close', (code) => { clearTimeout(t); resolve({ code, out, err }); });
  });
}

async function ffprobe(file) {
  const r = await run('ffprobe', ['-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', '-user_agent', UA, file], { timeoutMs: 90_000 });
  if (r.code !== 0) return null;
  try { return JSON.parse(r.out); } catch { return null; }
}

const stripHtml = (s = '') =>
  String(s)
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, ' ')
    .trim();

const BLOCK_RE = new RegExp(
  BLOCK_WORDS.map((w) => {
    const prefix = w.endsWith('*');
    const core = (prefix ? w.slice(0, -1) : w).replace(/[.*+?^${}()|[\]\\&]/g, '\\$&');
    const start = /^\w/.test(core) ? '\\b' : '';
    const end = prefix || !/\w$/.test(core) ? '' : '\\b';
    return `${start}${core}${end}`;
  }).join('|'),
  'i',
);
const blockedBy = (text) => (text.match(BLOCK_RE) || [null])[0];

const latinRatio = (s) => {
  const letters = s.match(/\p{L}/gu) || [];
  if (!letters.length) return 0;
  return letters.filter((c) => /[A-Za-zÀ-ɏ]/.test(c)).length / letters.length;
};

const SMALL = new Set(['a', 'an', 'and', 'as', 'at', 'by', 'for', 'from', 'in', 'into', 'of', 'on', 'or', 'the', 'to', 'with', 'over', 'near']);
function titleCase(s) {
  return s
    .split(' ')
    .map((w, i) => {
      if (!w) return w;
      if (/[A-Z].*[A-Z]|\d/.test(w)) return w; // keep acronyms / mixed (ISS, NASA, 3D)
      const lw = w.toLowerCase();
      if (i > 0 && SMALL.has(lw)) return lw;
      return lw.charAt(0).toUpperCase() + lw.slice(1);
    })
    .join(' ');
}

function cleanTitle(raw) {
  let t = stripHtml(raw)
    .replace(/^File:/i, '')
    .replace(/\.(webm|ogv|ogg|mp4|mov|mpg|mpeg|avi|gif)$/gi, '')
    .replace(/\.(webm|ogv|ogg|mp4|mov|webmhd)\b/gi, '')
    .replace(/[_]+/g, ' ')
    .replace(/\.(gk|wm|hd)\b/gi, '')
    .replace(/\b(VID|IMG|MVI|DSC|DSCF|DJI|GOPR|GH\d|PXL|MOV|MAH|P\d{3,}|CIMG|DCIM)[ _-]?\d+\w*\b/gi, '')
    .replace(/\b(19|20)\d{2}[-_. ]?\d{2}[-_. ]?\d{2}\b/g, '') // dates
    .replace(/\b\d{8,}\b/g, '')
    .replace(/\b[A-Z]{2,5}[-_]?\d{4,}[-\w]*\b/g, '') // NASA-style ids e.g. KSC-20220101
    .replace(/\(\s*\d*\s*\)/g, '')
    .replace(/\[[^\]]*\]/g, '')
    .replace(/\s+-\s*$/g, '')
    .replace(/\s*[-–—|:,]\s*$/g, '')
    .replace(/^\s*[-–—|:,]\s*/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\b(\w+) \1\b/gi, '$1')
    .trim();
  t = t.replace(/\s+(\d{1,3})$/, ''); // trailing counter "… 2"
  if (t === t.toLowerCase() || t === t.toUpperCase()) t = titleCase(t);
  t = t.charAt(0).toUpperCase() + t.slice(1);
  if (t.length > 70) {
    t = t.slice(0, 70);
    t = t.slice(0, t.lastIndexOf(' ')).replace(/[\s,;:–—-]+$/, '');
  }
  return t;
}

function goodTitle(t) {
  const words = t.match(/[A-Za-z]{2,}/g) || [];
  return t.length >= 8 && words.length >= 2 && latinRatio(t) > 0.9;
}

function firstSentences(text, maxLen = 220) {
  const s = stripHtml(text)
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!s) return '';
  const parts = s.match(/[^.!?]+[.!?]+(\s|$)/g) || [s];
  let outText = '';
  for (const p of parts.slice(0, 2)) {
    if ((outText + p).length > maxLen) break;
    outText += p;
  }
  if (!outText) {
    outText = s.slice(0, maxLen);
    outText = `${outText.slice(0, outText.lastIndexOf(' '))}.`;
  }
  return outText.trim();
}

function plainDescription(text, fallback) {
  const d = firstSentences(text);
  if (!d || d.length < 25 || latinRatio(d) < 0.95 || blockedBy(d) || /\b(credit|music|producer|editor)s?:/i.test(d)) return fallback;
  return d;
}

function slugify(s) {
  const full = s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return full.length <= 60 ? full : full.slice(0, 61).replace(/-[^-]*$/, '');
}

function normLicense(s) {
  const l = stripHtml(s).trim();
  if (/^cc0/i.test(l)) return 'CC0 1.0';
  if (/^(public domain|pd\b|pd-)/i.test(l)) return 'Public domain';
  const m = l.match(/^CC[ -]BY(-SA)?[ -]?(\d\.\d)?(\s+[a-z]{2})?$/i);
  if (m) return `CC BY${m[1] ? '-SA' : ''}${m[2] ? ` ${m[2]}` : ''}${m[3] ? m[3] : ''}`;
  return null; // anything else (GFDL-only, NC, ND, unknown) is rejected
}

// ---------------------------------------------------------------- discovery
async function discoverNasa(seen) {
  const out = [];
  for (const qd of NASA_QUERIES) {
    const url = `https://images-api.nasa.gov/search?media_type=video&page_size=60&q=${encodeURIComponent(qd.q)}`;
    const data = await getJson(url);
    const items = data?.collection?.items || [];
    const accepted = [];
    for (const it of items) {
      if (accepted.length >= qd.take * 3) break; // spare candidates for review failures
      const d = it.data?.[0];
      if (!d?.nasa_id || seen.has(`nasa:${d.nasa_id}`)) continue;
      const text = [d.title, d.description, d.description_508, (d.keywords || []).join(' '), d.photographer, d.secondary_creator].join(' ');
      if (blockedBy(text)) continue;
      const title = cleanTitle(d.title || '');
      if (!goodTitle(title)) continue;
      const meta = await getJson(`https://images-assets.nasa.gov/video/${encodeURIComponent(d.nasa_id)}/metadata.json`);
      const durStr = meta?.['QuickTime:Duration'] || meta?.['QuickTime:TrackDuration'] || '';
      let dur = 0;
      const hms = String(durStr).match(/(\d+):(\d+):(\d+)/);
      if (hms) dur = +hms[1] * 3600 + +hms[2] * 60 + +hms[3];
      else if (/s$/.test(durStr)) dur = parseFloat(durStr);
      if (dur < MIN_SRC || dur > 420) continue;
      if (meta?.['XMP:Rights'] && /copyright|©/i.test(meta['XMP:Rights'])) continue;
      const w = Number(meta?.['QuickTime:ImageWidth'] || 0);
      const h = Number(meta?.['QuickTime:ImageHeight'] || 0);
      if (w && h && Math.min(w, h) < 360) continue;
      const asset = await getJson(`https://images-api.nasa.gov/asset/${encodeURIComponent(d.nasa_id)}`);
      const hrefs = (asset?.collection?.items || []).map((x) => x.href.replace(/^http:/, 'https:'));
      const pick =
        hrefs.find((h2) => /~large\.mp4$/i.test(h2)) ||
        hrefs.find((h2) => /~orig\.mp4$/i.test(h2) && dur <= 180) ||
        hrefs.find((h2) => /~medium\.mp4$/i.test(h2)) ||
        hrefs.find((h2) => /~orig\.(mp4|mov)$/i.test(h2)) ||
        hrefs.find((h2) => /~mobile\.mp4$/i.test(h2));
      if (!pick) continue;
      const desc = d.description || d.description_508 || '';
      const mentionsMusic = /\bmusic\b|universal production|killer tracks|audio network|artlist|premiumbeat|soundtrack/i.test(desc);
      const raw = /b-?roll|footage|launch|liftoff|test|timelapse|time-lapse|landing/i.test(`${d.title} ${desc}`);
      accepted.push({
        id: `nasa:${d.nasa_id}`,
        source: 'NASA',
        sourceUrl: `https://images.nasa.gov/details/${encodeURIComponent(d.nasa_id)}`,
        mediaUrl: pick,
        title,
        description: plainDescription(desc, `${title}, from NASA's image and video library.`),
        license: 'Public domain',
        author: `NASA${d.center ? ` (${d.center})` : ''}${d.photographer ? ` / ${stripHtml(d.photographer)}` : ''}`.slice(0, 120),
        credit: `Courtesy NASA${d.center ? `/${d.center}` : ''}`,
        srcDuration: dur,
        width: w || null,
        height: h || null,
        category: qd.category,
        tags: [...new Set([...qd.tags, 'nasa'])],
        keepAudio: !mentionsMusic && raw,
        query: `nasa:${qd.q}`,
        take: qd.take,
        score: (w >= 1280 ? 2 : 1) + (dur >= 20 && dur <= 120 ? 2 : dur <= 240 ? 1 : 0),
      });
      seen.add(`nasa:${d.nasa_id}`);
    }
    log(`NASA "${qd.q}": ${items.length} results, ${accepted.length} candidates`);
    out.push(...accepted);
  }
  return out;
}

async function discoverSvs(seen) {
  const out = [];
  for (const qd of SVS_QUERIES) {
    const data = await getJson(`https://svs.gsfc.nasa.gov/api/search/?search=${encodeURIComponent(qd.q)}&limit=40`);
    const results = (data?.results || []).filter((r) => /visualization|animation/i.test(r.result_type || ''));
    const accepted = [];
    for (const r of results) {
      if (accepted.length >= qd.take * 3) break;
      if (seen.has(`svs:${r.id}`)) continue;
      if (blockedBy(`${r.title} ${stripHtml(r.description || '')}`)) continue;
      const title = cleanTitle(r.title || '');
      if (!goodTitle(title)) continue;
      const page = await getJson(`https://svs.gsfc.nasa.gov/api/${r.id}`);
      if (!page) continue;
      const pageText = `${page.title} ${stripHtml(page.description || '')}`;
      if (blockedBy(pageText)) continue;
      const movies = [];
      for (const g of page.media_groups || []) {
        for (const it of g.items || []) {
          const inst = it.instance;
          if (inst?.media_type === 'Movie' && /\.mp4$/i.test(inst.url) && inst.width >= 1024 && inst.width <= 1920) movies.push(inst);
        }
      }
      if (!movies.length) continue;
      // Prefer 1920 wide, then the one closest to it; avoid "print"/"stereo"/"360" variants.
      movies.sort((a, b) => Math.abs(a.width - 1920) - Math.abs(b.width - 1920));
      const mv = movies.find((m) => !/stereo|360|_vr|equirect|dome|hyperwall|9x16|4x3/i.test(m.filename)) || null;
      if (!mv) continue;
      const mediaUrl = mv.url.replace(/^http:/, 'https:');
      const probe = await ffprobe(mediaUrl);
      const dur = Number(probe?.format?.duration || 0);
      if (dur < MIN_SRC || dur > 900) continue;
      accepted.push({
        id: `svs:${r.id}`,
        source: 'NASA Scientific Visualization Studio',
        sourceUrl: `https://svs.gsfc.nasa.gov/${r.id}/`,
        mediaUrl,
        title,
        description: plainDescription(page.description || r.description, `${title}, a data visualization from NASA's Scientific Visualization Studio.`),
        license: 'Public domain',
        author: "NASA's Scientific Visualization Studio",
        credit: "NASA's Scientific Visualization Studio",
        srcDuration: dur,
        width: mv.width,
        height: mv.height,
        category: qd.category,
        tags: [...new Set([...qd.tags, 'nasa', 'visualization'])],
        keepAudio: false, // SVS productions may carry licensed music; visualizations are silent anyway
        query: `svs:${qd.q}`,
        take: qd.take,
        score: 2 + (dur >= 20 && dur <= 120 ? 2 : 1),
      });
      seen.add(`svs:${r.id}`);
    }
    log(`SVS "${qd.q}": ${results.length} results, ${accepted.length} candidates`);
    out.push(...accepted);
  }
  return out;
}

async function discoverCommons(seen) {
  const out = [];
  for (const qd of COMMONS_QUERIES) {
    const params = new URLSearchParams({
      action: 'query', format: 'json', formatversion: '2', uselang: 'en',
      generator: 'search', gsrsearch: `filetype:video ${qd.q}`, gsrnamespace: '6', gsrlimit: '50',
      prop: 'imageinfo|videoinfo', iiprop: 'url|size|mime|extmetadata',
      iiextmetadatafilter: 'LicenseShortName|Artist|ImageDescription|ObjectName|Credit|Restrictions|Categories|AttributionRequired',
      viprop: 'derivatives',
    });
    const data = await getJson(`https://commons.wikimedia.org/w/api.php?${params}`);
    const pages = (data?.query?.pages || []).sort((a, b) => a.index - b.index);
    const accepted = [];
    for (const p of pages) {
      const ii = p.imageinfo?.[0];
      if (!ii || seen.has(`commons:${p.pageid}`)) continue;
      const em = ii.extmetadata || {};
      const g = (k) => stripHtml(em[k]?.value || '');
      const license = normLicense(g('LicenseShortName'));
      if (!license) continue;
      if (g('Restrictions')) continue; // personality rights, trademarks, insignia …
      const dur = Number(ii.duration || 0);
      if (dur < MIN_SRC || dur > 900) continue;
      if (Math.min(ii.width, ii.height) < 480) continue;
      const rawDesc = em.ImageDescription?.value || '';
      const credit = g('Credit');
      const cats = g('Categories');
      const text = `${p.title} ${stripHtml(rawDesc)} ${cats} ${credit}`;
      if (blockedBy(text)) continue;
      if (/youtube|youtu\.be|vimeo|tiktok|facebook|instagram|flickr video/i.test(`${text} ${rawDesc}`)) continue; // keep provenance simple
      if (/\b(animation|animated|cgi|render|rendering|diagram|chart|map|simulation|screenshot|slides?)\b/i.test(p.title)) continue;
      const title = cleanTitle(em.ObjectName?.value || p.title);
      if (!goodTitle(title)) continue;
      // Download source: original if small enough, otherwise a 720p/1080p transcode Commons already made.
      const derivs = (p.videoinfo?.[0]?.derivatives || ii.derivatives || []);
      const pickDeriv = (h) => derivs.find((d2) => new RegExp(`\\.${h}p\\.(vp9\\.)?webm$`).test(d2.src));
      let mediaUrl = ii.url.split('?')[0];
      if (ii.size > 150e6 || (/ogv|ogg/i.test(ii.mime) && ii.size > 80e6)) {
        const dv = pickDeriv(1080) || pickDeriv(720);
        if (!dv) continue;
        mediaUrl = dv.src;
      }
      const artist = g('Artist').replace(/\s*\(talk\)\s*/i, '').slice(0, 120) || 'Unknown author';
      const vertical = ii.height > ii.width;
      accepted.push({
        id: `commons:${p.pageid}`,
        source: 'Wikimedia Commons',
        sourceUrl: ii.descriptionurl,
        mediaUrl,
        title,
        description: plainDescription(rawDesc, `${title}. Openly licensed footage from Wikimedia Commons.`),
        license,
        author: artist,
        credit: `${artist} / ${license}, via Wikimedia Commons`,
        srcDuration: dur,
        width: ii.width,
        height: ii.height,
        category: qd.category,
        tags: qd.tags,
        keepAudio: true,
        query: `commons:${qd.q}`,
        take: qd.take,
        score:
          (Math.min(ii.width, ii.height) >= 720 ? 2 : 1) +
          (dur >= 20 && dur <= 90 ? 2 : dur <= 200 ? 1 : 0) +
          (vertical ? 0.5 : 0),
      });
      seen.add(`commons:${p.pageid}`);
      if (accepted.length >= qd.take * 3) break;
    }
    log(`Commons "${qd.q}": ${pages.length} results, ${accepted.length} candidates`);
    out.push(...accepted);
  }
  return out;
}

async function discover() {
  const prev = readJson(CANDIDATES, []);
  if (prev.length && !opt('refresh')) {
    log(`Using cached ${prev.length} candidates (${CANDIDATES}); --refresh to re-query.`);
    return prev;
  }
  const seen = new Set();
  const all = [
    ...(await discoverNasa(seen)),
    ...(await discoverSvs(seen)),
    ...(await discoverCommons(seen)),
  ];
  // Stable slugs: reuse previous slug for the same source id.
  const prevSlug = new Map(prev.map((c) => [c.id, c.slug]));
  const used = new Set();
  const titlesSeen = new Set();
  const result = [];
  for (const c of all) {
    const tkey = c.title.toLowerCase().replace(/[^a-z]/g, '');
    if (titlesSeen.has(tkey)) continue; // near-identical duplicates
    titlesSeen.add(tkey);
    let slug = prevSlug.get(c.id) || slugify(c.title);
    if (used.has(slug)) slug = `${slug.slice(0, 54)}-${sha(c.id).slice(0, 5)}`;
    used.add(slug);
    if (!ALLOWED_CATEGORIES.has(c.category)) throw new Error(`Bad category ${c.category} for ${c.id}`);
    result.push({ ...c, slug });
  }
  writeJson(CANDIDATES, result);
  log(`Discovery done: ${result.length} candidates -> ${CANDIDATES}`);
  return result;
}

// ---------------------------------------------------------------- analysis
async function analyse(file, dur) {
  // One pass at low res / 4 fps: per-frame brightness, contrast, saturation and
  // scene-change score, plus blackdetect + freezedetect intervals.
  const statsFile = path.join(TMP, `${sha(file).slice(0, 10)}.stats.txt`);
  const vf = [
    'fps=4',
    'scale=320:-2',
    'blackdetect=d=0.5:pic_th=0.92:pix_th=0.10',
    'freezedetect=n=-55dB:d=1.5',
    'signalstats',
    "select='gte(scene\\,0)'",
    `metadata=mode=print:file=${statsFile.replace(/([\\:'])/g, '\\$1')}`,
  ].join(',');
  const r = await run('ffmpeg', ['-hide_banner', '-nostats', '-threads', '2', '-i', file, '-map', '0:v:0', '-vf', vf, '-an', '-f', 'null', '-']);
  const txt = fs.existsSync(statsFile) ? fs.readFileSync(statsFile, 'utf8') : '';
  fs.rmSync(statsFile, { force: true });
  const frames = [];
  let cur = null;
  for (const line of txt.split('\n')) {
    const m = line.match(/pts_time:([\d.]+)/);
    if (m) { cur = { t: +m[1] }; frames.push(cur); continue; }
    const kv = line.match(/^lavfi\.(signalstats\.(YAVG|YLOW|YHIGH|SATAVG)|scene_score)=([\d.eE+-]+)/);
    if (kv && cur) cur[kv[2] || 'scene'] = +kv[3];
  }
  const intervals = (re) => {
    const res = [];
    let start = null;
    for (const line of r.err.split('\n')) {
      const s = line.match(re.start);
      if (s) start = +s[1];
      const e = line.match(re.end);
      if (e) { res.push([start ?? 0, +e[1]]); start = null; }
    }
    if (start !== null) res.push([start, dur]);
    return res;
  };
  const black = [];
  for (const m of r.err.matchAll(/black_start:([\d.]+) black_end:([\d.]+)/g)) black.push([+m[1], +m[2]]);
  const freeze = intervals({ start: /freeze_start: ([\d.]+)/, end: /freeze_end: ([\d.]+)/ });
  for (const f of frames) {
    const yavg = f.YAVG ?? 0;
    const contrast = (f.YHIGH ?? 0) - (f.YLOW ?? 0);
    f.bad = yavg < 28 || yavg > 240 || contrast < 14 ||
      black.some(([a, b]) => f.t >= a && f.t <= b) ||
      freeze.some(([a, b]) => f.t >= a && f.t <= b);
  }
  return { frames, black, freeze };
}

function chooseWindow(frames, black, freeze, dur) {
  // Skip opening black / frozen title card (chained intervals starting near 0).
  let s0 = 0;
  const opening = [...black, ...freeze].sort((a, b) => a[0] - b[0]);
  for (const [a, b] of opening) if (a <= s0 + 0.6 && b > s0) s0 = b;
  if (s0 > 0) s0 += 0.3;
  // Trailing black / freeze (end slates).
  let e0 = dur;
  const closing = [...black, ...freeze].sort((a, b) => b[1] - a[1]);
  for (const [a, b] of closing) if (b >= e0 - 0.6 && a < e0) e0 = a;
  if (e0 < dur) e0 -= 0.2;
  if (e0 - s0 < MIN_CLIP) { s0 = 0; e0 = dur; } // nothing sensible left: use everything, analysis below rejects junk
  const len = Math.min(MAX_CLIP, e0 - s0);
  let best = { start: s0, score: -Infinity };
  for (let st = s0; st <= e0 - len + 1e-6; st += 1) {
    const w = frames.filter((f) => f.t >= st && f.t < st + len);
    if (!w.length) continue;
    const sc = w.reduce((acc, f) => acc + (f.bad ? -2 : 0.4 + Math.min((f.scene || 0) * 8, 1)), 0) / w.length - 0.002 * (st - s0);
    if (sc > best.score) best = { start: st, score: sc };
  }
  const win = frames.filter((f) => f.t >= best.start && f.t < best.start + len);
  const badShare = win.length ? win.filter((f) => f.bad).length / win.length : 1;
  const motion = win.length ? win.reduce((a, f) => a + (f.scene || 0), 0) / win.length : 0;
  return { start: +best.start.toFixed(2), len: Math.floor(len), badShare, motion };
}

function chooseThumbTime(frames, start, len) {
  const lo = start + len * 0.1;
  const hi = start + len * 0.9;
  const cands = frames.filter((f) => f.t >= lo && f.t <= hi && !f.bad);
  if (!cands.length) return start + len / 2;
  // Bright-ish, contrasty, colourful, and not on a cut/transition.
  const scoreOf = (f) =>
    ((f.YHIGH ?? 0) - (f.YLOW ?? 0)) +
    0.8 * (f.SATAVG ?? 0) -
    0.5 * Math.abs((f.YAVG ?? 0) - 125) -
    250 * Math.min(f.scene || 0, 0.4);
  cands.sort((a, b) => scoreOf(b) - scoreOf(a));
  return cands[0].t;
}

async function audioInfo(file, start, len) {
  // mean volume + spectral flatness: drop audio that is silent or just hiss/wind noise.
  const r = await run('ffmpeg', ['-hide_banner', '-nostats', '-ss', String(start), '-t', String(len), '-i', file, '-map', '0:a:0', '-af', 'aspectralstats=measure=flatness,ametadata=mode=print:key=lavfi.aspectralstats.1.flatness,volumedetect', '-f', 'null', '-']);
  const mean = r.err.match(/mean_volume: ([-\d.]+) dB/);
  const flats = [...r.err.matchAll(/lavfi\.aspectralstats\.1\.flatness=([\d.]+)/g)].map((m) => +m[1]);
  const flat = flats.length ? flats.reduce((a, b) => a + b, 0) / flats.length : 0;
  return { mean: mean ? +mean[1] : -99, flatness: flat };
}

// ---------------------------------------------------------------- processing
async function processOne(c) {
  const mp4 = path.join(OUT, `${c.slug}.mp4`);
  const jpg = path.join(OUT, `${c.slug}.jpg`);
  const metaFile = path.join(META_DIR, `${c.slug}.json`);
  const srcFile = path.join(TMP, `${c.slug}.src.mkv`);
  const rawFile = path.join(TMP, `${c.slug}.raw`);
  try {
    // 1. Fetch (only the part we may use for long sources).
    const cap = c.srcDuration <= 70 ? c.srcDuration + 2 : DL_CAP;
    let ok = false;
    for (let attempt = 1; attempt <= 3 && !ok; attempt++) {
      let input = c.mediaUrl;
      if (c.source === 'Wikimedia Commons') {
        // upload.wikimedia.org rate-limits ffmpeg's HTTP client (429); a plain curl download is fine.
        await sleep(1500);
        const dl = await run('curl', ['-sS', '-f', '-L', '--retry', '3', '--retry-delay', '5', '-m', '900', '-A', UA, '-o', rawFile, c.mediaUrl], { timeoutMs: 16 * 60_000 });
        if (dl.code !== 0) { log(`  ${c.slug}: curl attempt ${attempt} failed: ${dl.err.trim().slice(0, 200)}`); await sleep(5000 * attempt); continue; }
        input = rawFile;
      }
      const r = await run('ffmpeg', [
        '-hide_banner', '-nostats', '-y',
        ...(input === rawFile ? [] : ['-user_agent', UA, '-reconnect', '1', '-reconnect_streamed', '1', '-reconnect_delay_max', '10']),
        '-t', String(cap), '-i', input, '-map', '0:v:0', '-map', '0:a:0?', '-c', 'copy', '-f', 'matroska', srcFile,
      ], { timeoutMs: 15 * 60_000 });
      fs.rmSync(rawFile, { force: true });
      ok = r.code === 0 && fs.existsSync(srcFile) && fs.statSync(srcFile).size > 50_000;
      if (!ok) { log(`  ${c.slug}: download attempt ${attempt} failed: ${r.err.split('\n').filter(Boolean).slice(-1)[0]}`); await sleep(3000 * attempt); }
    }
    if (!ok) throw new Error('download failed');
    log(`  ${c.slug}: downloaded`);
    // Normalise once to a light intermediate (<=1280x720 or 720x1280, square pixels, <=30 fps,
    // rotation applied) so analysis, encode and thumbnail don't each decode a 4K source.
    {
      const midFile = path.join(TMP, `${c.slug}.mid.mkv`);
      const fit = "scale=w='if(gt(iw*sar,ih),min(1280,iw*sar),min(720,iw*sar))':h='if(gt(iw*sar,ih),min(720,ih),min(1280,ih))':force_original_aspect_ratio=decrease:force_divisible_by=2,setsar=1,fps='min(source_fps,30)'";
      const m = await run('ffmpeg', ['-hide_banner', '-nostats', '-y', '-threads', '0', '-i', srcFile, '-map', '0:v:0', '-map', '0:a:0?',
        '-vf', fit, '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '12', '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-f', 'matroska', midFile]);
      if (m.code !== 0) {
        // fps expression unsupported on some builds -> retry without it
        const m2 = await run('ffmpeg', ['-hide_banner', '-nostats', '-y', '-i', srcFile, '-map', '0:v:0', '-map', '0:a:0?',
          '-vf', fit.replace(/,fps=.*$/, ''), '-r', '30', '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '12', '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-f', 'matroska', midFile]);
        if (m2.code !== 0) throw new Error(`normalise failed: ${m2.err.split('\n').filter(Boolean).slice(-1)[0]}`);
      }
      fs.renameSync(midFile, srcFile);
    }
    log(`  ${c.slug}: normalised`);
    const probe = await ffprobe(srcFile);
    const vs = probe?.streams?.find((s) => s.codec_type === 'video');
    const as = probe?.streams?.find((s) => s.codec_type === 'audio');
    if (!vs) throw new Error('no video stream');
    const dur = Number(probe.format.duration || c.srcDuration);
    let w = vs.width;
    let h = vs.height;
    const rot = Math.abs(Number(vs.side_data_list?.find((d) => d.rotation !== undefined)?.rotation || vs.tags?.rotate || 0));
    if (rot === 90 || rot === 270) [w, h] = [h, w];
    const sar = vs.sample_aspect_ratio && vs.sample_aspect_ratio !== '0:1' ? vs.sample_aspect_ratio.split(':').map(Number) : [1, 1];
    const dispW = Math.round(w * (sar[0] / sar[1] || 1));

    // 2. Analyse & pick the window.
    const { frames, black, freeze } = await analyse(srcFile, dur);
    if (frames.length < 8) throw new Error('analysis produced no frames');
    const win = chooseWindow(frames, black, freeze, dur);
    if (win.len < MIN_CLIP) throw new Error(`too short after trimming (${win.len}s)`);
    if (win.badShare > 0.35) throw new Error(`mostly black/static (${Math.round(win.badShare * 100)}% bad frames)`);

    log(`  ${c.slug}: analysed, window ${win.start}+${win.len}s`);
    // 3. Audio decision.
    let keepAudio = Boolean(as) && c.keepAudio;
    let audioNote = as ? (c.keepAudio ? '' : 'removed (possible third-party music)') : 'none in source';
    if (keepAudio) {
      const ai = await audioInfo(srcFile, win.start, win.len);
      if (ai.mean < -48) { keepAudio = false; audioNote = `removed (near-silent, ${ai.mean} dB)`; }
      else if (ai.flatness > 0.45) { keepAudio = false; audioNote = `removed (noise-like, flatness ${ai.flatness.toFixed(2)})`; }
      else audioNote = `kept, loudness-normalised (mean ${ai.mean} dB)`;
    }

    // 4. Encode.
    const portrait = h > dispW;
    const [maxW, maxH] = portrait ? [720, 1280] : [1280, 720];
    const fpsIn = (() => { const [a, b] = String(vs.avg_frame_rate || '30/1').split('/').map(Number); return b ? a / b : 30; })();
    const fade = Math.min(0.6, win.len / 10);
    const vfilters = [
      `scale=w='min(${maxW},iw*sar)':h='min(${maxH},ih)':force_original_aspect_ratio=decrease:force_divisible_by=2`,
      'setsar=1',
      ...(fpsIn > 31 ? ['fps=30'] : []),
      `fade=t=in:st=0:d=${fade}`,
      `fade=t=out:st=${(win.len - fade).toFixed(2)}:d=${fade}`,
      'format=yuv420p',
    ].join(',');
    const encode = async (crf, maxrate) => {
      const a = [
        '-hide_banner', '-nostats', '-y', '-ss', String(win.start), '-t', String(win.len), '-i', srcFile,
        '-map', '0:v:0', ...(keepAudio ? ['-map', '0:a:0'] : []),
        '-vf', vfilters,
        '-c:v', 'libx264', '-preset', 'medium', '-crf', String(crf), '-maxrate', `${maxrate}k`, '-bufsize', `${maxrate * 2}k`,
        '-profile:v', 'high', '-level:v', '4.0', '-pix_fmt', 'yuv420p', '-g', '60',
        ...(keepAudio
          ? ['-af', `loudnorm=I=-16:TP=-1.5:LRA=11,afade=t=in:st=0:d=${fade},afade=t=out:st=${(win.len - fade).toFixed(2)}:d=${fade}`, '-c:a', 'aac', '-b:a', '96k', '-ac', '2', '-ar', '48000']
          : ['-an']),
        '-map_metadata', '-1', '-map_chapters', '-1', '-sn', '-dn',
        '-metadata', `title=${c.title}`, '-metadata', `copyright=${c.license} — ${c.credit}`,
        '-movflags', '+faststart', mp4,
      ];
      return run('ffmpeg', a);
    };
    let enc = await encode(26, 1000);
    if (enc.code !== 0) throw new Error(`encode failed: ${enc.err.split('\n').filter(Boolean).slice(-2).join(' | ')}`);
    if (fs.statSync(mp4).size > MAX_MP4_BYTES) {
      enc = await encode(29, 750);
      if (enc.code !== 0) throw new Error('re-encode failed');
    }

    // 5. Thumbnail from the source at full resolution (cover-crop to 16:9 / 9:16).
    const tt = chooseThumbTime(frames, win.start, win.len);
    const [tw, th] = portrait ? [720, 1280] : [1280, 720];
    const tr = await run('ffmpeg', [
      '-hide_banner', '-nostats', '-y', '-ss', String(tt), '-i', srcFile, '-frames:v', '1',
      '-vf', `scale=w=iw*sar:h=ih,setsar=1,scale=${tw}:${th}:force_original_aspect_ratio=increase:flags=lanczos,crop=${tw}:${th},format=yuvj420p`,
      '-q:v', '3', jpg,
    ]);
    if (tr.code !== 0 || !fs.existsSync(jpg)) throw new Error('thumbnail failed');

    // 6. Validate output.
    const v = await validateFiles(c.slug);
    if (!v.ok) throw new Error(`validation: ${v.problems.join('; ')}`);

    const meta = {
      slug: c.slug,
      title: c.title,
      description: c.description,
      category: c.category,
      durationSeconds: v.duration,
      width: v.width,
      height: v.height,
      orientation: v.height > v.width ? 'portrait' : 'landscape',
      source: c.source,
      sourceUrl: c.sourceUrl,
      license: c.license,
      author: c.author,
      credit: c.credit,
      tags: c.tags,
      files: { video: `${c.slug}.mp4`, thumbnail: `${c.slug}.jpg` },
      sizeBytes: v.size,
      hasAudio: v.hasAudio,
      processing: {
        sourceMediaUrl: c.mediaUrl,
        sourceDuration: Math.round(dur),
        trimStart: win.start,
        thumbnailAt: +tt.toFixed(2),
        audio: audioNote,
        badFrameShare: +win.badShare.toFixed(3),
        motion: +win.motion.toFixed(4),
      },
    };
    writeJson(metaFile, meta);
    return { ok: true, meta };
  } catch (e) {
    for (const f of [mp4, jpg, metaFile]) fs.rmSync(f, { force: true });
    return { ok: false, error: e.message };
  } finally {
    fs.rmSync(srcFile, { force: true });
    fs.rmSync(rawFile, { force: true });
    fs.rmSync(path.join(TMP, `${c.slug}.mid.mkv`), { force: true });
  }
}

async function validateFiles(slug) {
  const mp4 = path.join(OUT, `${slug}.mp4`);
  const jpg = path.join(OUT, `${slug}.jpg`);
  const problems = [];
  const p = fs.existsSync(mp4) ? await ffprobe(mp4) : null;
  if (!p) return { ok: false, problems: ['mp4 missing/unreadable'] };
  const v = p.streams.find((s) => s.codec_type === 'video');
  const a = p.streams.find((s) => s.codec_type === 'audio');
  const duration = Math.round(Number(p.format.duration));
  if (!v || v.codec_name !== 'h264') problems.push(`video codec ${v?.codec_name}`);
  if (v?.pix_fmt !== 'yuv420p') problems.push(`pix_fmt ${v?.pix_fmt}`);
  if (a && a.codec_name !== 'aac') problems.push(`audio codec ${a.codec_name}`);
  if (!(Number(p.format.duration) <= 60)) problems.push(`duration ${p.format.duration}`);
  if (duration < MIN_CLIP - 1) problems.push(`too short ${duration}`);
  if (Math.min(v?.width || 0, v?.height || 0) > 720 || Math.max(v?.width || 0, v?.height || 0) > 1280) problems.push(`size ${v?.width}x${v?.height}`);
  const size = fs.statSync(mp4).size;
  if (size > MAX_MP4_BYTES * 1.25) problems.push(`file too big ${size}`);
  const tp = fs.existsSync(jpg) ? await ffprobe(jpg) : null;
  const tv = tp?.streams?.[0];
  const portrait = (v?.height || 0) > (v?.width || 0);
  if (!tv) problems.push('thumbnail missing');
  else if (portrait ? !(tv.width === 720 && tv.height === 1280) : !(tv.width === 1280 && tv.height === 720)) problems.push(`thumb ${tv.width}x${tv.height}`);
  return { ok: problems.length === 0, problems, duration, width: v?.width, height: v?.height, size, hasAudio: Boolean(a) };
}

async function processAll(cands) {
  for (const f of fs.readdirSync(TMP)) fs.rmSync(path.join(TMP, f), { force: true }); // stale partials
  const failed = readJson(FAILED, {});
  const only = typeof opt('only') === 'string' ? new Set(opt('only').split(',')) : null;
  // Per-query quotas: take best-scored candidates first, fall back to spares on failure.
  const byQuery = new Map();
  for (const c of cands) {
    if (!byQuery.has(c.query)) byQuery.set(c.query, []);
    byQuery.get(c.query).push(c);
  }
  const queues = [];
  for (const list of byQuery.values()) {
    list.sort((a, b) => b.score - a.score);
    queues.push(list);
  }
  const excluded = new Set(readJson(path.join(__dirname, 'overrides.json'), {}).exclude || []);
  for (const q of queues) q.splice(0, q.length, ...q.filter((c) => !excluded.has(c.slug)));
  for (let k = queues.length - 1; k >= 0; k--) if (!queues[k].length) queues.splice(k, 1);
  const done = (c) => fs.existsSync(path.join(META_DIR, `${c.slug}.json`)) && fs.existsSync(path.join(OUT, `${c.slug}.mp4`)) && fs.existsSync(path.join(OUT, `${c.slug}.jpg`));

  const work = [];
  for (const list of queues) {
    const take = list[0].take;
    // A query needs (take - already done) more; spares follow in order.
    work.push({ list, take });
  }
  let processed = 0;
  const tasks = [];
  for (const { list, take } of work) {
    tasks.push(async () => {
      let have = list.filter(done).length;
      for (const c of list) {
        if (only && !only.has(c.slug)) continue;
        if (!only && have >= take) break;
        if (done(c)) continue;
        if (failed[c.slug] && !opt('retry-failed') && !only) continue;
        if (typeof opt('source') === 'string' && !c.query.startsWith(`${opt('source')}:`)) break;
        if (Date.now() > DEADLINE) break;
        log(`→ ${c.slug} [${c.source}] ${c.srcDuration.toFixed?.(0) ?? c.srcDuration}s`);
        const r = await processOne(c);
        processed++;
        if (r.ok) {
          have++;
          delete failed[c.slug];
          log(`✓ ${c.slug} ${r.meta.durationSeconds}s ${r.meta.width}x${r.meta.height} ${(r.meta.sizeBytes / 1e6).toFixed(1)}MB audio:${r.meta.processing.audio}`);
        } else {
          failed[c.slug] = { id: c.id, sourceUrl: c.sourceUrl, error: r.error, at: new Date().toISOString() };
          log(`✗ ${c.slug}: ${r.error}`);
        }
        writeJson(FAILED, failed);
      }
    });
  }
  // Simple worker pool over query-tasks.
  let i = 0;
  await Promise.all(Array.from({ length: JOBS }, async () => {
    while (i < tasks.length) await tasks[i++]();
  }));
  log(`Processing pass finished (${processed} attempted).`);
}

// ---------------------------------------------------------------- manifest & report
async function buildManifest() {
  const cands = readJson(CANDIDATES, []);
  const order = new Map(cands.map((c, i) => [c.slug, i]));
  const metas = fs.readdirSync(META_DIR).filter((f) => f.endsWith('.json')).map((f) => readJson(path.join(META_DIR, f)))
    .filter((m) => m && fs.existsSync(path.join(OUT, `${m.slug}.mp4`)) && fs.existsSync(path.join(OUT, `${m.slug}.jpg`)))
    .sort((a, b) => (order.get(a.slug) ?? 1e9) - (order.get(b.slug) ?? 1e9));
  const overrides = readJson(path.join(__dirname, 'overrides.json'), {});
  const exclude = new Set(overrides.exclude || []);
  const manifest = metas
    .filter((m) => !exclude.has(m.slug))
    .map((m) => {
      const o = overrides.items?.[m.slug] || {};
      return {
        slug: m.slug,
        title: o.title || m.title,
        description: o.description || m.description,
        category: o.category || m.category,
        durationSeconds: m.durationSeconds,
        width: m.width,
        height: m.height,
        orientation: m.orientation,
        source: m.source,
        sourceUrl: m.sourceUrl,
        license: m.license,
        author: m.author,
        credit: m.credit,
        tags: o.tags || m.tags,
        video: m.files.video,
        thumbnail: m.files.thumbnail,
        sizeBytes: m.sizeBytes,
        hasAudio: m.hasAudio,
      };
    });
  for (const m of manifest) if (!ALLOWED_CATEGORIES.has(m.category)) throw new Error(`bad category in manifest: ${m.slug}`);
  writeJson(path.join(OUT, 'manifest.json'), manifest);

  const credits = manifest.map((m) =>
    `${m.slug}.mp4\n  "${m.title}" — ${m.author}\n  Licence: ${m.license}\n  Source: ${m.sourceUrl}\n  Changes: trimmed to ${m.durationSeconds}s, re-encoded${m.hasAudio ? ', audio loudness-normalised' : ', audio removed'}.\n`).join('\n');
  fs.writeFileSync(path.join(OUT, 'CREDITS.txt'), `Attribution for the clips in this folder (generated by scripts/videos/collect.mjs).\nCC BY / CC BY-SA clips must show the author, licence and a link wherever they are displayed.\nNASA material is public domain; NASA logos/insignia may not be used to imply endorsement.\n\n${credits}`);

  // Report
  const count = (k) => manifest.reduce((acc, m) => ({ ...acc, [m[k]]: (acc[m[k]] || 0) + 1 }), {});
  const total = manifest.reduce((a, m) => a + m.sizeBytes, 0);
  const thumbs = manifest.reduce((a, m) => a + fs.statSync(path.join(OUT, m.thumbnail)).size, 0);
  const failed = readJson(FAILED, {});
  const lic = manifest.reduce((acc, m) => ({ ...acc, [m.license]: (acc[m.license] || 0) + 1 }), {});
  const lines = [
    `Boostly video staging report — ${new Date().toISOString()}`,
    `Output: ${OUT}`,
    `Clips in manifest: ${manifest.length} (excluded by overrides: ${exclude.size})`,
    `Total size: ${(total / 1e6).toFixed(1)} MB video + ${(thumbs / 1e6).toFixed(1)} MB thumbnails; largest mp4 ${(Math.max(...manifest.map((m) => m.sizeBytes)) / 1e6).toFixed(1)} MB`,
    `Durations: min ${Math.min(...manifest.map((m) => m.durationSeconds))}s, max ${Math.max(...manifest.map((m) => m.durationSeconds))}s, total ${(manifest.reduce((a, m) => a + m.durationSeconds, 0) / 60).toFixed(1)} min`,
    `Orientation: ${JSON.stringify(count('orientation'))}`,
    `With audio: ${manifest.filter((m) => m.hasAudio).length}`,
    '',
    'Per source:', ...Object.entries(count('source')).map(([k, v]) => `  ${k}: ${v}`),
    '', 'Per category:', ...Object.entries(count('category')).sort((a, b) => b[1] - a[1]).map(([k, v]) => `  ${k}: ${v}`),
    '', 'Per licence:', ...Object.entries(lic).sort((a, b) => b[1] - a[1]).map(([k, v]) => `  ${k}: ${v}`),
    '', `Failed / rejected candidates (${Object.keys(failed).length}):`,
    ...Object.entries(failed).map(([k, v]) => `  ${k}: ${v.error}`),
  ];
  fs.writeFileSync(path.join(OUT, 'report.txt'), `${lines.join('\n')}\n`);
  console.log(lines.join('\n'));
  return manifest;
}

async function validateAll() {
  const manifest = readJson(path.join(OUT, 'manifest.json'), []);
  let bad = 0;
  for (const m of manifest) {
    const v = await validateFiles(m.slug);
    if (!v.ok) { bad++; console.log(`INVALID ${m.slug}: ${v.problems.join('; ')}`); }
  }
  console.log(`Validated ${manifest.length} clips, ${bad} invalid.`);
  return bad;
}

// ---------------------------------------------------------------- main
(async () => {
  log(`Output dir: ${OUT}`);
  if (cmd === 'discover') { await discover(); return; }
  if (cmd === 'manifest') { await buildManifest(); return; }
  if (cmd === 'validate') { process.exitCode = (await validateAll()) ? 1 : 0; return; }
  const cands = await discover();
  if (cmd === 'process' || cmd === 'all') await processAll(cands);
  await buildManifest();
  await validateAll();
})().catch((e) => { console.error(e); process.exit(1); });
