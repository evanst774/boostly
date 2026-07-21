// src/lib/db/seeds/content/index.ts
import { seedGames } from './games.seed';
import { seedSurveys } from './surveys.seed';
import { seedVideos } from './videos.seed';

export { seedVideos } from './videos.seed';
export { seedGames } from './games.seed';
export { seedSurveys } from './surveys.seed';

export async function seedContent() {
  const videos = await seedVideos();
  const games = await seedGames();
  const { surveys, questions } = await seedSurveys();
  return { videos, games, surveys, surveyQuestions: questions };
}
