// Update to survey_responses table type
export type SurveyResponsesRow = {
	id: string;
	user_id: string;
	survey_id: string;
	responses: Record<string, unknown>[]; // JSONB array of responses
	category_scores: Record<string, number>; // JSONB object of category scores
	highest_scoring_category: string | null;
	lowest_scoring_category: string | null;
	completed: boolean;
	created_at: string | null;
	updated_at: string | null;
};

export type SurveyResponsesInsert = {
	id?: string;
	user_id: string;
	survey_id: string;
	responses?: Record<string, unknown>[];
	category_scores?: Record<string, number>;
	highest_scoring_category?: string | null;
	lowest_scoring_category?: string | null;
	completed?: boolean;
	created_at?: string | null;
	updated_at?: string | null;
};

export type SurveyResponsesUpdate = {
	id?: string;
	user_id?: string;
	survey_id?: string;
	responses?: Record<string, unknown>[];
	category_scores?: Record<string, number>;
	highest_scoring_category?: string | null;
	lowest_scoring_category?: string | null;
	completed?: boolean;
	created_at?: string | null;
	updated_at?: string | null;
};

// Add these types to your database.types.ts file
// and update the Tables section for survey_responses
