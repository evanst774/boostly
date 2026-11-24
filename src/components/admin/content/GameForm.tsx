// src/components/admin/content/GameForm.tsx
'use client';

import { useState } from 'react';
import { Save, Loader2, ExternalLink } from 'lucide-react';
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
  isValidUrl,
  normalizeUrl,
  parseServerError,
  type FieldErrors,
} from './FieldHelp';

export interface GameFormValues {
  name: string;
  description: string;
  category: string;
  icon: string;
  thumbnailUrl: string;
  gameUrl: string;
  provider: string;
  orientation: string;
  baseReward: number;
  rewardBudget: number | null;
  maxReward: number;
  maxPlaysPerDay: number;
  minPlayDuration: number;
  maxRewardedSecondsPerDay: number;
  difficulty: number;
  isSponsored: boolean;
  sponsorName: string;
  sponsorLogo: string;
  sponsorWebsite: string;
}

export const EMPTY_GAME_FORM: GameFormValues = {
  name: '',
  description: '',
  category: 'PUZZLE',
  icon: '🎮',
  thumbnailUrl: '',
  gameUrl: '',
  provider: 'SELF_HOSTED',
  orientation: 'BOTH',
  baseReward: 50,
  rewardBudget: null,
  maxReward: 150,
  maxPlaysPerDay: 10,
  minPlayDuration: 30,
  maxRewardedSecondsPerDay: 600,
  difficulty: 1,
  isSponsored: false,
  sponsorName: '',
  sponsorLogo: '',
  sponsorWebsite: '',
};

const CATEGORIES = [
  'PUZZLE',
  'ACTION',
  'CASUAL',
  'STRATEGY',
  'QUIZ',
  'RACING',
  'SPORTS',
  'ADVENTURE',
];
const PROVIDERS = ['SELF_HOSTED', 'GAMEPIX', 'GAMEMONETIZE'];
const ORIENTATIONS = ['PORTRAIT', 'LANDSCAPE', 'BOTH'];

const GAMES_PLATFORM = 'https://games.boostly.buzz';
const GAMES_CATALOG = `${GAMES_PLATFORM}/api/v1/games.json`;

/** Hosts Boostly's security policy lets the game player frame. */
function allowedGameHosts(): string[] {
  const hosts = ['games.boostly.buzz'];
  const extra = process.env.NEXT_PUBLIC_GAMES_CDN_URL;
  if (extra) {
    try {
      hosts.push(new URL(extra).hostname);
    } catch {
      /* ignore a malformed value */
    }
  }
  return hosts;
}

const LABELS: Record<string, string> = {
  name: 'Name',
  description: 'Description',
  category: 'Category',
  icon: 'Icon',
  thumbnailUrl: 'Thumbnail URL',
  gameUrl: 'Game URL',
  provider: 'Provider',
  orientation: 'Orientation',
  baseReward: 'Base reward',
  rewardBudget: 'Reward budget',
  maxReward: 'Max reward',
  maxPlaysPerDay: 'Plays per day',
  minPlayDuration: 'Minimum play time',
  maxRewardedSecondsPerDay: 'Max rewarded seconds per day',
  difficulty: 'Difficulty',
  sponsorName: 'Sponsor name',
  sponsorLogo: 'Sponsor logo',
  sponsorWebsite: 'Sponsor website',
};

const FIELD_ORDER = [
  'name',
  'icon',
  'description',
  'category',
  'provider',
  'orientation',
  'thumbnailUrl',
  'gameUrl',
  'rewardBudget',
  'baseReward',
  'maxReward',
  'maxPlaysPerDay',
  'difficulty',
  'minPlayDuration',
  'maxRewardedSecondsPerDay',
  'sponsorName',
  'sponsorLogo',
  'sponsorWebsite',
];

const isWhole = (n: number) => Number.isFinite(n) && Number.isInteger(n);

interface GameUrlCheck {
  error?: string;
  warning?: string;
  /** URL with ?embed=boostly added, when it's missing on a Boostly game. */
  embedFix?: string;
}

function checkGameUrl(raw: string): GameUrlCheck {
  if (!raw.trim()) return { error: 'Paste the link to the game page.' };
  if (!isValidUrl(raw)) return { error: 'This is not a valid link.' };
  const url = new URL(normalizeUrl(raw));
  if (url.protocol !== 'https:') {
    return { error: 'The game link must start with https:// (http links are blocked).' };
  }
  if (typeof window !== 'undefined' && url.origin === window.location.origin) {
    return { error: "Games must be hosted on a different domain than Boostly itself." };
  }
  const host = url.hostname.toLowerCase();
  if (allowedGameHosts().includes(host)) {
    if (url.searchParams.get('embed') !== 'boostly') {
      const fixed = new URL(url.toString());
      fixed.searchParams.set('embed', 'boostly');
      return {
        warning: 'Add ?embed=boostly so the game runs without ads inside Boostly.',
        embedFix: fixed.toString(),
      };
    }
    return {};
  }
  return {
    warning: `${host} is not on Boostly's allowed game list, so the player will most likely show a blank screen. Only games.boostly.buzz is allowed today; another provider needs a developer to allow its domain, and the provider must allow its games to be framed.`,
  };
}

function validate(form: GameFormValues): FieldErrors {
  const e: FieldErrors = {};
  if (!form.name.trim()) e.name = 'Give the game a name.';
  else if (form.name.length > 255) e.name = 'Keep the name to 255 characters or fewer.';

  const urlCheck = checkGameUrl(form.gameUrl);
  if (urlCheck.error) e.gameUrl = urlCheck.error;

  if (form.thumbnailUrl.trim() && !isValidUrl(form.thumbnailUrl))
    e.thumbnailUrl = 'Enter a valid image link, or leave it blank.';

  if (!(form.baseReward > 0)) e.baseReward = 'Enter a reward greater than 0 RWF.';
  if (!(form.maxReward > 0)) e.maxReward = 'Enter a reward greater than 0 RWF.';
  else if (form.baseReward > 0 && form.maxReward < form.baseReward)
    e.maxReward = `Max reward must be at least the base reward (${form.baseReward} RWF).`;

  if (!isWhole(form.maxPlaysPerDay) || form.maxPlaysPerDay < 1 || form.maxPlaysPerDay > 100)
    e.maxPlaysPerDay = 'Enter a whole number from 1 to 100.';

  if (!isWhole(form.difficulty) || form.difficulty < 1 || form.difficulty > 5)
    e.difficulty = 'Enter a whole number from 1 to 5.';

  if (!isWhole(form.minPlayDuration) || form.minPlayDuration < 1 || form.minPlayDuration > 3600)
    e.minPlayDuration = 'Enter whole seconds from 1 to 3600 (1 hour).';

  if (
    !isWhole(form.maxRewardedSecondsPerDay) ||
    form.maxRewardedSecondsPerDay < 1 ||
    form.maxRewardedSecondsPerDay > 28800
  )
    e.maxRewardedSecondsPerDay = 'Enter whole seconds from 1 to 28800 (8 hours).';
  else if (form.minPlayDuration > 0 && form.maxRewardedSecondsPerDay < form.minPlayDuration)
    e.maxRewardedSecondsPerDay = `Must be at least the minimum play time (${form.minPlayDuration} s), or nobody can ever earn.`;

  if (form.rewardBudget !== null && !(form.rewardBudget > 0))
    e.rewardBudget = 'Enter a budget greater than 0, or leave it blank for no campaign limit.';

  if (form.isSponsored) {
    if (!form.sponsorName.trim()) e.sponsorName = 'Sponsored games need the sponsor name.';
    if (!form.sponsorWebsite.trim())
      e.sponsorWebsite = 'Sponsored games need the sponsor website (for example mtn.co.rw).';
    else if (!isValidUrl(form.sponsorWebsite))
      e.sponsorWebsite = 'Enter a website like mtn.co.rw or https://www.mtn.co.rw.';
    if (form.sponsorLogo.trim() && !isValidUrl(form.sponsorLogo))
      e.sponsorLogo = 'Enter a valid image link, or leave it blank.';
  }
  return e;
}

/** Maps a server message without a "field:" prefix to the field it concerns. */
function fieldForServerMessage(message: string): string | undefined {
  if (/^Game URL|^Games must be hosted/i.test(message)) return 'gameUrl';
  if (/^maxReward /.test(message)) return 'maxReward';
  if (/^maxRewardedSecondsPerDay /.test(message)) return 'maxRewardedSecondsPerDay';
  return undefined;
}

/**
 * Drops null values the server can't accept (e.g. an empty sponsoredUntil
 * loaded from the database). rewardBudget keeps null: it means "no limit".
 */
function withoutNulls(values: GameFormValues): GameFormValues {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(values)) {
    if (v === null && k !== 'rewardBudget') continue;
    out[k] = v;
  }
  return out as unknown as GameFormValues;
}

interface GameFormProps {
  initialValues: GameFormValues;
  submitLabel: string;
  onSubmit: (values: GameFormValues) => Promise<void>;
}

export function GameForm({
  initialValues,
  submitLabel,
  onSubmit,
}: GameFormProps) {
  const [form, setForm] = useState<GameFormValues>(initialValues);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});

  const set = <K extends keyof GameFormValues>(
    field: K,
    value: GameFormValues[K],
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const found = validate(form);
    const count = Object.values(found).filter(Boolean).length;
    if (count > 0) {
      setErrors(found);
      setError(
        count === 1
          ? 'Please fix the highlighted field before saving.'
          : `Please fix the ${count} highlighted fields before saving.`,
      );
      focusFirstError(found, FIELD_ORDER);
      return;
    }

    setSaving(true);
    try {
      await onSubmit(withoutNulls(form));
    } catch (err) {
      const raw = err instanceof Error ? err.message : '';
      const parsed = parseServerError(raw || 'Failed to save game', LABELS);
      const field = parsed.field ?? fieldForServerMessage(raw);
      if (field) {
        setErrors((prev) => ({ ...prev, [field]: parsed.text }));
        focusFirstError({ [field]: parsed.text }, FIELD_ORDER);
      }
      setError(parsed.field || !field ? parsed.banner : `${LABELS[field]}: ${parsed.text}`);
    } finally {
      setSaving(false);
    }
  };

  const urlCheck = form.gameUrl.trim() ? checkGameUrl(form.gameUrl) : {};
  const paidPlays = estimatePaidCompletions(form.rewardBudget, form.baseReward);

  // Reward examples (mirrors gamesService: linear from the minimum, capped at max).
  const rewardFor = (seconds: number) =>
    form.minPlayDuration > 0 && seconds >= form.minPlayDuration
      ? Math.min((seconds / form.minPlayDuration) * form.baseReward, form.maxReward)
      : 0;
  const secondsToMax =
    form.baseReward > 0 ? Math.ceil((form.maxReward / form.baseReward) * form.minPlayDuration) : 0;
  const maxDailyPerMember =
    form.minPlayDuration > 0
      ? Math.round(
          Math.min(
            (form.maxRewardedSecondsPerDay / form.minPlayDuration) * form.baseReward,
            form.maxReward * form.maxPlaysPerDay,
          ),
        )
      : 0;
  const rewardsLookValid =
    form.baseReward > 0 &&
    form.maxReward >= form.baseReward &&
    form.minPlayDuration > 0 &&
    form.maxRewardedSecondsPerDay >= form.minPlayDuration &&
    form.maxPlaysPerDay > 0;

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#F1F5F9] dark:border-[#334155] shadow-sm p-6 space-y-6"
    >
      <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
        Fields marked <span className="text-[#EF4444]">*</span> are required. Press the{' '}
        <span className="font-semibold">?</span> next to a label for more detail.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <FieldLabel htmlFor="field-name" required>
            Name
          </FieldLabel>
          <input
            id="field-name"
            maxLength={255}
            className={fieldInputClass(!!errors.name)}
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="e.g. Block Puzzle"
          />
          <FieldError message={errors.name} />
          <FieldHint>The game title members see on the Earn page.</FieldHint>
        </div>
        <div>
          <FieldLabel
            htmlFor="field-icon"
            tip={<p>One emoji shown on the game card when there is no thumbnail.</p>}
          >
            Icon (emoji)
          </FieldLabel>
          <input
            id="field-icon"
            className={fieldInputClass(!!errors.icon)}
            value={form.icon}
            onChange={(e) => set('icon', e.target.value)}
          />
          <FieldError message={errors.icon} />
          <FieldHint>Optional single emoji, used when there is no thumbnail.</FieldHint>
        </div>
      </div>

      <div>
        <FieldLabel htmlFor="field-description">Description</FieldLabel>
        <textarea
          id="field-description"
          className={fieldInputClass(!!errors.description, 'resize-none h-20')}
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="How to play, in one or two sentences"
        />
        <FieldError message={errors.description} />
        <FieldHint>Optional. One or two sentences on how to play.</FieldHint>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <FieldLabel htmlFor="field-category" required>
            Category
          </FieldLabel>
          <select
            id="field-category"
            className={fieldInputClass(!!errors.category)}
            value={form.category}
            onChange={(e) => set('category', e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <FieldError message={errors.category} />
          <FieldHint>The kind of game, for grouping and filters.</FieldHint>
        </div>
        <div>
          <FieldLabel
            htmlFor="field-provider"
            tip={
              <p>
                Where the game comes from. Use SELF_HOSTED for games from games.boostly.buzz. This
                is a label for admins; it does not change how the game loads.
              </p>
            }
          >
            Provider
          </FieldLabel>
          <select
            id="field-provider"
            className={fieldInputClass(!!errors.provider)}
            value={form.provider}
            onChange={(e) => set('provider', e.target.value)}
          >
            {PROVIDERS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <FieldError message={errors.provider} />
          <FieldHint>SELF_HOSTED for games.boostly.buzz games.</FieldHint>
        </div>
        <div>
          <FieldLabel
            htmlFor="field-orientation"
            tip={
              <p>
                How the game is designed to be held: PORTRAIT (upright phone), LANDSCAPE (sideways)
                or BOTH. Stored with the game; the player fills the screen either way.
              </p>
            }
          >
            Orientation
          </FieldLabel>
          <select
            id="field-orientation"
            className={fieldInputClass(!!errors.orientation)}
            value={form.orientation}
            onChange={(e) => set('orientation', e.target.value)}
          >
            {ORIENTATIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
          <FieldError message={errors.orientation} />
          <FieldHint>How the phone is held while playing.</FieldHint>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <FieldLabel
            htmlFor="field-thumbnailUrl"
            tip={<p>Landscape 16:9 image (e.g. 1280×720), JPG/PNG/WebP, under 2 MB.</p>}
          >
            Thumbnail URL
          </FieldLabel>
          <input
            id="field-thumbnailUrl"
            inputMode="url"
            className={fieldInputClass(!!errors.thumbnailUrl)}
            value={form.thumbnailUrl}
            onChange={(e) => set('thumbnailUrl', e.target.value)}
            placeholder="https://games.boostly.buzz/…/thumb.jpg"
          />
          <FieldError message={errors.thumbnailUrl} />
          <FieldHint>Optional 16:9 image link. Leave blank to show the icon.</FieldHint>
        </div>
        <div>
          <FieldLabel
            htmlFor="field-gameUrl"
            required
            tip={
              <>
                <p>
                  The page that runs the game. It must use https:// and allow Boostly to show it in
                  a frame.
                </p>
                <p>
                  Recommended: games from {GAMES_PLATFORM}. Pick one from the{' '}
                  <a
                    href={GAMES_CATALOG}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline font-semibold inline-flex items-center gap-0.5"
                  >
                    game catalog <ExternalLink size={11} />
                  </a>{' '}
                  and add <code>?embed=boostly</code> to its link so ads stay off.
                </p>
                <p>
                  Other providers only work if they allow framing and a developer adds their domain
                  to Boostly&apos;s allowed list.
                </p>
              </>
            }
          >
            Game URL
          </FieldLabel>
          <input
            id="field-gameUrl"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            className={fieldInputClass(!!errors.gameUrl)}
            value={form.gameUrl}
            onChange={(e) => set('gameUrl', e.target.value)}
            placeholder="https://games.boostly.buzz/…/?embed=boostly"
          />
          <FieldError message={errors.gameUrl} />
          {!errors.gameUrl && urlCheck.warning && (
            <Callout tone="warning" className="mt-2">
              <p>{urlCheck.warning}</p>
              {urlCheck.embedFix && (
                <button
                  type="button"
                  onClick={() => set('gameUrl', urlCheck.embedFix as string)}
                  className="mt-1 px-2.5 py-1 rounded-lg bg-[#2563EB] text-white font-semibold hover:bg-[#1D4ED8] transition-colors"
                >
                  Add ?embed=boostly
                </button>
              )}
            </Callout>
          )}
          <FieldHint>
            https link that allows framing. Best: a game from games.boostly.buzz ending in
            ?embed=boostly.
          </FieldHint>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <FieldLabel
            htmlFor="field-rewardBudget"
            tip={
              <>
                <p>
                  What the sponsor paid for rewards on this game. Every payout (including plan
                  boosts) is taken from it, and payouts stop when it is used up.
                </p>
                <p>Leave blank for no campaign limit; the daily platform budget still applies.</p>
              </>
            }
          >
            Reward budget (RWF)
          </FieldLabel>
          <input
            id="field-rewardBudget"
            type="number"
            min={1}
            placeholder="No campaign limit"
            className={fieldInputClass(!!errors.rewardBudget)}
            value={form.rewardBudget ?? ''}
            onChange={(e) => set('rewardBudget', e.target.value ? Number(e.target.value) : null)}
          />
          <FieldError message={errors.rewardBudget} />
          {paidPlays !== null && !errors.rewardBudget && (
            <p className="mt-1 text-xs font-medium text-[#2563EB] dark:text-[#60A5FA]">
              ≈ {paidPlays.toLocaleString()} paid plays at the base reward (estimate, assuming an
              average plan boost of about {AVERAGE_BOOST_ESTIMATE}×; longer plays pay more)
            </p>
          )}
          <FieldHint>
            Payouts stop when the budget is used up. Leave blank for no campaign limit (the daily
            platform budget still applies).
          </FieldHint>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        <div>
          <FieldLabel
            htmlFor="field-baseReward"
            required
            tip={
              <p>
                What one play pays when the member reaches exactly the minimum play time. Longer
                play pays proportionally more (twice the time, twice the reward) up to the max
                reward.
              </p>
            }
          >
            Base Reward (RWF)
          </FieldLabel>
          <input
            id="field-baseReward"
            type="number"
            min={1}
            className={fieldInputClass(!!errors.baseReward)}
            value={form.baseReward}
            onChange={(e) => set('baseReward', Number(e.target.value))}
          />
          <FieldError message={errors.baseReward} />
          <FieldHint>Paid at the minimum play time.</FieldHint>
        </div>
        <div>
          <FieldLabel
            htmlFor="field-maxReward"
            required
            tip={<p>The most one play can pay, however long it lasts. Must be at least the base reward.</p>}
          >
            Max Reward (RWF)
          </FieldLabel>
          <input
            id="field-maxReward"
            type="number"
            min={1}
            className={fieldInputClass(!!errors.maxReward)}
            value={form.maxReward}
            onChange={(e) => set('maxReward', Number(e.target.value))}
          />
          <FieldError message={errors.maxReward} />
          <FieldHint>Cap per play for longer sessions (≥ base).</FieldHint>
        </div>
        <div>
          <FieldLabel
            htmlFor="field-maxPlaysPerDay"
            required
            tip={
              <p>
                How many rewarded plays each member gets on this game per day (1–100). Quick exits
                that don&apos;t reach the minimum time don&apos;t use a play. The member&apos;s
                plan also limits games per day.
              </p>
            }
          >
            Plays per day
          </FieldLabel>
          <input
            id="field-maxPlaysPerDay"
            type="number"
            min={1}
            max={100}
            className={fieldInputClass(!!errors.maxPlaysPerDay)}
            value={form.maxPlaysPerDay}
            onChange={(e) => set('maxPlaysPerDay', Number(e.target.value))}
          />
          <FieldError message={errors.maxPlaysPerDay} />
          <FieldHint>Rewarded plays per member per day (1–100).</FieldHint>
        </div>
        <div>
          <FieldLabel
            htmlFor="field-difficulty"
            tip={<p>1 = easy, 5 = hard. Stored with the game for sorting; it does not change the reward.</p>}
          >
            Difficulty (1-5)
          </FieldLabel>
          <input
            id="field-difficulty"
            type="number"
            min={1}
            max={5}
            className={fieldInputClass(!!errors.difficulty)}
            value={form.difficulty}
            onChange={(e) => set('difficulty', Number(e.target.value))}
          />
          <FieldError message={errors.difficulty} />
          <FieldHint>1 = easy, 5 = hard. Doesn&apos;t affect the reward.</FieldHint>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <FieldLabel
            htmlFor="field-minPlayDuration"
            required
            tip={
              <p>
                Seconds of verified, active play (tab visible, game focused) before a play earns
                anything. Shorter sessions pay nothing and don&apos;t count as a play. 1–3600.
              </p>
            }
          >
            Minimum play time (seconds)
          </FieldLabel>
          <input
            id="field-minPlayDuration"
            type="number"
            min={1}
            max={3600}
            className={fieldInputClass(!!errors.minPlayDuration)}
            value={form.minPlayDuration}
            onChange={(e) => set('minPlayDuration', Number(e.target.value))}
          />
          <FieldError message={errors.minPlayDuration} />
          <FieldHint>Reward unlocks after this much verified play.</FieldHint>
        </div>
        <div>
          <FieldLabel
            htmlFor="field-maxRewardedSecondsPerDay"
            required
            tip={
              <p>
                Total play seconds per member per day that can earn on this game; time beyond this
                is not paid. Must be at least the minimum play time. Up to 28800 (8 hours).
              </p>
            }
          >
            Max rewarded seconds per day
          </FieldLabel>
          <input
            id="field-maxRewardedSecondsPerDay"
            type="number"
            min={1}
            max={28800}
            className={fieldInputClass(!!errors.maxRewardedSecondsPerDay)}
            value={form.maxRewardedSecondsPerDay}
            onChange={(e) => set('maxRewardedSecondsPerDay', Number(e.target.value))}
          />
          <FieldError message={errors.maxRewardedSecondsPerDay} />
          <FieldHint>
            Daily paid-time cap per member
            {form.maxRewardedSecondsPerDay > 0
              ? ` (${Math.round((form.maxRewardedSecondsPerDay / 60) * 10) / 10} min)`
              : ''}
            .
          </FieldHint>
        </div>
      </div>

      {rewardsLookValid && (
        <Callout tone="tip">
          <p>
            With these settings: {form.minPlayDuration} s of play pays {form.baseReward} RWF;{' '}
            {form.minPlayDuration * 2} s pays {Math.round(rewardFor(form.minPlayDuration * 2))} RWF;
            the {form.maxReward} RWF cap is reached after about {secondsToMax} s.
          </p>
          <p>
            One member can earn at most about {maxDailyPerMember.toLocaleString()} RWF a day from
            this game, before plan boosts.
          </p>
        </Callout>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={form.isSponsored}
          aria-label="Sponsored"
          onClick={() => set('isSponsored', !form.isSponsored)}
          className={cn(
            'w-12 h-7 rounded-full transition-colors relative flex-shrink-0',
            form.isSponsored ? 'bg-[#22C55E]' : 'bg-[#D1D5DB]',
          )}
        >
          <div
            className={cn(
              'absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-transform',
              form.isSponsored ? 'right-0.5' : 'left-0.5',
            )}
          />
        </button>
        <div>
          <span className="text-sm font-medium text-[#0F172A] dark:text-white">Sponsored</span>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
            Turn on when a brand paid for this game. Sponsor name and website are then required.
          </p>
        </div>
      </div>

      {form.isSponsored && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <FieldLabel htmlFor="field-sponsorName" required>
              Sponsor Name
            </FieldLabel>
            <input
              id="field-sponsorName"
              className={fieldInputClass(!!errors.sponsorName)}
              value={form.sponsorName}
              onChange={(e) => set('sponsorName', e.target.value)}
              placeholder="e.g. MTN Rwanda"
            />
            <FieldError message={errors.sponsorName} />
            <FieldHint>Brand name shown with the game.</FieldHint>
          </div>
          <div>
            <FieldLabel htmlFor="field-sponsorLogo">Sponsor Logo URL</FieldLabel>
            <input
              id="field-sponsorLogo"
              inputMode="url"
              className={fieldInputClass(!!errors.sponsorLogo)}
              value={form.sponsorLogo}
              onChange={(e) => set('sponsorLogo', e.target.value)}
              placeholder="https://example.com/logo.png"
            />
            <FieldError message={errors.sponsorLogo} />
            <FieldHint>Optional square logo image link.</FieldHint>
          </div>
          <div>
            <FieldLabel htmlFor="field-sponsorWebsite" required>
              Sponsor Website
            </FieldLabel>
            <input
              id="field-sponsorWebsite"
              inputMode="url"
              className={fieldInputClass(!!errors.sponsorWebsite)}
              value={form.sponsorWebsite}
              onChange={(e) => set('sponsorWebsite', e.target.value)}
              placeholder="mtn.co.rw"
            />
            <FieldError message={errors.sponsorWebsite} />
            <FieldHint>A plain domain like mtn.co.rw is fine.</FieldHint>
          </div>
        </div>
      )}

      {error && <FormBanner type="error" text={error} />}

      <button
        type="submit"
        disabled={saving}
        className="px-6 py-2.5 bg-[#2563EB] text-white font-bold rounded-xl hover:bg-[#1D4ED8] transition-colors flex items-center gap-2 disabled:opacity-50"
      >
        {saving ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Save size={16} />
        )}
        {saving ? 'Saving...' : submitLabel}
      </button>
    </form>
  );
}
