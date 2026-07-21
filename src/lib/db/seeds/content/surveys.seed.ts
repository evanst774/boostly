// src/lib/db/seeds/content/surveys.seed.ts
import { db } from '@/lib/db';
import {
  surveys,
  surveyQuestions,
  SurveyStatusEnum,
  SurveyCategoryEnum,
} from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { Survey, SurveyQuestion } from '@/lib/db/schema';

export const surveyData = [
  // ============================================
  // REGULAR SURVEYS
  // ============================================
  {
    title: 'MTN Rwanda Customer Satisfaction Survey',
    description: 'Share your experience with MTN Rwanda services.',
    brand: 'MTN Rwanda',
    brandLogo: '📶',
    brandLogoKey: 'surveys/mtn-logo.png',
    category: SurveyCategoryEnum.TELECOMMUNICATIONS, // ✅ FIXED
    questionsCount: 8,
    estimatedTime: 5,
    rewardAmount: 350,
    isSponsored: true,
    sponsorName: 'MTN Rwanda',
    sponsorLogo: 'https://cdn.boostly.buzz/sponsors/mtn-logo.png',
  },
  {
    title: 'Digital Banking Experience Survey',
    description: 'Tell us about your digital banking experience.',
    brand: 'Bank of Kigali',
    brandLogo: '🏦',
    brandLogoKey: 'surveys/bk-logo.png',
    category: SurveyCategoryEnum.BANKING, // ✅ FIXED
    questionsCount: 5,
    estimatedTime: 3,
    rewardAmount: 200,
    isSponsored: true,
    sponsorName: 'Bank of Kigali',
    sponsorLogo: 'https://cdn.boostly.buzz/sponsors/bk-logo.png',
  },
  {
    title: 'Shopping Habits & Preferences 2025',
    description: 'Help us understand shopping behaviors in Rwanda.',
    brand: 'Carrefour Rwanda',
    brandLogo: '🛒',
    brandLogoKey: 'surveys/carrefour-logo.png',
    category: SurveyCategoryEnum.RETAIL, // ✅ FIXED
    questionsCount: 12,
    estimatedTime: 7,
    rewardAmount: 500,
    isSponsored: true,
    sponsorName: 'Carrefour Rwanda',
    sponsorLogo: 'https://cdn.boostly.buzz/sponsors/carrefour-logo.png',
  },
  {
    title: 'Healthcare Access in Rwanda Study',
    description: 'Share your views on healthcare accessibility.',
    brand: 'RSSB',
    brandLogo: '💊',
    brandLogoKey: 'surveys/rssb-logo.png',
    category: SurveyCategoryEnum.HEALTHCARE, // ✅ FIXED
    questionsCount: 6,
    estimatedTime: 4,
    rewardAmount: 250,
    isSponsored: false,
  },
  {
    title: 'Tech Product Usage Survey',
    description: 'How do you use technology in your daily life?',
    brand: 'MTN Rwanda',
    brandLogo: '💻',
    brandLogoKey: 'surveys/mtn-tech-logo.png',
    category: SurveyCategoryEnum.TECHNOLOGY, // ✅ FIXED
    questionsCount: 10,
    estimatedTime: 6,
    rewardAmount: 400,
    isSponsored: false,
  },
  // ============================================
  // ADDITIONAL REALISTIC SURVEYS
  // ============================================
  {
    title: 'Airtel Rwanda Network Coverage Survey',
    description: 'Help Airtel improve their network coverage.',
    brand: 'Airtel Rwanda',
    brandLogo: '📱',
    brandLogoKey: 'surveys/airtel-logo.png',
    category: SurveyCategoryEnum.TELECOMMUNICATIONS, // ✅ FIXED
    questionsCount: 7,
    estimatedTime: 4,
    rewardAmount: 300,
    isSponsored: true,
    sponsorName: 'Airtel Rwanda',
    sponsorLogo: 'https://cdn.boostly.buzz/sponsors/airtel-logo.png',
  },
  {
    title: 'E-Commerce Shopping Experience Survey',
    description: 'Share your online shopping experience in Rwanda.',
    brand: 'Kigali E-Store',
    brandLogo: '🛍️',
    brandLogoKey: 'surveys/kigali-estore-logo.png',
    category: SurveyCategoryEnum.RETAIL, // ✅ FIXED
    questionsCount: 9,
    estimatedTime: 5,
    rewardAmount: 300,
    isSponsored: false,
  },
  {
    title: 'Education Quality in Rwanda Survey',
    description: 'Help improve education quality in Rwanda.',
    brand: 'Rwanda Education Board',
    brandLogo: '📚',
    brandLogoKey: 'surveys/reb-logo.png',
    category: SurveyCategoryEnum.EDUCATION, // ✅ FIXED
    questionsCount: 8,
    estimatedTime: 5,
    rewardAmount: 350,
    isSponsored: false,
  },
  {
    title: 'Mobile Money Usage Study',
    description: 'Tell us about your mobile money habits.',
    brand: 'MTN MoMo',
    brandLogo: '💰',
    brandLogoKey: 'surveys/mtn-momo-logo.png',
    category: SurveyCategoryEnum.FINANCE, // ✅ FIXED
    questionsCount: 6,
    estimatedTime: 4,
    rewardAmount: 250,
    isSponsored: true,
    sponsorName: 'MTN MoMo',
    sponsorLogo: 'https://cdn.boostly.buzz/sponsors/mtn-momo-logo.png',
  },
];

// Enhanced question templates with more variety
const questionTemplates = [
  // Satisfaction questions
  (brand: string) => `How satisfied are you with ${brand}'s services?`,
  (brand: string) => `How would you rate the quality of ${brand}'s products?`,
  (brand: string) => `How likely are you to recommend ${brand} to others?`,

  // Frequency questions
  (brand: string) => `How often do you use ${brand}'s services?`,
  (brand: string) => `How frequently do you engage with ${brand}'s content?`,

  // Experience questions
  (brand: string) =>
    `How would you rate your overall experience with ${brand}?`,
  (brand: string) => `How would you rate ${brand}'s customer support?`,
  (brand: string) =>
    `How would you rate the user experience of ${brand}'s platform?`,

  // Demographic questions (generic, not brand-specific)
  () => 'What is your age range?',
  () => 'What is your occupation?',
  () => 'What is your monthly income range?',
  () => 'Which Rwandan district do you live in?',
  () => 'What is your highest level of education?',

  // Opinion questions
  (brand: string) => `What improvements would you like to see from ${brand}?`,
  (brand: string) => `What do you like most about ${brand}'s services?`,
  (brand: string) => `What factors influence your decision to use ${brand}?`,
];

// Enhanced question options
const questionOptions = [
  // Likert scale
  [
    'Very Satisfied',
    'Satisfied',
    'Neutral',
    'Dissatisfied',
    'Very Dissatisfied',
  ],
  ['Excellent', 'Good', 'Average', 'Poor', 'Very Poor'],
  ['Very Likely', 'Likely', 'Neutral', 'Unlikely', 'Very Unlikely'],

  // Frequency
  ['Every day', 'Several times a week', 'Once a week', 'Rarely', 'Never'],
  ['Daily', 'Weekly', 'Monthly', 'Rarely', 'Never'],

  // Demographic options
  ['Under 18', '18-24', '25-34', '35-44', '45-54', '55+'],
  ['Student', 'Employed', 'Self-Employed', 'Unemployed', 'Retired'],
  [
    'Under 100,000 RWF',
    '100,000-300,000 RWF',
    '300,000-500,000 RWF',
    '500,000+ RWF',
  ],
  ['Kigali', 'Western', 'Eastern', 'Northern', 'Southern'],
  ['Primary', 'Secondary', 'Diploma', 'Bachelor', 'Master', 'PhD'],

  // Preferences
  ['Quality', 'Price', 'Convenience', 'Brand Reputation', 'Customer Service'],
  ['Cost', 'Reliability', 'Speed', 'Security', 'Ease of Use'],
];

// Map brand to specific questions for realism
const brandSpecificQuestions: Record<string, string[]> = {
  'MTN Rwanda': [
    "How satisfied are you with MTN Rwanda's network coverage?",
    "How would you rate MTN Rwanda's customer service?",
    'How likely are you to recommend MTN Rwanda to a friend?',
    'What improvements would you like to see from MTN Rwanda?',
    "How often do you use MTN Rwanda's mobile money services?",
  ],
  'Bank of Kigali': [
    "How satisfied are you with Bank of Kigali's digital banking platform?",
    "How would you rate Bank of Kigali's customer support?",
    'How likely are you to recommend Bank of Kigali to others?',
    'What banking services do you use most frequently?',
    "How secure do you feel with Bank of Kigali's services?",
  ],
  'Carrefour Rwanda': [
    "How satisfied are you with Carrefour Rwanda's product selection?",
    "How would you rate Carrefour Rwanda's pricing?",
    'How often do you shop at Carrefour Rwanda?',
    'What improvements would you like to see at Carrefour Rwanda?',
    'How would you rate your overall shopping experience at Carrefour?',
  ],
  RSSB: [
    "How satisfied are you with RSSB's healthcare coverage?",
    "How would you rate RSSB's customer service?",
    "How easy is it to access RSSB's healthcare services?",
    'What improvements would you like to see from RSSB?',
    'How likely are you to recommend RSSB to family members?',
  ],
  'Airtel Rwanda': [
    "How satisfied are you with Airtel Rwanda's network coverage?",
    "How would you rate Airtel Rwanda's data packages?",
    'How likely are you to recommend Airtel Rwanda?',
    'What improvements would you like to see from Airtel Rwanda?',
    "How often do you use Airtel Rwanda's services?",
  ],
  'Kigali E-Store': [
    "How satisfied are you with Kigali E-Store's product selection?",
    "How would you rate Kigali E-Store's delivery service?",
    'How likely are you to shop again at Kigali E-Store?',
    'What improvements would you like to see at Kigali E-Store?',
    'How secure do you feel shopping at Kigali E-Store?',
  ],
  'Rwanda Education Board': [
    'How satisfied are you with the quality of education in Rwanda?',
    'How would you rate the accessibility of education in your area?',
    "What improvements would you like to see in Rwanda's education system?",
    'How likely are you to pursue further education in Rwanda?',
    'What subjects do you think should be prioritized in education?',
  ],
  'MTN MoMo': [
    "How satisfied are you with MTN MoMo's services?",
    'How often do you use MTN MoMo for transactions?',
    'How secure do you feel using MTN MoMo?',
    'What improvements would you like to see from MTN MoMo?',
    'How likely are you to recommend MTN MoMo to others?',
  ],
};

// Generic fallback questions
const genericQuestions = [
  'How satisfied are you with this service?',
  'How likely are you to recommend this service to others?',
  'What improvements would you like to see?',
  'How would you rate your overall experience?',
  'Would you use this service again?',
];

export async function seedSurveys(): Promise<{
  surveys: Survey[];
  questions: SurveyQuestion[];
}> {
  console.log('  📋 Seeding surveys...');
  const surveyList: Survey[] = [];
  const questionList: SurveyQuestion[] = [];

  for (const survey of surveyData) {
    let existing = await db.query.surveys.findFirst({
      where: eq(surveys.title, survey.title),
    });

    let createdSurvey: Survey;

    if (!existing) {
      const [newSurvey] = await db
        .insert(surveys)
        .values({
          ...survey,
          status: SurveyStatusEnum.ACTIVE,
          currentParticipants: Math.floor(Math.random() * 150) + 50,
          isSponsored: survey.isSponsored || false,
          sponsorName: survey.sponsorName || null,
          sponsorLogo: survey.sponsorLogo || null,
          maxParticipants: Math.floor(Math.random() * 500) + 200,
          startsAt: new Date().toISOString(),
          endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          publishedAt: new Date().toISOString(),
          views: Math.floor(Math.random() * 100),
          completionRate: Math.random() * 50 + 30,
          averageRating: Math.random() * 2 + 3,
        })
        .returning();
      createdSurvey = newSurvey;
      surveyList.push(createdSurvey);
      console.log(
        `    ✅ Created survey: ${survey.title}${survey.isSponsored ? ' (Sponsored)' : ''}`,
      );

      // Get brand-specific questions or use generic ones
      let questions = brandSpecificQuestions[survey.brand] || genericQuestions;

      // Limit to questionsCount
      questions = questions.slice(0, survey.questionsCount);

      // If we need more questions, pad with generic ones
      while (questions.length < survey.questionsCount) {
        const genericIndex = questions.length % genericQuestions.length;
        questions.push(genericQuestions[genericIndex]);
      }

      // Create questions with realistic options
      for (let i = 0; i < questions.length; i++) {
        // Select appropriate options based on question type
        let options: string[];
        const questionText = questions[i];

        // Determine options based on question content
        if (
          questionText.includes('satisfied') ||
          questionText.includes('rate') ||
          questionText.includes('quality')
        ) {
          options = questionOptions[0];
        } else if (
          questionText.includes('likely') ||
          questionText.includes('recommend')
        ) {
          options = questionOptions[2];
        } else if (
          questionText.includes('often') ||
          questionText.includes('frequently')
        ) {
          options = questionOptions[3];
        } else if (questionText.includes('age')) {
          options = questionOptions[5];
        } else if (questionText.includes('occupation')) {
          options = questionOptions[6];
        } else if (questionText.includes('income')) {
          options = questionOptions[7];
        } else if (
          questionText.includes('district') ||
          questionText.includes('live')
        ) {
          options = questionOptions[8];
        } else if (questionText.includes('education')) {
          options = questionOptions[9];
        } else if (
          questionText.includes('improvements') ||
          questionText.includes('factors')
        ) {
          options = questionOptions[10];
        } else {
          const optionSets = [
            questionOptions[0],
            questionOptions[1],
            questionOptions[2],
            questionOptions[3],
            questionOptions[4],
          ];
          options = optionSets[i % optionSets.length];
        }

        const [question] = await db
          .insert(surveyQuestions)
          .values({
            surveyId: createdSurvey.id,
            question: questionText,
            order: i + 1,
            options: options,
            type: i % 2 === 0 ? 'single_choice' : 'multiple_choice',
          })
          .returning();
        questionList.push(question);
      }
      console.log(
        `      ✅ Created ${questions.length} questions for ${survey.title}`,
      );
    } else {
      surveyList.push(existing);
      console.log(`    ⚠️ Survey exists: ${survey.title}`);
    }
  }

  const sponsoredCount = surveyList.filter((s) => s.isSponsored).length;
  console.log(
    `    📊 ${surveyList.length} surveys seeded (${sponsoredCount} sponsored)`,
  );
  console.log(`    📝 ${questionList.length} total questions created`);

  return { surveys: surveyList, questions: questionList };
}
