import type { Json } from "~/lib/database.types";

export type SlideLayout =
	| "title-only"
	| "title-content"
	| "title-two-column"
	| "section-divider"
	| "image-text"
	| "comparison"
	| "data-chart"
	| "quote"
	| "blank";

export interface StoryboardSlide {
	id: string;
	title: string;
	layout: SlideLayout;
	content: string;
	content_left?: string;
	content_right?: string;
	purpose: string;
	takeaway_headline: string;
	evidence_needed: string;
	speaker_notes: Json;
	visual_notes: string;
	order: number;
}

export interface StoryboardContentsRow {
	id: string;
	presentation_id: string;
	user_id: string;
	account_id: string;
	slides: StoryboardSlide[];
	created_at: string;
	updated_at: string;
}
