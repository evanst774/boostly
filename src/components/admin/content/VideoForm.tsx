// src/components/admin/content/VideoForm.tsx
//
// Shared form for "Add video" and "Edit video". The pages own the API calls;
// this component owns the fields, the guidance under each one, client-side
// checks that mirror the server rules, and inline errors.
'use client';

import { PlanAccessField } from '@/components/admin/content/PlanAccessField';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  Save,
  Loader2,
  Video,
  Image as ImageIcon,
  Tag,
  Coins,
  Star,
  Clock,
  Plus,
  X,
  MonitorPlay,
  Smartphone,
  FileVideo,
  Link2,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AVERAGE_BOOST_ESTIMATE,
  Callout,
  FieldError,
  FieldHint,
  FieldLabel,
  FormBanner,
  estimatePaidCompletions,
  fieldInputClass,
  focusFirstError,
  formatDuration,
  isValidUrl,
  looksLikeUrl,
  normalizeUrl,
  parseServerError,
  type FieldErrors,
} from './FieldHelp';

// ============================================
// TYPES & CONSTANTS
// ============================================

export interface VideoFormValues {
  title: string;
  description: string;
  category: string;
  difficulty: string;
  duration: number;
  videoUrl: string;
  thumbnailUrl: string;
  rewardAmount: number;
  rewardBudget: number | null;
  allowedPlanTiers: string[] | null;
  isSponsored: boolean;
  sponsorName: string;
  sponsorLogo: string;
  sponsorWebsite: string;
  tags: string[];
  status: string;
}

export const EMPTY_VIDEO_FORM: VideoFormValues = {
  title: '',
  description: '',
  category: 'EDUCATION',
  difficulty: 'BEGINNER',
  duration: 0,
  videoUrl: '',
  thumbnailUrl: '',
  rewardAmount: 40,
  rewardBudget: null,
  allowedPlanTiers: null,
  isSponsored: false,
  sponsorName: '',
  sponsorLogo: '',
  sponsorWebsite: '',
  tags: [],
  status: 'DRAFT',
};

export const VIDEO_CATEGORIES = [
  'BUSINESS',
  'FINANCE',
  'TECH',
  'EDUCATION',
  'ENTERTAINMENT',
  'LIFESTYLE',
  'GAMING',
  'SPORTS',
  'MUSIC',
  'NEWS',
  'TUTORIAL',
];

export const VIDEO_DIFFICULTIES = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];

/** Statuses the server accepts when saving a video. */
const SAVEABLE_STATUSES = ['DRAFT', 'PENDING_REVIEW', 'ACTIVE'];

const STATUS_HELP: Record<string, string> = {
  DRAFT: 'Hidden from members while you prepare it.',
  PENDING_REVIEW: 'Hidden from members until someone approves it.',
  ACTIVE: 'Live: members can watch it and earn right away.',
  INACTIVE: 'Unpublished. Use Publish on the video page to bring it back.',
  REJECTED: 'Rejected in review. Pick Draft or Active to save other changes.',
};

const LABELS: Record<string, string> = {
  title: 'Title',
  description: 'Description',
  category: 'Category',
  difficulty: 'Difficulty',
  duration: 'Duration',
  videoUrl: 'Video source',
  thumbnailUrl: 'Thumbnail',
  rewardAmount: 'Reward per completed view',
  rewardBudget: 'Reward budget',
  allowedPlanTiers: 'Available to',
  isSponsored: 'Sponsored',
  sponsorName: 'Sponsor name',
  sponsorLogo: 'Sponsor logo',
  sponsorWebsite: 'Sponsor website',
  tags: 'Tags',
  status: 'Status',
};

const FIELD_ORDER = [
  'videoUrl',
  'title',
  'category',
  'description',
  'thumbnailUrl',
  'duration',
  'rewardAmount',
  'rewardBudget',
  'status',
  'sponsorName',
  'sponsorWebsite',
  'sponsorLogo',
  'tags',
];

const TITLE_MAX = 255;
const TAG_MAX = 40;

/** Hosts a direct video file can stream from (the app's media-src policy). */
function allowedFileHosts(): string[] {
  const hosts = ['cdn.boostly.buzz'];
  const extra = process.env.NEXT_PUBLIC_R2_CDN_DOMAIN;
  if (extra) {
    try {
      hosts.push(new URL(/^https?:\/\//.test(extra) ? extra : `https://${extra}`).hostname);
    } catch {
      /* ignore a malformed value */
    }
  }
  return hosts;
}

// ============================================
// VIDEO SOURCE DETECTION
// ============================================

type SourceKind =
  | 'youtube'
  | 'youtube-short'
  | 'youtube-no-id'
  | 'mp4'
  | 'webm'
  | 'unsupported-file'
  | 'unknown';

interface DetectedSource {
  kind: SourceKind;
  label: string;
  /** Problem that blocks saving. */
  error?: string;
  /** Advice that doesn't block saving. */
  warning?: string;
}

const YT_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtu.be',
  'www.youtu.be',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
]);

export function detectVideoSource(raw: string): DetectedSource | null {
  if (!raw.trim() || !isValidUrl(raw)) return null;
  let url: URL;
  try {
    url = new URL(normalizeUrl(raw));
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase();
  const path = url.pathname;

  if (YT_HOSTS.has(host)) {
    const idOk = (id: string | null | undefined) => !!id && /^[\w-]{11}$/.test(id);
    if (host.endsWith('youtu.be')) {
      return idOk(path.split('/')[1])
        ? { kind: 'youtube', label: 'YouTube video' }
        : noYoutubeId();
    }
    const shorts = /^\/shorts\/([^/?#]+)/.exec(path);
    if (shorts) {
      return idOk(shorts[1]) ? { kind: 'youtube-short', label: 'YouTube Short' } : noYoutubeId();
    }
    const embed = /^\/(?:embed|live|v)\/([^/?#]+)/.exec(path);
    if (embed) {
      return idOk(embed[1]) ? { kind: 'youtube', label: 'YouTube video' } : noYoutubeId();
    }
    if (path === '/watch') {
      return idOk(url.searchParams.get('v'))
        ? { kind: 'youtube', label: 'YouTube video' }
        : noYoutubeId();
    }
    return noYoutubeId();
  }

  const ext = /\.([a-z0-9]+)$/i.exec(path)?.[1]?.toLowerCase();
  if (ext === 'mp4' || ext === 'webm' || ext === 'm4v') {
    const kind: SourceKind = ext === 'webm' ? 'webm' : 'mp4';
    const allowed = allowedFileHosts().some((h) => host === h || host.endsWith(`.${h}`));
    return {
      kind,
      label: kind === 'webm' ? 'WebM file' : 'MP4 file',
      warning: allowed
        ? undefined
        : `Video files from ${host} may be blocked by Boostly's security policy and not play for members. Host the file on cdn.boostly.buzz or use a YouTube link.`,
    };
  }
  if (ext && ['mov', 'mkv', 'avi', 'wmv', 'flv', '3gp', 'm3u8'].includes(ext)) {
    return {
      kind: 'unsupported-file',
      label: `.${ext} file`,
      error: `.${ext} files don't play in every browser. Convert it to MP4 (H.264) or WebM first.`,
    };
  }
  return {
    kind: 'unknown',
    label: 'Link (type not recognised)',
    warning:
      "This isn't a YouTube link or a direct .mp4/.webm file, so it probably won't play. A web page that contains a video doesn't work — link to the file itself.",
  };
}

function noYoutubeId(): DetectedSource {
  return {
    kind: 'youtube-no-id',
    label: 'YouTube link without a video',
    error:
      'This YouTube link doesn\'t point to one video. Open the video and copy its address (youtube.com/watch?v=…, youtu.be/… or youtube.com/shorts/…).',
  };
}

// ============================================
// VALIDATION (mirrors src/modules/content/validation.ts)
// ============================================

function validate(values: VideoFormValues): FieldErrors {
  const errors: FieldErrors = {};
  if (!values.title.trim()) errors.title = 'Give the video a title.';
  else if (values.title.length > TITLE_MAX)
    errors.title = `Keep the title to ${TITLE_MAX} characters or fewer.`;

  if (!values.videoUrl.trim()) {
    errors.videoUrl = 'Paste a YouTube link or a direct .mp4/.webm link.';
  } else {
    const detected = detectVideoSource(values.videoUrl);
    if (!detected)
      errors.videoUrl = 'This is not a valid link. Paste the full address, e.g. https://youtu.be/…';
    else if (detected.error) errors.videoUrl = detected.error;
  }

  if (values.thumbnailUrl.trim() && !values.thumbnailUrl.startsWith('data:') && !isValidUrl(values.thumbnailUrl))
    errors.thumbnailUrl = 'Enter a valid image link, or leave it blank.';

  if (!Number.isFinite(values.duration) || values.duration <= 0)
    errors.duration = 'Enter the video length in seconds (more than 0).';

  if (!Number.isFinite(values.rewardAmount) || values.rewardAmount <= 0)
    errors.rewardAmount = 'Enter a reward greater than 0 RWF.';

  if (values.rewardBudget !== null && !(values.rewardBudget > 0))
    errors.rewardBudget = 'Enter a budget greater than 0, or leave it blank for no campaign limit.';

  if (!SAVEABLE_STATUSES.includes(values.status))
    errors.status =
      "This status can't be saved from the form. Pick Draft, Pending review or Active (or use Publish/Unpublish on the video page).";

  if (values.isSponsored) {
    if (!values.sponsorName.trim()) errors.sponsorName = 'Sponsored videos need the sponsor name.';
    if (!values.sponsorWebsite.trim())
      errors.sponsorWebsite = 'Sponsored videos need the sponsor website (for example mtn.co.rw).';
    else if (!isValidUrl(values.sponsorWebsite))
      errors.sponsorWebsite = 'Enter a website like mtn.co.rw or https://www.mtn.co.rw.';
    if (values.sponsorLogo.trim() && !isValidUrl(values.sponsorLogo))
      errors.sponsorLogo = 'Enter a valid image link, or leave it blank.';
  }
  return errors;
}

// ============================================
// COMPONENT
// ============================================

interface VideoFormProps {
  initialValues: VideoFormValues;
  statusOptions: { value: string; label: string }[];
  submitLabel: string;
  submittingLabel: string;
  successMessage: string;
  /** Saves the values; throw an Error with the server message on failure. */
  onSubmit: (values: VideoFormValues) => Promise<void>;
  onCancel: () => void;
}

export function VideoForm({
  initialValues,
  statusOptions,
  submitLabel,
  submittingLabel,
  successMessage,
  onSubmit,
  onCancel,
}: VideoFormProps) {
  const [formData, setFormData] = useState<VideoFormValues>(initialValues);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [tagError, setTagError] = useState<string | null>(null);

  // Duration read from a direct video file (hidden <video> element).
  const [probeUrl, setProbeUrl] = useState<string | null>(null);
  const [detectedDuration, setDetectedDuration] = useState<{ url: string; seconds: number } | null>(null);
  const [durationAutoFilled, setDurationAutoFilled] = useState(false);

  // Thumbnail preview state
  const [thumbSize, setThumbSize] = useState<{ w: number; h: number } | null>(null);
  const [thumbFailed, setThumbFailed] = useState(false);

  const detected = detectVideoSource(formData.videoUrl);
  const isFile = detected?.kind === 'mp4' || detected?.kind === 'webm';
  const isYouTube = detected?.kind === 'youtube' || detected?.kind === 'youtube-short';
  const normalizedVideoUrl = normalizeUrl(formData.videoUrl);

  // Wait until the admin stops typing before probing a direct file.
  useEffect(() => {
    if (!isFile) {
      setProbeUrl(null);
      return;
    }
    const t = setTimeout(() => setProbeUrl(normalizedVideoUrl), 600);
    return () => clearTimeout(t);
  }, [isFile, normalizedVideoUrl]);

  const thumbSrc = formData.thumbnailUrl.trim()
    ? formData.thumbnailUrl.startsWith('data:')
      ? formData.thumbnailUrl
      : isValidUrl(formData.thumbnailUrl)
        ? normalizeUrl(formData.thumbnailUrl)
        : null
    : null;

  useEffect(() => {
    setThumbSize(null);
    setThumbFailed(false);
  }, [thumbSrc]);

  const update = <K extends keyof VideoFormValues>(field: K, value: VideoFormValues[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  const handleDetectedDuration = (url: string, seconds: number) => {
    setDetectedDuration({ url, seconds });
    if (formData.duration > 0) return;
    setFormData((prev) => (prev.duration > 0 ? prev : { ...prev, duration: seconds }));
    setDurationAutoFilled(true);
    setErrors((prev) => (prev.duration ? { ...prev, duration: undefined } : prev));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const found = validate(formData);
    if (Object.values(found).some(Boolean)) {
      setErrors(found);
      const count = Object.values(found).filter(Boolean).length;
      setMessage({
        type: 'error',
        text:
          count === 1
            ? 'Please fix the highlighted field before saving.'
            : `Please fix the ${count} highlighted fields before saving.`,
      });
      focusFirstError(found, FIELD_ORDER);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      setMessage({ type: 'success', text: successMessage });
    } catch (error) {
      const raw = error instanceof Error ? error.message : '';
      const parsed = parseServerError(raw || 'Saving failed. Please try again.', LABELS);
      if (parsed.field) {
        setErrors((prev) => ({ ...prev, [parsed.field as string]: parsed.text }));
        focusFirstError({ [parsed.field]: parsed.text }, FIELD_ORDER);
      }
      setMessage({ type: 'error', text: parsed.banner });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------- Tags ----------
  const tagIsLink = looksLikeUrl(tagInput);

  const addTag = () => {
    const tag = tagInput.trim();
    if (!tag) return;
    if (looksLikeUrl(tag)) {
      setTagError(null); // the link warning below explains what to do
      return;
    }
    if (tag.length > TAG_MAX) {
      setTagError(`Keep tags short (${TAG_MAX} characters or fewer), like "savings" or "mobile money".`);
      return;
    }
    if (!formData.tags.includes(tag)) {
      update('tags', [...formData.tags, tag]);
    }
    setTagInput('');
    setTagError(null);
  };

  const removeTag = (tag: string) => {
    update('tags', formData.tags.filter((t) => t !== tag));
  };

  const useTagAsVideoSource = () => {
    update('videoUrl', tagInput.trim());
    setTagInput('');
    setTagError(null);
    document.getElementById('field-videoUrl')?.focus();
  };

  const linkTags = formData.tags.filter((t) => looksLikeUrl(t));

  // ---------- Budget estimate ----------
  const paidViews = estimatePaidCompletions(formData.rewardBudget, formData.rewardAmount);

  const durationMismatch =
    detectedDuration &&
    detectedDuration.url === normalizedVideoUrl &&
    formData.duration > 0 &&
    Math.abs(detectedDuration.seconds - formData.duration) > 2;

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#F1F5F9] dark:border-[#334155] shadow-sm p-6"
    >
      <div className="space-y-6">
        <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
          Fields marked <span className="text-[#EF4444]">*</span> are required. Press the{' '}
          <span className="font-semibold">?</span> next to a label for more detail.
        </p>

        {/* Video source */}
        <div>
          <FieldLabel
            htmlFor="field-videoUrl"
            required
            tip={
              <>
                <p>Accepted sources:</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>
                    A YouTube link: youtube.com/watch?v=…, youtu.be/… or youtube.com/shorts/…
                  </li>
                  <li>
                    A direct link to an .mp4 or .webm file (MP4 with H.264 video is the safest
                    choice). Files must be hosted on Boostly&apos;s CDN (cdn.boostly.buzz); other
                    hosts are blocked by the app&apos;s security policy.
                  </li>
                  <li>
                    An uploaded file: this form can&apos;t upload videos (the upload service only
                    takes images and documents up to 10 MB). Ask a developer to put the file on the
                    CDN with the video publish script, then paste its link here.
                  </li>
                </ul>
                <p>
                  https:// is added for you if you leave it out. A page that merely contains a video
                  (a news article, Facebook or TikTok post) won&apos;t play.
                </p>
                <p className="font-semibold">
                  Only use videos you own or have the rights/sponsor permission to use.
                </p>
              </>
            }
          >
            Video source
          </FieldLabel>
          <div className="relative">
            <Link2 size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              id="field-videoUrl"
              type="text"
              inputMode="url"
              autoComplete="off"
              spellCheck={false}
              value={formData.videoUrl}
              onChange={(e) => {
                update('videoUrl', e.target.value);
                setDurationAutoFilled(false);
              }}
              aria-invalid={!!errors.videoUrl}
              className={fieldInputClass(!!errors.videoUrl, 'pl-11')}
              placeholder="https://youtu.be/… or https://cdn.boostly.buzz/videos/clip.mp4"
            />
          </div>
          {detected && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
                  detected.error
                    ? 'bg-[#FEF2F2] dark:bg-[#EF4444]/10 text-[#B91C1C] dark:text-[#FCA5A5] border-[#FECACA] dark:border-[#EF4444]/20'
                    : detected.warning
                      ? 'bg-[#FFFBEB] dark:bg-[#F59E0B]/10 text-[#92400E] dark:text-[#FDE68A] border-[#FDE68A] dark:border-[#F59E0B]/20'
                      : 'bg-[#F0FDF4] dark:bg-[#22C55E]/10 text-[#166534] dark:text-[#BBF7D0] border-[#BBF7D0] dark:border-[#22C55E]/20',
                )}
              >
                {detected.kind === 'youtube-short' ? (
                  <Smartphone size={13} />
                ) : isYouTube || detected.kind === 'youtube-no-id' ? (
                  <MonitorPlay size={13} />
                ) : isFile ? (
                  <FileVideo size={13} />
                ) : (
                  <AlertTriangle size={13} />
                )}
                Detected: {detected.label}
              </span>
              {isFile && detectedDuration?.url === normalizedVideoUrl && (
                <span className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                  Length {formatDuration(detectedDuration.seconds)}
                </span>
              )}
            </div>
          )}
          {/* Reads the duration of a direct file without playing it. */}
          {probeUrl && (
            <video
              key={probeUrl}
              src={probeUrl}
              preload="metadata"
              muted
              hidden
              onLoadedMetadata={(e) => {
                const d = e.currentTarget.duration;
                if (Number.isFinite(d) && d > 0) handleDetectedDuration(probeUrl, Math.round(d));
              }}
            />
          )}
          <FieldError message={errors.videoUrl} />
          {!errors.videoUrl && detected?.warning && (
            <Callout tone="warning" className="mt-2">
              {detected.warning}
            </Callout>
          )}
          <FieldHint>
            YouTube link (video or Short) or a direct .mp4/.webm link. Only use videos you own or
            have the rights/sponsor permission to use.
          </FieldHint>
        </div>

        {/* Title & Category */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <FieldLabel
              htmlFor="field-title"
              required
              tip={
                <p>
                  Members see the title on the video card and in the player. Say what they will
                  learn or see, not the reward. Cards show about 60 characters before cutting off;
                  the hard limit is {TITLE_MAX}.
                </p>
              }
            >
              Title
            </FieldLabel>
            <div className="relative">
              <Video size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input
                id="field-title"
                type="text"
                maxLength={TITLE_MAX}
                value={formData.title}
                onChange={(e) => update('title', e.target.value)}
                aria-invalid={!!errors.title}
                className={fieldInputClass(!!errors.title, 'pl-11')}
                placeholder="e.g. How to save with mobile money"
              />
            </div>
            <FieldError message={errors.title} />
            <FieldHint>
              Short and clear, ideally under 60 characters ({formData.title.length}/{TITLE_MAX}).
            </FieldHint>
          </div>
          <div>
            <FieldLabel
              htmlFor="field-category"
              required
              tip={<p>Members can filter videos by category on the Earn page.</p>}
            >
              Category
            </FieldLabel>
            <select
              id="field-category"
              value={formData.category}
              onChange={(e) => update('category', e.target.value)}
              className={fieldInputClass(!!errors.category)}
            >
              {VIDEO_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <FieldError message={errors.category} />
            <FieldHint>Where the video is listed when members filter by topic.</FieldHint>
          </div>
        </div>

        {/* Description */}
        <div>
          <FieldLabel
            htmlFor="field-description"
            tip={
              <p>
                Shown under the video. One to three sentences about what the viewer gets out of it.
                Mention the sponsor here only if the video is sponsored.
              </p>
            }
          >
            Description
          </FieldLabel>
          <textarea
            id="field-description"
            value={formData.description}
            onChange={(e) => update('description', e.target.value)}
            className={fieldInputClass(!!errors.description, 'resize-none h-24')}
            placeholder="What will members learn or see in this video?"
          />
          <FieldError message={errors.description} />
          <FieldHint>
            Optional. 1–3 sentences, about 300 characters or fewer reads best ({formData.description.length}).
          </FieldHint>
        </div>

        {/* Thumbnail */}
        <div>
          <FieldLabel
            htmlFor="field-thumbnailUrl"
            tip={
              <>
                <p>
                  Recommended: 1280×720 (16:9) for normal videos, or 720×1280 for vertical videos
                  and Shorts. JPG, PNG or WebP, under 2 MB.
                </p>
                <p>
                  Boostly does not fetch YouTube thumbnails automatically; if you leave this blank
                  members see a default placeholder.
                </p>
              </>
            }
          >
            Thumbnail
          </FieldLabel>
          <div className="relative">
            <ImageIcon size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              id="field-thumbnailUrl"
              type="text"
              inputMode="url"
              autoComplete="off"
              spellCheck={false}
              value={formData.thumbnailUrl}
              onChange={(e) => update('thumbnailUrl', e.target.value)}
              aria-invalid={!!errors.thumbnailUrl}
              className={fieldInputClass(!!errors.thumbnailUrl, 'pl-11')}
              placeholder="https://cdn.boostly.buzz/thumbs/clip.jpg"
            />
          </div>
          <FieldError message={errors.thumbnailUrl} />
          <FieldHint>
            Optional image link: 1280×720 (or 720×1280 for vertical/Shorts), JPG/PNG/WebP, under
            2 MB. Leave blank to show a default.
          </FieldHint>
        </div>

        {/* Thumbnail Preview */}
        {thumbSrc && (
          <div className="p-4 bg-[#F8FAFC] dark:bg-[#0F172A] rounded-xl border border-[#F1F5F9] dark:border-[#334155]">
            <p className="text-sm font-medium text-[#0F172A] dark:text-white mb-2">
              Thumbnail Preview
            </p>
            {thumbFailed ? (
              <Callout tone="warning">
                This image could not be loaded. Check that the link opens an image file.
              </Callout>
            ) : (
              <div className="relative aspect-video w-full max-w-xs rounded-lg overflow-hidden bg-[#F1F5F9] dark:bg-[#334155]">
                <Image
                  src={thumbSrc}
                  alt="Video thumbnail preview"
                  fill
                  className="object-cover"
                  sizes="(max-width: 320px) 100vw, 320px"
                  unoptimized
                  onLoad={(e) =>
                    setThumbSize({
                      w: e.currentTarget.naturalWidth,
                      h: e.currentTarget.naturalHeight,
                    })
                  }
                  onError={() => setThumbFailed(true)}
                />
              </div>
            )}
            {thumbSize && !thumbFailed && (
              <FieldHint>
                Image is {thumbSize.w}×{thumbSize.h}.
                {(() => {
                  const ratio = thumbSize.w / thumbSize.h;
                  const ok = Math.abs(ratio - 16 / 9) < 0.08 || Math.abs(ratio - 9 / 16) < 0.05;
                  if (!ok) return ' It is not 16:9 or 9:16, so it will be cropped on the card.';
                  if (Math.max(thumbSize.w, thumbSize.h) < 1280)
                    return ' It may look blurry; 1280 px on the long side is recommended.';
                  return ' Good size.';
                })()}
              </FieldHint>
            )}
          </div>
        )}

        {/* Duration & Reward */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <FieldLabel
              htmlFor="field-duration"
              required
              tip={
                <>
                  <p>
                    The real length of the video in seconds (2:30 = 150). Members must keep the
                    video open for at least 60% of this time before the reward is paid, so a wrong
                    value either blocks honest viewers (too long) or lets people skip (too short).
                  </p>
                  <p>
                    For direct .mp4/.webm links the length is read from the file automatically. For
                    YouTube, copy it from under the YouTube player.
                  </p>
                </>
              }
            >
              Duration (seconds)
            </FieldLabel>
            <div className="relative">
              <Clock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input
                id="field-duration"
                type="number"
                value={formData.duration}
                onChange={(e) => {
                  update('duration', parseInt(e.target.value) || 0);
                  setDurationAutoFilled(false);
                }}
                aria-invalid={!!errors.duration}
                className={fieldInputClass(!!errors.duration, 'pl-11')}
                placeholder="120"
                min="0"
              />
            </div>
            <FieldError message={errors.duration} />
            {durationAutoFilled && !errors.duration && (
              <FieldHint className="text-[#16A34A] dark:text-[#4ADE80]">
                Filled in from the video file ({formatDuration(formData.duration)}).
              </FieldHint>
            )}
            {durationMismatch && detectedDuration && (
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#92400E] dark:text-[#FDE68A]">
                <AlertTriangle size={12} />
                The file is {detectedDuration.seconds} s long.
                <button
                  type="button"
                  onClick={() => update('duration', detectedDuration.seconds)}
                  className="font-semibold text-[#2563EB] dark:text-[#60A5FA] hover:underline"
                >
                  Use {detectedDuration.seconds} s
                </button>
              </div>
            )}
            <FieldHint>
              Must be accurate: members watch at least 60% of it
              {formData.duration > 0 ? ` (${Math.ceil(formData.duration * 0.6)} s)` : ''} to earn.
            </FieldHint>
          </div>
          <div>
            <FieldLabel
              htmlFor="field-rewardAmount"
              required
              tip={
                <p>
                  Base amount in RWF for one completed view. Members on boosted plans or with badges
                  receive more than this, and each member can earn from the same video once per day.
                </p>
              }
            >
              Reward per completed view (RWF)
            </FieldLabel>
            <div className="relative">
              <Coins size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input
                id="field-rewardAmount"
                type="number"
                value={formData.rewardAmount}
                onChange={(e) => update('rewardAmount', parseInt(e.target.value) || 0)}
                aria-invalid={!!errors.rewardAmount}
                className={fieldInputClass(!!errors.rewardAmount, 'pl-11')}
                placeholder="40"
                min="0"
              />
            </div>
            <FieldError message={errors.rewardAmount} />
            <FieldHint>Base RWF paid per finished view, before plan boosts.</FieldHint>
          </div>
          <div>
            <FieldLabel
              htmlFor="field-rewardBudget"
              tip={
                <>
                  <p>
                    What the sponsor paid for rewards on this video. Every payout (including plan
                    boosts) is taken from it, and payouts stop when it is used up.
                  </p>
                  <p>
                    Leave blank for no campaign limit; the daily platform reward budget still
                    applies.
                  </p>
                </>
              }
            >
              Reward budget (RWF)
            </FieldLabel>
            <input
              id="field-rewardBudget"
              type="number"
              min="1"
              value={formData.rewardBudget ?? ''}
              onChange={(e) =>
                update('rewardBudget', e.target.value ? Number(e.target.value) : null)
              }
              aria-invalid={!!errors.rewardBudget}
              className={fieldInputClass(!!errors.rewardBudget)}
              placeholder="No campaign limit"
            />
            <FieldError message={errors.rewardBudget} />
            {paidViews !== null && !errors.rewardBudget && (
              <p className="mt-1 text-xs font-medium text-[#2563EB] dark:text-[#60A5FA]">
                ≈ {paidViews.toLocaleString()} paid views (estimate, assuming an average plan boost
                of about {AVERAGE_BOOST_ESTIMATE}×)
              </p>
            )}
            {paidViews === 0 && (
              <FieldError message="This budget doesn't cover even one boosted view. Raise it or lower the reward." />
            )}
            <FieldHint>
              Payouts stop when the budget is used up. Leave blank for no campaign limit (the daily
              platform budget still applies).
            </FieldHint>
          </div>
          <PlanAccessField
            value={formData.allowedPlanTiers}
            onChange={(v) => update('allowedPlanTiers', v)}
          />
        </div>

        {/* Difficulty & Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <FieldLabel
              htmlFor="field-difficulty"
              tip={
                <p>
                  How advanced the content is. Stored with the video for sorting and reports; it
                  does not change the reward.
                </p>
              }
            >
              Difficulty
            </FieldLabel>
            <select
              id="field-difficulty"
              value={formData.difficulty}
              onChange={(e) => update('difficulty', e.target.value)}
              className={fieldInputClass(!!errors.difficulty)}
            >
              {VIDEO_DIFFICULTIES.map((diff) => (
                <option key={diff} value={diff}>
                  {diff}
                </option>
              ))}
            </select>
            <FieldError message={errors.difficulty} />
            <FieldHint>Content level (Beginner to Expert). Doesn&apos;t affect the reward.</FieldHint>
          </div>
          <div>
            <FieldLabel
              htmlFor="field-status"
              tip={
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>Draft: hidden from members.</li>
                  <li>Pending review: hidden until approved.</li>
                  <li>Active: members can watch and earn.</li>
                </ul>
              }
            >
              Status
            </FieldLabel>
            <select
              id="field-status"
              value={formData.status}
              onChange={(e) => update('status', e.target.value)}
              aria-invalid={!!errors.status}
              className={fieldInputClass(!!errors.status)}
            >
              {statusOptions.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <FieldError message={errors.status} />
            <FieldHint>{STATUS_HELP[formData.status] ?? 'Who can see this video.'}</FieldHint>
          </div>
        </div>

        {/* Sponsored */}
        <div className="flex items-center gap-3 py-4 border-t border-b border-[#F1F5F9] dark:border-[#334155]">
          <button
            type="button"
            role="switch"
            aria-checked={formData.isSponsored}
            aria-label="Sponsored content"
            onClick={() => update('isSponsored', !formData.isSponsored)}
            className={cn(
              'w-12 h-7 rounded-full transition-colors relative flex-shrink-0',
              formData.isSponsored ? 'bg-[#F59E0B]' : 'bg-[#D1D5DB]',
            )}
          >
            <div
              className={cn(
                'absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-transform',
                formData.isSponsored ? 'right-0.5' : 'left-0.5',
              )}
            />
          </button>
          <div>
            <p className="text-sm font-medium text-[#0F172A] dark:text-white flex items-center gap-2">
              <Star size={16} className="text-[#F59E0B]" />
              Sponsored Content
            </p>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
              Turn on when a brand paid for this video. Sponsor name and website are then required.
            </p>
          </div>
        </div>

        {/* Sponsor Info */}
        {formData.isSponsored && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-[#FFFBEB] dark:bg-[#F59E0B]/5 rounded-xl border border-[#FDE68A] dark:border-[#F59E0B]/20">
            <div>
              <FieldLabel htmlFor="field-sponsorName" required>
                Sponsor Name
              </FieldLabel>
              <input
                id="field-sponsorName"
                type="text"
                value={formData.sponsorName}
                onChange={(e) => update('sponsorName', e.target.value)}
                aria-invalid={!!errors.sponsorName}
                className={fieldInputClass(!!errors.sponsorName)}
                placeholder="e.g. MTN Rwanda"
              />
              <FieldError message={errors.sponsorName} />
              <FieldHint>The brand name members see on the video.</FieldHint>
            </div>
            <div>
              <FieldLabel
                htmlFor="field-sponsorLogo"
                tip={<p>Square PNG, SVG or WebP works best, around 256×256. Leave blank to show only the name.</p>}
              >
                Sponsor Logo URL
              </FieldLabel>
              <input
                id="field-sponsorLogo"
                type="text"
                inputMode="url"
                value={formData.sponsorLogo}
                onChange={(e) => update('sponsorLogo', e.target.value)}
                aria-invalid={!!errors.sponsorLogo}
                className={fieldInputClass(!!errors.sponsorLogo)}
                placeholder="https://example.com/logo.png"
              />
              <FieldError message={errors.sponsorLogo} />
              <FieldHint>Optional link to a square logo image.</FieldHint>
            </div>
            <div className="md:col-span-2">
              <FieldLabel htmlFor="field-sponsorWebsite" required>
                Sponsor Website
              </FieldLabel>
              <input
                id="field-sponsorWebsite"
                type="text"
                inputMode="url"
                value={formData.sponsorWebsite}
                onChange={(e) => update('sponsorWebsite', e.target.value)}
                aria-invalid={!!errors.sponsorWebsite}
                className={fieldInputClass(!!errors.sponsorWebsite)}
                placeholder="mtn.co.rw"
              />
              <FieldError message={errors.sponsorWebsite} />
              <FieldHint>A plain domain like mtn.co.rw is fine; https:// is added for you.</FieldHint>
            </div>
          </div>
        )}

        {/* Tags */}
        <div>
          <FieldLabel
            htmlFor="field-tags"
            tip={
              <p>
                Keywords that help admins and search find the video, e.g. &quot;savings&quot;,
                &quot;mobile money&quot;, &quot;football&quot;. One idea per tag. Links don&apos;t
                belong here; the video link goes in Video source.
              </p>
            }
          >
            Tags
          </FieldLabel>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Tag size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input
                id="field-tags"
                type="text"
                value={tagInput}
                onChange={(e) => {
                  setTagInput(e.target.value);
                  setTagError(null);
                }}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                aria-invalid={tagIsLink || !!tagError}
                className={fieldInputClass(tagIsLink || !!tagError || !!errors.tags, 'pl-11')}
                placeholder="Type a tag and press Enter"
              />
            </div>
            <button
              type="button"
              onClick={addTag}
              disabled={tagIsLink}
              aria-label="Add tag"
              className="px-4 py-2.5 rounded-xl bg-[#2563EB] text-white hover:bg-[#1D4ED8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={18} />
            </button>
          </div>
          {tagIsLink && (
            <div className="mt-2 p-2.5 rounded-lg flex flex-wrap items-center gap-2 text-xs border bg-[#FFFBEB] dark:bg-[#F59E0B]/10 text-[#92400E] dark:text-[#FDE68A] border-[#FDE68A] dark:border-[#F59E0B]/20">
              <AlertTriangle size={14} className="flex-shrink-0" />
              <span className="flex-1 min-w-[12rem]">
                That looks like a link — paste it in Video source instead. Tags are short words.
              </span>
              {!formData.videoUrl.trim() && (
                <button
                  type="button"
                  onClick={useTagAsVideoSource}
                  className="px-2.5 py-1 rounded-lg bg-[#2563EB] text-white font-semibold hover:bg-[#1D4ED8] transition-colors"
                >
                  Use as video source
                </button>
              )}
            </div>
          )}
          <FieldError message={tagError ?? errors.tags} />
          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {formData.tags.map((tag) => (
                <span
                  key={tag}
                  className={cn(
                    'flex items-center gap-1 px-3 py-1 rounded-full text-sm border max-w-full',
                    looksLikeUrl(tag)
                      ? 'bg-[#FFFBEB] dark:bg-[#F59E0B]/10 text-[#92400E] dark:text-[#FDE68A] border-[#FDE68A] dark:border-[#F59E0B]/20'
                      : 'bg-[#F8FAFC] dark:bg-[#334155] text-[#0F172A] dark:text-white border-[#F1F5F9] dark:border-[#334155]',
                  )}
                >
                  <span className="truncate">#{tag}</span>
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    aria-label={`Remove tag ${tag}`}
                    className="hover:text-[#EF4444] transition-colors"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          )}
          {linkTags.length > 0 && (
            <Callout tone="warning" className="mt-2">
              {linkTags.length === 1 ? 'One tag is' : `${linkTags.length} tags are`} a link. Remove
              {linkTags.length === 1 ? ' it' : ' them'} and put the video link in Video source.
            </Callout>
          )}
          <FieldHint>
            Optional short words or phrases (not links), e.g. &quot;savings&quot;. Press Enter to add
            each one.
          </FieldHint>
        </div>

        {/* Message */}
        {message && <FormBanner type={message.type} text={message.text} />}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4 border-t border-[#F1F5F9] dark:border-[#334155]">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 rounded-xl border border-[#F1F5F9] dark:border-[#334155] text-sm font-medium text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F8FAFC] dark:hover:bg-[#334155] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 px-6 py-2.5 rounded-xl bg-[#2563EB] text-white text-sm font-bold hover:bg-[#1D4ED8] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                {submittingLabel}
              </>
            ) : (
              <>
                <Save size={18} />
                {submitLabel}
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
