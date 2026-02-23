/**
 * Mastra singleton — initialized once per process.
 *
 * Uses Postgres (Supabase) for storage. Portkey gateway integration
 * will be added in #503.
 */

import { Mastra } from "@mastra/core";
import { Memory } from "@mastra/memory";
import { PgVector, PostgresStore } from "@mastra/pg";
import { z } from "zod";

import { partnerAgent } from "./agents/partner-agent";
import { researchAgent } from "./agents/research-agent";
import { validatorAgent } from "./agents/validator-agent";
import { CompanyBriefSchema } from "./schemas/company-brief";
import { AudienceBriefSchema } from "./schemas/presentation-artifacts";
import { audienceProfilingWorkflow } from "./workflows/audience-profiling-workflow";
import { postProcessWorkflow } from "./workflows/post-process-workflow";

const MASTRA_STORAGE_ID = "slideheroes-mastra";
const MASTRA_VECTOR_ID = "slideheroes-vectors";
const MASTRA_MEMORY_ID = "slideheroes-memory";
const DEFAULT_EMBEDDING_MODEL = "openai/text-embedding-3-small";

const AudienceBriefWorkingMemorySchema = z.object({
	personName: AudienceBriefSchema.shape.personName.optional(),
	company: AudienceBriefSchema.shape.company.optional(),
	title: AudienceBriefSchema.shape.title.optional(),
	linkedinUrl: AudienceBriefSchema.shape.linkedinUrl.optional(),
	briefText: AudienceBriefSchema.shape.briefText.optional(),
	briefStructured: AudienceBriefSchema.shape.briefStructured.optional(),
});

const CompanyBriefWorkingMemorySchema = z.object({
	companySnapshot: CompanyBriefSchema.shape.companySnapshot
		.partial()
		.optional(),
	currentSituation: CompanyBriefSchema.shape.currentSituation
		.partial()
		.optional(),
	industryContext: CompanyBriefSchema.shape.industryContext
		.partial()
		.optional(),
	presentationImplications: CompanyBriefSchema.shape.presentationImplications
		.partial()
		.optional(),
});

export const MastraWorkingMemorySchema = z.object({
	audienceBrief: AudienceBriefWorkingMemorySchema.optional(),
	companyBrief: CompanyBriefWorkingMemorySchema.optional(),
});

export type MastraWorkingMemory = z.infer<typeof MastraWorkingMemorySchema>;

let _mastra: Mastra | null = null;
let _storage: PostgresStore | null = null;
let _memory: Memory | null = null;
let _pgVector: PgVector | null = null;

function getConnectionString(): string {
	const connectionString =
		process.env.MASTRA_PG_CONNECTION_STRING ?? process.env.DATABASE_URL;

	if (!connectionString) {
		throw new Error(
			"Missing MASTRA_PG_CONNECTION_STRING or DATABASE_URL for Mastra storage",
		);
	}

	return connectionString;
}

function getEmbeddingModelId(): string {
	return process.env.MASTRA_EMBEDDING_MODEL ?? DEFAULT_EMBEDDING_MODEL;
}

function getStorage(): PostgresStore {
	if (_storage) {
		return _storage;
	}

	_storage = new PostgresStore({
		id: MASTRA_STORAGE_ID,
		connectionString: getConnectionString(),
	});

	return _storage;
}

export function getPgVector(): PgVector {
	if (_pgVector) {
		return _pgVector;
	}

	_pgVector = new PgVector({
		id: MASTRA_VECTOR_ID,
		connectionString: getConnectionString(),
	});

	return _pgVector;
}

export function getMastraMemory(): Memory {
	if (_memory) {
		return _memory;
	}

	_memory = new Memory({
		storage: getStorage(),
		vector: getPgVector(),
		embedder: getEmbeddingModelId(),
		options: {
			lastMessages: 20,
			semanticRecall: {
				topK: 5,
				messageRange: { before: 2, after: 1 },
			},
			workingMemory: {
				enabled: true,
				scope: "resource",
				schema: MastraWorkingMemorySchema,
			},
		},
	});

	return _memory;
}

/**
 * Returns the shared Mastra singleton. Creates it on first call.
 *
 * Database connection uses MASTRA_PG_CONNECTION_STRING or falls back
 * to DATABASE_URL (Supabase direct connection).
 */
export function getMastra(): Mastra {
	if (_mastra) return _mastra;

	const storage = getStorage();
	const memory = getMastraMemory();
	const vector = getPgVector();

	// Shared memory stack for agents that need conversational context,
	// semantic recall, and structured working memory.
	researchAgent.__setMemory(memory);
	partnerAgent.__setMemory(memory);
	validatorAgent.__setMemory(memory);

	_mastra = new Mastra({
		storage,
		memory: {
			[MASTRA_MEMORY_ID]: memory,
		},
		vectors: {
			[MASTRA_VECTOR_ID]: vector,
		},
		agents: {
			researchAgent,
			partnerAgent,
			validatorAgent,
		},
		workflows: {
			audienceProfilingWorkflow,
			postProcessWorkflow,
		},
	});

	return _mastra;
}
