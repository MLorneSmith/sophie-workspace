import type { Json } from "~/lib/database.types";

export interface OutlineSection {
	id: string;
	title: string;
	body: Json;
	order: number;
}

export interface OutlineContentsRow {
	id: string;
	presentation_id: string;
	user_id: string;
	account_id: string;
	sections: OutlineSection[];
	created_at: string;
	updated_at: string;
}
