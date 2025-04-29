/**
 * Type definitions for the Quiz System Repair module
 * Contains interfaces and types used throughout the quiz relationship repair system
 */
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

export interface QuizData {
  id: string;
  title: string;
  slug: string;
  questions?: any; // JSONB array of question objects
}

export interface QuestionData {
  id: string;
  question: string;
  options?: any; // JSONB array of options
  correct_answer?: string;
  type?: string;
  explanation?: string;
}

export interface QuizToQuestionRel {
  _parent_id: string; // Quiz ID
  quiz_questions_id: string; // Question ID
  path?: string;
  id?: string;
}

export interface QuestionToQuizRel {
  _parent_id: string; // Question ID
  field: string; // Should be 'quiz_id'
  value: string; // Quiz ID
  id?: string;
}

export interface RelationshipIssue {
  type:
    | 'missing_primary'
    | 'missing_bidirectional'
    | 'jsonb_format'
    | 'field_mismatch';
  quiz_id?: string;
  question_id?: string;
  details: string;
}

export interface QuizSystemState {
  quizzes: QuizData[];
  questions: QuestionData[];
  quizToQuestions: Map<string, string[]>; // Quiz ID -> Question IDs
  questionToQuiz: Map<string, string>; // Question ID -> Quiz ID
  issues: RelationshipIssue[];
}

export interface RepairOptions {
  skipVerification?: boolean;
  continueOnError?: boolean;
  dryRun?: boolean;
  verbose?: boolean;
}

export interface PrimaryRepairResult {
  relationshipsCreated: number;
  newRelationships: QuizToQuestionRel[];
}

export interface BidirectionalRepairResult {
  relationshipsCreated: number;
  newRelationships: QuestionToQuizRel[];
}

export interface JsonbFormatResult {
  quizzesUpdated: number;
  updatedQuizzes: Partial<QuizData>[];
}

export interface VerificationResult {
  success: boolean;
  issues: any[];
  message: string;
  counts?: any;
}

export interface RepairResult {
  success: boolean;
  primaryResult?: PrimaryRepairResult;
  bidirectionalResult?: BidirectionalRepairResult;
  jsonbResult?: JsonbFormatResult;
  verificationResult?: VerificationResult;
  error?: string;
}

export interface DbContext {
  db: PostgresJsDatabase;
}
