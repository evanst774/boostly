// scripts/create-surveys.ts
//
// Adds Boostly's own surveys (not presented as outside sponsors). Each has a
// small reward and its own budget, so total payouts are capped:
//   payout per survey ≤ rewardBudget.
//
//   dry run:   npx dotenv -e .env.production -- tsx scripts/create-surveys.ts
//   create:    ... --apply              (as DRAFT, review in Admin > Surveys)
//   publish:   ... --apply --activate   (ACTIVE straight away)
//
// Safe to re-run: surveys whose title already exists are skipped.
import { eq } from 'drizzle-orm';
import { db } from '../src/lib/db';
import { surveyQuestions, surveys, type SurveyCategory } from '../src/lib/db/schema';

type Q =
  | { q: string; type: 'single_choice' | 'likert'; options: string[] }
  | { q: string; type: 'multiple_choice'; options: string[] }
  | { q: string; type: 'rating' }
  | { q: string; type: 'text' };

interface SurveySeed {
  title: string;
  description: string;
  category: SurveyCategory;
  reward: number;
  budget: number;
  questions: Q[];
}

const AGREE = ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'];
const FREQ = ['Every day', 'A few times a week', 'Once a week', 'Rarely', 'Never'];

const SURVEYS: SurveySeed[] = [
  {
    title: 'Your Boostly experience',
    description: 'Tell us what works and what we should improve in the app.',
    category: 'TECHNOLOGY',
    reward: 50,
    budget: 25000,
    questions: [
      { q: 'How easy is Boostly to use?', type: 'rating' },
      { q: 'Which task do you enjoy most?', type: 'single_choice', options: ['Videos', 'Games', 'Surveys'] },
      { q: 'Withdrawals are clear and easy to request.', type: 'likert', options: AGREE },
      { q: 'What would make you use Boostly more?', type: 'multiple_choice', options: ['More games', 'More surveys', 'Faster payouts', 'Higher rewards', 'Better design'] },
      { q: 'How likely are you to recommend Boostly to a friend?', type: 'rating' },
      { q: 'One thing we should change:', type: 'text' },
    ],
  },
  {
    title: 'Mobile phone habits',
    description: 'How you use your phone day to day.',
    category: 'TELECOMMUNICATIONS',
    reward: 40,
    budget: 20000,
    questions: [
      { q: 'How many hours a day do you spend on your phone?', type: 'single_choice', options: ['Less than 1', '1–3', '3–5', '5–8', 'More than 8'] },
      { q: 'What do you use your phone for most?', type: 'multiple_choice', options: ['Messaging', 'Social media', 'Videos', 'Games', 'Mobile money', 'News', 'Work or school'] },
      { q: 'How often do you buy mobile data bundles?', type: 'single_choice', options: ['Daily', 'Weekly', 'Monthly', 'Rarely'] },
      { q: 'How satisfied are you with your network quality?', type: 'rating' },
      { q: 'I would pay more for faster internet.', type: 'likert', options: AGREE },
    ],
  },
  {
    title: 'Entertainment you love',
    description: 'Music, films and shows: what keeps you entertained.',
    category: 'ENTERTAINMENT',
    reward: 40,
    budget: 20000,
    questions: [
      { q: 'Which do you enjoy most?', type: 'single_choice', options: ['Music', 'Films', 'TV series', 'Sports', 'Comedy', 'Podcasts'] },
      { q: 'Where do you usually watch videos?', type: 'multiple_choice', options: ['YouTube', 'TikTok', 'Instagram', 'Facebook', 'TV', 'Streaming apps'] },
      { q: 'How often do you watch videos online?', type: 'single_choice', options: FREQ },
      { q: 'Rate how much you enjoy short videos (1–10).', type: 'rating' },
      { q: 'Your favourite kind of content and why:', type: 'text' },
    ],
  },
  {
    title: 'Learning and skills',
    description: 'How you like to learn new things.',
    category: 'EDUCATION',
    reward: 50,
    budget: 25000,
    questions: [
      { q: 'Which skill would you most like to learn?', type: 'single_choice', options: ['Computer skills', 'A new language', 'Business', 'Design', 'Programming', 'A trade or craft'] },
      { q: 'How do you prefer to learn?', type: 'multiple_choice', options: ['Videos', 'Reading', 'Classes', 'Practice', 'Mentors', 'Apps'] },
      { q: 'Online courses are worth paying for.', type: 'likert', options: AGREE },
      { q: 'How many hours a week could you spend learning?', type: 'single_choice', options: ['Under 1', '1–3', '3–5', '5–10', 'More than 10'] },
      { q: 'How confident are you using a computer (1–10)?', type: 'rating' },
      { q: 'What stops you from learning more?', type: 'multiple_choice', options: ['Time', 'Cost', 'Internet access', 'Finding good courses', 'Motivation'] },
    ],
  },
  {
    title: 'Shopping habits',
    description: 'Where and how you prefer to shop.',
    category: 'SHOPPING',
    reward: 40,
    budget: 20000,
    questions: [
      { q: 'Where do you shop most often?', type: 'single_choice', options: ['Local market', 'Supermarket', 'Small shop', 'Online'] },
      { q: 'How often do you shop online?', type: 'single_choice', options: FREQ },
      { q: 'What matters most when you buy something?', type: 'multiple_choice', options: ['Price', 'Quality', 'Brand', 'Delivery speed', 'Reviews', 'Payment options'] },
      { q: 'I trust paying for goods online.', type: 'likert', options: AGREE },
      { q: 'How would you rate your last online order (1–10)?', type: 'rating' },
    ],
  },
  {
    title: 'Money and saving',
    description: 'How you manage everyday money.',
    category: 'FINANCE',
    reward: 60,
    budget: 30000,
    questions: [
      { q: 'How do you usually receive money?', type: 'multiple_choice', options: ['Mobile money', 'Bank transfer', 'Cash', 'Card'] },
      { q: 'Do you save money every month?', type: 'single_choice', options: ['Yes, always', 'Most months', 'Sometimes', 'Rarely', 'Never'] },
      { q: 'Where do you keep your savings?', type: 'multiple_choice', options: ['Mobile money', 'Bank account', 'Savings group', 'Cash at home', 'Investments'] },
      { q: 'I feel confident managing my money.', type: 'likert', options: AGREE },
      { q: 'What is your main savings goal?', type: 'single_choice', options: ['Emergencies', 'Education', 'A business', 'A house', 'Travel', 'Other'] },
      { q: 'How useful would a savings tips video be (1–10)?', type: 'rating' },
      { q: 'One money tip you would share with a friend:', type: 'text' },
    ],
  },
  {
    title: 'Health and wellbeing',
    description: 'Simple questions about everyday health habits.',
    category: 'HEALTHCARE',
    reward: 40,
    budget: 20000,
    questions: [
      { q: 'How many days a week do you exercise?', type: 'single_choice', options: ['0', '1–2', '3–4', '5 or more'] },
      { q: 'How would you rate your sleep (1–10)?', type: 'rating' },
      { q: 'How many glasses of water do you drink a day?', type: 'single_choice', options: ['1–2', '3–5', '6–8', 'More than 8'] },
      { q: 'I would use a health app if it were free.', type: 'likert', options: AGREE },
      { q: 'Which would help you most?', type: 'multiple_choice', options: ['Exercise plans', 'Healthy recipes', 'Sleep tips', 'Stress tips', 'Doctor advice'] },
    ],
  },
  {
    title: 'Food and cooking',
    description: 'What you like to eat and cook.',
    category: 'LIFESTYLE',
    reward: 30,
    budget: 15000,
    questions: [
      { q: 'How often do you cook at home?', type: 'single_choice', options: FREQ },
      { q: 'Your favourite type of meal:', type: 'single_choice', options: ['Breakfast', 'Lunch', 'Dinner', 'Snacks'] },
      { q: 'How often do you order food for delivery?', type: 'single_choice', options: FREQ },
      { q: 'Rate your cooking skills (1–10).', type: 'rating' },
      { q: 'What would you like to learn to cook?', type: 'text' },
    ],
  },
  {
    title: 'Getting around',
    description: 'How you travel for work, school and errands.',
    category: 'LIFESTYLE',
    reward: 30,
    budget: 15000,
    questions: [
      { q: 'How do you usually travel?', type: 'single_choice', options: ['Walking', 'Bus', 'Motorbike taxi', 'Car', 'Bicycle'] },
      { q: 'How long is your usual daily trip?', type: 'single_choice', options: ['Under 15 min', '15–30 min', '30–60 min', 'Over 1 hour'] },
      { q: 'I would use a ride app more if it were cheaper.', type: 'likert', options: AGREE },
      { q: 'How safe do you feel when travelling (1–10)?', type: 'rating' },
      { q: 'What would improve your daily travel?', type: 'multiple_choice', options: ['Lower prices', 'More buses', 'Better roads', 'Safer driving', 'Travel apps'] },
    ],
  },
  {
    title: 'Games you play',
    description: 'Help us choose the next games for Boostly.',
    category: 'ENTERTAINMENT',
    reward: 50,
    budget: 25000,
    questions: [
      { q: 'Which kind of game do you enjoy most?', type: 'single_choice', options: ['Puzzle', 'Racing', 'Action', 'Board and cards', 'Arcade', 'Word games'] },
      { q: 'How long do you usually play in one go?', type: 'single_choice', options: ['Under 5 min', '5–15 min', '15–30 min', 'Over 30 min'] },
      { q: 'What makes a game fun for you?', type: 'multiple_choice', options: ['Challenge', 'Nice graphics', 'Short rounds', 'Competing with friends', 'Rewards', 'Story'] },
      { q: 'Rate the games on Boostly so far (1–10).', type: 'rating' },
      { q: 'I prefer games that work well on a phone held upright.', type: 'likert', options: AGREE },
      { q: 'Name a game you would love to see here:', type: 'text' },
    ],
  },
];

async function main() {
  const apply = process.argv.includes('--apply');
  const activate = process.argv.includes('--activate');
  const now = new Date();
  const endsAt = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString();
  console.log(apply ? `APPLYING (${activate ? 'ACTIVE' : 'DRAFT'})` : 'DRY RUN (add --apply to write)');

  let created = 0;
  let total = 0;
  for (const s of SURVEYS) {
    const exists = await db.query.surveys.findFirst({ where: eq(surveys.title, s.title) });
    if (exists) {
      console.log(`skip    ${s.title} (already exists)`);
      continue;
    }
    created += 1;
    total += s.budget;
    const minutes = Math.max(2, Math.ceil(s.questions.length * 0.5));
    console.log(`create  ${s.title.padEnd(26)} ${String(s.questions.length).padStart(2)} q  ${s.reward} RWF  budget ${s.budget.toLocaleString()} RWF (≈${Math.floor(s.budget / s.reward)} completions)`);
    if (!apply) continue;
    const [row] = await db
      .insert(surveys)
      .values({
        title: s.title,
        description: s.description,
        brand: 'Boostly',
        category: s.category,
        questionsCount: s.questions.length,
        estimatedTime: minutes,
        rewardAmount: s.reward,
        rewardBudget: s.budget,
        rewardSpent: 0,
        isSponsored: false,
        status: activate ? 'ACTIVE' : 'DRAFT',
        startsAt: now.toISOString(),
        endsAt,
        publishedAt: activate ? now.toISOString() : null,
      })
      .returning();
    await db.insert(surveyQuestions).values(
      s.questions.map((q, i) => ({
        surveyId: row.id,
        question: q.q,
        order: i,
        type: q.type,
        options: 'options' in q ? q.options : [],
        required: true,
      })),
    );
  }
  console.log(`${created} surveys, total budget ${total.toLocaleString()} RWF.${apply ? '' : ' Nothing written.'}`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
