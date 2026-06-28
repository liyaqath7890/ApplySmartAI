export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export type CategoryKey =
  | 'frontend'
  | 'react'
  | 'javascript'
  | 'typescript'
  | 'node'
  | 'fullstack'
  | 'python'
  | 'java'
  | 'devops'
  | 'behavioral'
  | 'hr';

export interface InterviewQuestion {
  id: string;
  category: CategoryKey;
  difficulty: Difficulty;
  question: string;
  expectedKeywords: string[];
  hints?: string[];
  sampleAnswer?: string;
}
