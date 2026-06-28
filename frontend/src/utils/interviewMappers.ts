import { CategoryKey, InterviewQuestion as DataQuestion } from '@/data/interview';
import type { InterviewQuestion as StoreQuestion } from '@/store/interviewPrepStore';

const TECHNICAL_CATEGORIES: CategoryKey[] = [
  'frontend', 'react', 'javascript', 'typescript', 'node', 'fullstack', 'python', 'java', 'devops',
];

export function mapQuestionToStore(q: DataQuestion): StoreQuestion {
  let type: StoreQuestion['type'] = 'technical';
  if (q.category === 'behavioral') type = 'behavioral';
  else if (q.category === 'hr') type = 'hr';
  else if (q.category === 'devops') type = 'system_design';

  let difficulty: StoreQuestion['difficulty'] = 'medium';
  if (q.difficulty === 'Beginner') difficulty = 'easy';
  else if (q.difficulty === 'Advanced') difficulty = 'hard';

  return {
    id: q.id,
    question: q.question,
    type,
    difficulty,
    hint: q.hints?.[0],
    sampleAnswer: q.sampleAnswer,
  };
}

export function isTechnicalCategory(category: CategoryKey): boolean {
  return TECHNICAL_CATEGORIES.includes(category);
}
