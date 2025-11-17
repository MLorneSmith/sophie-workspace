// Type definitions for quiz questions

export interface QuizOption {
	text: string;
	isCorrect: boolean;
}

export interface QuizQuestionData {
	id?: string;
	text: string;
	options: string[] | QuizOption[];
	correctOptionIndex?: number;
	explanation?: unknown;
}

export interface QuizDefinition {
	id?: string;
	slug: string;
	title: string;
	description?: string;
	passingScore?: number;
	questions: QuizQuestionData[];
}
