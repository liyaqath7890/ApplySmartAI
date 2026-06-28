import {
  InterviewQuestion,
  Difficulty,
  CategoryKey,
  frontendQuestions,
  reactQuestions,
  javascriptQuestions,
  typescriptQuestions,
  nodeQuestions,
  fullstackQuestions,
  pythonQuestions,
  javaQuestions,
  devopsQuestions,
  behavioralQuestions,
  hrQuestions,
} from '../data/interview';

// ─── Registry ─────────────────────────────────────────────────────────────────

export const ALL_QUESTIONS: InterviewQuestion[] = [
  ...frontendQuestions,
  ...reactQuestions,
  ...javascriptQuestions,
  ...typescriptQuestions,
  ...nodeQuestions,
  ...fullstackQuestions,
  ...pythonQuestions,
  ...javaQuestions,
  ...devopsQuestions,
  ...behavioralQuestions,
  ...hrQuestions,
];

// ─── Category Metadata ────────────────────────────────────────────────────────

export interface CategoryMeta {
  key: CategoryKey;
  label: string;
  description: string;
  icon: string;
  questionCount: number;
}

export const CATEGORY_META: CategoryMeta[] = [
  { key: 'frontend',   label: 'Frontend Developer',   description: 'HTML, CSS, browser APIs, performance', icon: '🖥️', questionCount: 0 },
  { key: 'react',      label: 'React Developer',      description: 'React, hooks, patterns, performance',  icon: '⚛️', questionCount: 0 },
  { key: 'javascript', label: 'JavaScript',           description: 'Core JS, async, closures, ES6+',       icon: '📜', questionCount: 0 },
  { key: 'typescript', label: 'TypeScript',           description: 'Types, generics, advanced patterns',   icon: '🔷', questionCount: 0 },
  { key: 'node',       label: 'Node.js Developer',    description: 'Node runtime, Express, APIs, async',   icon: '🟢', questionCount: 0 },
  { key: 'fullstack',  label: 'Full Stack Developer', description: 'REST, databases, auth, architecture',  icon: '⚡', questionCount: 0 },
  { key: 'python',     label: 'Python Developer',     description: 'Python, OOP, async, FastAPI',          icon: '🐍', questionCount: 0 },
  { key: 'java',       label: 'Java Developer',       description: 'Java, OOP, Spring, concurrency',       icon: '☕', questionCount: 0 },
  { key: 'devops',     label: 'DevOps Engineer',      description: 'Docker, Kubernetes, CI/CD, cloud',     icon: '⚙️', questionCount: 0 },
  { key: 'behavioral', label: 'Behavioral Interview', description: 'STAR method, soft skills, leadership', icon: '🧠', questionCount: 0 },
  { key: 'hr',         label: 'HR Interview',         description: 'Culture fit, salary, motivation',      icon: '🤝', questionCount: 0 },
];

CATEGORY_META.forEach(cat => {
  cat.questionCount = ALL_QUESTIONS.filter(q => q.category === cat.key).length;
});

// ─── Core Functions ───────────────────────────────────────────────────────────

export function getQuestionsByCategory(category: CategoryKey): InterviewQuestion[] {
  return ALL_QUESTIONS.filter(q => q.category === category);
}

export function getQuestionsByDifficulty(difficulty: Difficulty): InterviewQuestion[] {
  return ALL_QUESTIONS.filter(q => q.difficulty === difficulty);
}

/** Fisher-Yates shuffle — never mutates input array. */
export function shuffleQuestions(questions: InterviewQuestion[]): InterviewQuestion[] {
  const arr = [...questions];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function getRandomQuestions(pool: InterviewQuestion[], count: number): InterviewQuestion[] {
  return shuffleQuestions(pool).slice(0, Math.min(count, pool.length));
}

// ─── Interview Set Generator ──────────────────────────────────────────────────

export interface InterviewSetOptions {
  category: CategoryKey;
  difficulty: Difficulty | 'Mixed';
  count: 5 | 10 | 15 | 20;
}

export function generateInterviewSet(options: InterviewSetOptions): InterviewQuestion[] {
  const { category, difficulty, count } = options;
  const pool = getQuestionsByCategory(category);
  if (pool.length === 0) return [];

  if (difficulty === 'Mixed') {
    const b = shuffleQuestions(pool.filter(q => q.difficulty === 'Beginner'));
    const i = shuffleQuestions(pool.filter(q => q.difficulty === 'Intermediate'));
    const a = shuffleQuestions(pool.filter(q => q.difficulty === 'Advanced'));
    const third = Math.floor(count / 3);
    const selected: InterviewQuestion[] = [
      ...b.slice(0, third),
      ...i.slice(0, third + (count % 3 > 0 ? 1 : 0)),
      ...a.slice(0, Math.ceil(count / 3)),
    ];
    // Fill gaps if any bucket was short
    if (selected.length < count) {
      const usedIds = new Set(selected.map(q => q.id));
      const filler = shuffleQuestions(pool.filter(q => !usedIds.has(q.id)));
      selected.push(...filler.slice(0, count - selected.length));
    }
    return shuffleQuestions(selected).slice(0, count);
  }

  const filtered = pool.filter(q => q.difficulty === difficulty);
  if (filtered.length >= count) return getRandomQuestions(filtered, count);

  // Not enough at this difficulty — fill from rest of pool
  const shuffled = shuffleQuestions(filtered);
  const usedIds = new Set(shuffled.map(q => q.id));
  const filler = shuffleQuestions(pool.filter(q => !usedIds.has(q.id)));
  return [...shuffled, ...filler].slice(0, count);
}

// ─── Scoring Engine ───────────────────────────────────────────────────────────

export interface AnswerScore {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  feedback: string;
  strengths: string[];
  improvements: string[];
  keywordsCovered: string[];
  keywordsMissed: string[];
}

export function scoreAnswer(answer: string, question: InterviewQuestion): AnswerScore {
  const trimmed = answer.trim();

  if (!trimmed || trimmed.length < 20) {
    return {
      score: 0, grade: 'F',
      feedback: 'Answer is too brief. Please provide a detailed response.',
      strengths: [],
      improvements: ['Write at least 2–3 sentences', 'Include specific examples', 'Cover expected concepts'],
      keywordsCovered: [],
      keywordsMissed: question.expectedKeywords,
    };
  }

  const lower = trimmed.toLowerCase();
  const covered = question.expectedKeywords.filter(kw => lower.includes(kw.toLowerCase()));
  const missed  = question.expectedKeywords.filter(kw => !lower.includes(kw.toLowerCase()));

  const keywordScore = question.expectedKeywords.length > 0
    ? Math.round((covered.length / question.expectedKeywords.length) * 50)
    : 25;

  const lengthScore =
    trimmed.length > 600 ? 20 :
    trimmed.length > 400 ? 16 :
    trimmed.length > 200 ? 12 :
    trimmed.length > 100 ? 8  : 4;

  const hasStructure  = /first|second|then|finally|additionally|however|because|therefore|for example/i.test(trimmed);
  const hasNumbers    = /\d+/.test(trimmed);
  const hasExamples   = /example|such as|like|used|built|implemented|created|designed|at my/i.test(trimmed);

  const structureScore    = hasStructure ? 15 : 5;
  const specificityScore  = (hasNumbers ? 8 : 0) + (hasExamples ? 7 : 0);

  const total = Math.min(100, keywordScore + lengthScore + structureScore + specificityScore);

  const grade: AnswerScore['grade'] =
    total >= 90 ? 'A' : total >= 80 ? 'B' : total >= 70 ? 'C' : total >= 60 ? 'D' : 'F';

  const strengths: string[]    = [];
  const improvements: string[] = [];

  if (covered.length > 0)    strengths.push(`Covered key concepts: ${covered.slice(0, 3).join(', ')}`);
  if (hasStructure)           strengths.push('Good structured explanation');
  if (hasNumbers)             strengths.push('Used specific numbers or metrics');
  if (hasExamples)            strengths.push('Provided concrete examples');
  if (trimmed.length > 400)   strengths.push('Thorough and detailed answer');

  if (missed.length > 0)      improvements.push(`Missing concepts: ${missed.slice(0, 3).join(', ')}`);
  if (!hasStructure)          improvements.push('Use structured format (numbered points or STAR method)');
  if (!hasNumbers)            improvements.push('Add specific numbers, percentages or timeframes');
  if (!hasExamples)           improvements.push('Include a real-world example from your experience');
  if (trimmed.length < 200)   improvements.push('Expand your answer with more detail');

  const feedback =
    total >= 90 ? 'Excellent! Comprehensive, well-structured and specific.' :
    total >= 80 ? 'Strong answer. A few more keywords would make it perfect.' :
    total >= 70 ? 'Good answer. Add more depth and cover missing concepts.' :
    total >= 60 ? 'Fair. Needs more detail, structure, and keyword coverage.' :
                  'Needs improvement. Review the topic and practice with examples.';

  return { score: total, grade, feedback, strengths, improvements, keywordsCovered: covered, keywordsMissed: missed };
}

export interface SessionResult {
  overallScore: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  answeredCount: number;
  skippedCount: number;
  strengths: string[];
  improvements: string[];
}

export function calculateSessionScore(
  answers: Array<{ answer: string; skipped: boolean; question: InterviewQuestion }>,
): SessionResult {
  const answered = answers.filter(a => !a.skipped && a.answer.trim().length > 0);
  const skipped  = answers.filter(a => a.skipped);

  if (answered.length === 0) {
    return { overallScore: 0, grade: 'F', answeredCount: 0, skippedCount: skipped.length, strengths: [], improvements: ['Answer at least one question to receive a score'] };
  }

  const scored = answered.map(a => scoreAnswer(a.answer, a.question));
  const overallScore = Math.round(scored.reduce((sum, s) => sum + s.score, 0) / scored.length);
  const grade: SessionResult['grade'] =
    overallScore >= 90 ? 'A' : overallScore >= 80 ? 'B' : overallScore >= 70 ? 'C' : overallScore >= 60 ? 'D' : 'F';

  return {
    overallScore,
    grade,
    answeredCount: answered.length,
    skippedCount: skipped.length,
    strengths:    [...new Set(scored.flatMap(s => s.strengths))].slice(0, 4),
    improvements: [...new Set(scored.flatMap(s => s.improvements))].slice(0, 4),
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function getRecommendedDuration(questionCount: number): number {
  return questionCount * 180; // 3 min per question
}
