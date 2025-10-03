import type { QuizDefinition } from "./definitions/quiz-types";

// Corrected import path to source file

/**
 * Static definitions for all quizzes in the system.
 * This is the SINGLE SOURCE OF TRUTH for quiz data.
 * Updated by update-quiz-definitions.ts script on 2025-04-25T15:04:49.218Z
 */
export const QUIZZES: Record<string, QuizDefinition> = {
	"gestalt-principles-quiz": {
		id: "3c72b383-e17e-4b07-8a47-451cfbff29c0",
		slug: "gestalt-principles-quiz",
		title: "Gestalt Principles of Visual Perception Quiz",
		description: "Quiz on Gestalt principles and their application in design",
		passingScore: 70,
		questions: [
			{
				id: "2e62e970-c4ac-4d05-b6a7-dad81250e986",
				text: "The principle of similarity states that we tend to group things which share visual characteristics such as:",
				options: ["Option 1 (correct)", "Option 2", "Option 3", "Option 4"],
				correctOptionIndex: 0,
				explanation:
					'{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}',
			},
			{
				id: "74794823-dcb6-4f2d-a964-3e94f5863f5d",
				text: "What are the visual attribute triggers of pre-attentive processing?",
				options: ["Option 1 (correct)", "Option 2", "Option 3", "Option 4"],
				correctOptionIndex: 0,
				explanation:
					'{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}',
			},
			{
				id: "fc904a38-82f9-43aa-a0fd-1ae817d2c1dd",
				text: "What is visual thinking?",
				options: ["Option 1 (correct)", "Option 2", "Option 3", "Option 4"],
				correctOptionIndex: 0,
				explanation:
					'{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}',
			},
		],
	},
	"idea-generation-quiz": {
		id: "a84d3844-8c19-4c82-8a98-902c530a1a99",
		slug: "idea-generation-quiz",
		title: "Idea Generation Quiz",
		description: "Quiz for Idea Generation",
		passingScore: 70,
		questions: [
			{
				id: "e3efc846-c4dc-418c-8452-98644c1e8b57",
				text: "What are the three Golden Rules to follow when applying the principle of abstraction and organizing your ideas?",
				options: ["Option 1 (correct)", "Option 2", "Option 3", "Option 4"],
				correctOptionIndex: 0,
				explanation:
					'{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}',
			},
		],
	},
	"our-process-quiz": {
		id: "5a8d6b7c-9e2f-4d3a-8b1c-0f9a2e4d5c6b",
		slug: "our-process-quiz",
		title: "Our Process Quiz",
		description: "Quiz for Our Process",
		passingScore: 70,
		questions: [
			{
				id: "262b193c-b494-4aaa-868a-1b52cdd98c34",
				text: "What is the 3rd step of our process?",
				options: ["Option 1 (correct)", "Option 2", "Option 3", "Option 4"],
				correctOptionIndex: 0,
				explanation:
					'{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}',
			},
			{
				id: "26739c2c-56c2-48b2-8699-1f4a02784846",
				text: "What is the second step of the recommended preparation process?",
				options: ["Option 1 (correct)", "Option 2", "Option 3", "Option 4"],
				correctOptionIndex: 0,
				explanation:
					'{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}',
			},
			{
				id: "2ce69acb-8d3f-41b3-9851-7cd5cd508dc8",
				text: "Match the type of mental processing with the characteristic: 'Conscious, sequential, and slow/hard'",
				options: ["Option 1 (correct)", "Option 2", "Option 3", "Option 4"],
				correctOptionIndex: 0,
				explanation:
					'{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}',
			},
			{
				id: "3d65df89-ba7b-4039-816b-f6a86ed6fb4a",
				text: "What is the 4th step of our process?",
				options: ["Option 1 (correct)", "Option 2", "Option 3", "Option 4"],
				correctOptionIndex: 0,
				explanation:
					'{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}',
			},
			{
				id: "4b951049-4e15-4cb0-b048-3db4d691255c",
				text: "What is the fourth step of the recommended preparation process?",
				options: ["Option 1 (correct)", "Option 2", "Option 3", "Option 4"],
				correctOptionIndex: 0,
				explanation:
					'{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}',
			},
		],
	},
	"fact-persuasion-quiz": {
		id: "791e27de-2c98-49ef-b684-6c88667d1571",
		slug: "fact-persuasion-quiz",
		title: "Overview of Fact-based Persuasion Quiz",
		description: "Quiz on using facts for persuasive presentations",
		passingScore: 70,
		questions: [
			{
				id: "0a7fcdf6-2c26-4272-801a-d037946fac20",
				text: "What is the rule of 7 (updated)?",
				options: ["Option 1 (correct)", "Option 2", "Option 3", "Option 4"],
				correctOptionIndex: 0,
				explanation:
					'{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}',
			},
			{
				id: "0c09da5c-fff3-41f1-9505-da246426eb4e",
				text: "Pick the question that corresponds with the 'Personality' quadrant",
				options: ["Option 1 (correct)", "Option 2", "Option 3", "Option 4"],
				correctOptionIndex: 0,
				explanation:
					'{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}',
			},
			{
				id: "0c13fb7a-23dc-46f4-8755-7658939b1695",
				text: "What chart type best communicates the 'Geospatial' relationship?",
				options: ["Option 1 (correct)", "Option 2", "Option 3", "Option 4"],
				correctOptionIndex: 0,
				explanation:
					'{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}',
			},
		],
	},
	"overview-elements-of-design-quiz": {
		id: "c7d8e9f0-a1b2-3c4d-5e6f-7a8b9c0d1e2f",
		slug: "overview-elements-of-design-quiz",
		title: "Overview of the Fundamental Elements of Design Quiz",
		description: "Quiz for Overview of the Fundamental Elements of Design",
		passingScore: 70,
		questions: [
			{
				id: "1044fc96-82b5-4fab-8796-6836bd26d926",
				text: "What are some of the fundamental elements and principles of design?",
				options: ["Option 1 (correct)", "Option 2", "Option 3", "Option 4"],
				correctOptionIndex: 0,
				explanation:
					'{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}',
			},
			{
				id: "fce7779c-e79a-4f77-84af-c165c2ccd5e2",
				text: "What elements can be repeated on all slides?",
				options: ["Option 1 (correct)", "Option 2", "Option 3", "Option 4"],
				correctOptionIndex: 0,
				explanation:
					'{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}',
			},
		],
	},
	"performance-quiz": {
		id: "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
		slug: "performance-quiz",
		title: "Performance Quiz",
		description: "Quiz for Performance",
		passingScore: 70,
		questions: [
			{
				id: "0a7fcdf6-2c26-4272-801a-d037946fac20",
				text: "What is the rule of 7 (updated)?",
				options: ["Option 1 (correct)", "Option 2", "Option 3", "Option 4"],
				correctOptionIndex: 0,
				explanation:
					'{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}',
			},
			{
				id: "0c09da5c-fff3-41f1-9505-da246426eb4e",
				text: "Pick the question that corresponds with the 'Personality' quadrant",
				options: ["Option 1 (correct)", "Option 2", "Option 3", "Option 4"],
				correctOptionIndex: 0,
				explanation:
					'{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}',
			},
			{
				id: "0c13fb7a-23dc-46f4-8755-7658939b1695",
				text: "What chart type best communicates the 'Geospatial' relationship?",
				options: ["Option 1 (correct)", "Option 2", "Option 3", "Option 4"],
				correctOptionIndex: 0,
				explanation:
					'{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}',
			},
		],
	},
	"preparation-practice-quiz": {
		id: "f1e2d3c4-b5a6-9876-5432-1098f7e6d5c4",
		slug: "preparation-practice-quiz",
		title: "Perparation & Practice Quiz",
		description: "Quiz for Perparation & Practice",
		passingScore: 70,
		questions: [
			{
				id: "0a7fcdf6-2c26-4272-801a-d037946fac20",
				text: "What is the rule of 7 (updated)?",
				options: ["Option 1 (correct)", "Option 2", "Option 3", "Option 4"],
				correctOptionIndex: 0,
				explanation:
					'{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}',
			},
			{
				id: "0c09da5c-fff3-41f1-9505-da246426eb4e",
				text: "Pick the question that corresponds with the 'Personality' quadrant",
				options: ["Option 1 (correct)", "Option 2", "Option 3", "Option 4"],
				correctOptionIndex: 0,
				explanation:
					'{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}',
			},
			{
				id: "0c13fb7a-23dc-46f4-8755-7658939b1695",
				text: "What chart type best communicates the 'Geospatial' relationship?",
				options: ["Option 1 (correct)", "Option 2", "Option 3", "Option 4"],
				correctOptionIndex: 0,
				explanation:
					'{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}',
			},
		],
	},
	"slide-composition-quiz": {
		id: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
		slug: "slide-composition-quiz",
		title: "Slide Composition Quiz",
		description: "Quiz for Slide Composition",
		passingScore: 70,
		questions: [
			{
				id: "eaa3bbc0-261c-4dc2-9048-f4e533079018",
				text: "What goes in the body of the slide?",
				options: ["Option 1 (correct)", "Option 2", "Option 3", "Option 4"],
				correctOptionIndex: 0,
				explanation:
					'{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}',
			},
			{
				id: "fce7779c-e79a-4f77-84af-c165c2ccd5e2",
				text: "What elements can be repeated on all slides?",
				options: ["Option 1 (correct)", "Option 2", "Option 3", "Option 4"],
				correctOptionIndex: 0,
				explanation:
					'{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}',
			},
		],
	},
	"specialist-graphs-quiz": {
		id: "d4c3b2a1-f6e5-8a7b-9c0d-1e2f3a4b5c6d",
		slug: "specialist-graphs-quiz",
		title: "Specialist Graphs Quiz",
		description: "Quiz for Specialist Graphs",
		passingScore: 70,
		questions: [
			{
				id: "513ceeab-b02c-4072-92cb-60c31058691b",
				text: "What is graphical excellence?",
				options: ["Option 1 (correct)", "Option 2", "Option 3", "Option 4"],
				correctOptionIndex: 0,
				explanation:
					'{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}',
			},
			{
				id: "5a00e6fa-81dd-4adb-a881-6aa820eace27",
				text: "When should you use graphs?",
				options: ["Option 1 (correct)", "Option 2", "Option 3", "Option 4"],
				correctOptionIndex: 0,
				explanation:
					'{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}',
			},
			{
				id: "97d252f3-a7b5-41ab-bbbc-f6457d99ef4e",
				text: "What are some of the characteristics that define graphs?",
				options: ["Option 1 (correct)", "Option 2", "Option 3", "Option 4"],
				correctOptionIndex: 0,
				explanation:
					'{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}',
			},
			{
				id: "cd01c3f9-b427-4526-a27d-1d1f1bf84d68",
				text: "There are many types of relationships that we use graphs to display. What chart type best communicates the 'Part-to-Whole' relationship?",
				options: ["Option 1 (correct)", "Option 2", "Option 3", "Option 4"],
				correctOptionIndex: 0,
				explanation:
					'{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}',
			},
		],
	},
	"basic-graphs-quiz": {
		id: "c11dbb26-7561-4d12-88c8-141c653a43fd",
		slug: "basic-graphs-quiz",
		title: "Standard Graphs Quiz",
		description: "Quiz on basic graph concepts and their applications",
		passingScore: 70,
		questions: [
			{
				id: "513ceeab-b02c-4072-92cb-60c31058691b",
				text: "What is graphical excellence?",
				options: ["Option 1 (correct)", "Option 2", "Option 3", "Option 4"],
				correctOptionIndex: 0,
				explanation:
					'{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}',
			},
			{
				id: "5a00e6fa-81dd-4adb-a881-6aa820eace27",
				text: "When should you use graphs?",
				options: ["Option 1 (correct)", "Option 2", "Option 3", "Option 4"],
				correctOptionIndex: 0,
				explanation:
					'{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}',
			},
			{
				id: "97d252f3-a7b5-41ab-bbbc-f6457d99ef4e",
				text: "What are some of the characteristics that define graphs?",
				options: ["Option 1 (correct)", "Option 2", "Option 3", "Option 4"],
				correctOptionIndex: 0,
				explanation:
					'{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}',
			},
			{
				id: "cd01c3f9-b427-4526-a27d-1d1f1bf84d68",
				text: "There are many types of relationships that we use graphs to display. What chart type best communicates the 'Part-to-Whole' relationship?",
				options: ["Option 1 (correct)", "Option 2", "Option 3", "Option 4"],
				correctOptionIndex: 0,
				explanation:
					'{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}',
			},
		],
	},
	"storyboards-in-film-quiz": {
		id: "1e2f3a4b-5c6d-7e8f-9a0b-1c2d3e4f5a6b",
		slug: "storyboards-in-film-quiz",
		title: "Storyboards in Film Quiz",
		description: "Quiz for Storyboards in Film",
		passingScore: 70,
		questions: [
			{
				id: "63d41ee5-0cc8-41d9-9d9f-a7cfa4ec8695",
				text: "Who invented storyboards?",
				options: ["Option 1 (correct)", "Option 2", "Option 3", "Option 4"],
				correctOptionIndex: 0,
				explanation:
					'{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}',
			},
			{
				id: "d47c3f7b-70ef-43e7-93b8-51af5277c521",
				text: "What is a storyboard?",
				options: ["Option 1 (correct)", "Option 2", "Option 3", "Option 4"],
				correctOptionIndex: 0,
				explanation:
					'{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}',
			},
			{
				id: "e0db9c42-3f72-463e-b762-11bc56ea73cd",
				text: "What was the great innovation of storyboarding?",
				options: ["Option 1 (correct)", "Option 2", "Option 3", "Option 4"],
				correctOptionIndex: 0,
				explanation:
					'{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}',
			},
			{
				id: "e430ee32-6d08-45be-b16c-4a63d4ddb825",
				text: "What tools are recommended to use for storyboarding?",
				options: ["Option 1 (correct)", "Option 2", "Option 3", "Option 4"],
				correctOptionIndex: 0,
				explanation:
					'{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}',
			},
		],
	},
	"storyboards-in-presentations-quiz": {
		id: "a6b5c4d3-e2f1-0a9b-8c7d-6e5f4a3b2c1d",
		slug: "storyboards-in-presentations-quiz",
		title: "Storyboards in Presentations Quiz",
		description: "Quiz for Storyboards in Presentations",
		passingScore: 70,
		questions: [
			{
				id: "63d41ee5-0cc8-41d9-9d9f-a7cfa4ec8695",
				text: "Who invented storyboards?",
				options: ["Option 1 (correct)", "Option 2", "Option 3", "Option 4"],
				correctOptionIndex: 0,
				explanation:
					'{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}',
			},
			{
				id: "d47c3f7b-70ef-43e7-93b8-51af5277c521",
				text: "What is a storyboard?",
				options: ["Option 1 (correct)", "Option 2", "Option 3", "Option 4"],
				correctOptionIndex: 0,
				explanation:
					'{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}',
			},
			{
				id: "e0db9c42-3f72-463e-b762-11bc56ea73cd",
				text: "What was the great innovation of storyboarding?",
				options: ["Option 1 (correct)", "Option 2", "Option 3", "Option 4"],
				correctOptionIndex: 0,
				explanation:
					'{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}',
			},
			{
				id: "e430ee32-6d08-45be-b16c-4a63d4ddb825",
				text: "What tools are recommended to use for storyboarding?",
				options: ["Option 1 (correct)", "Option 2", "Option 3", "Option 4"],
				correctOptionIndex: 0,
				explanation:
					'{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}',
			},
		],
	},
	"tables-vs-graphs-quiz": {
		id: "f4e3d2c1-b6a5-8d7c-0e9f-5a4b3c2d1e0f",
		slug: "tables-vs-graphs-quiz",
		title: "Tables vs Graphs Quiz",
		description: "Quiz for Tables vs Graphs",
		passingScore: 70,
		questions: [
			{
				id: "17075e05-b7b6-4978-8025-147842f6337d",
				text: "What re some of the primary benefits of a table?",
				options: ["Option 1 (correct)", "Option 2", "Option 3", "Option 4"],
				correctOptionIndex: 0,
				explanation:
					'{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}',
			},
			{
				id: "49b524ea-19cf-4cf9-a3e7-c7f49b3ce767",
				text: "What are the two defining characteristics of Tables?",
				options: ["Option 1 (correct)", "Option 2", "Option 3", "Option 4"],
				correctOptionIndex: 0,
				explanation:
					'{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}',
			},
			{
				id: "513ceeab-b02c-4072-92cb-60c31058691b",
				text: "What is graphical excellence?",
				options: ["Option 1 (correct)", "Option 2", "Option 3", "Option 4"],
				correctOptionIndex: 0,
				explanation:
					'{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}',
			},
			{
				id: "5a00e6fa-81dd-4adb-a881-6aa820eace27",
				text: "When should you use graphs?",
				options: ["Option 1 (correct)", "Option 2", "Option 3", "Option 4"],
				correctOptionIndex: 0,
				explanation:
					'{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}',
			},
			{
				id: "97d252f3-a7b5-41ab-bbbc-f6457d99ef4e",
				text: "What are some of the characteristics that define graphs?",
				options: ["Option 1 (correct)", "Option 2", "Option 3", "Option 4"],
				correctOptionIndex: 0,
				explanation:
					'{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}',
			},
		],
	},
	"elements-of-design-detail-quiz": {
		id: "42564568-76bb-4405-88a9-8e9fd0a9154a",
		slug: "elements-of-design-detail-quiz",
		title: "The Fundamental Elements of Design in Detail Quiz",
		description: "Comprehensive quiz on the detailed elements of design",
		passingScore: 70,
		questions: [
			{
				id: "1044fc96-82b5-4fab-8796-6836bd26d926",
				text: "What are some of the fundamental elements and principles of design?",
				options: ["Option 1 (correct)", "Option 2", "Option 3", "Option 4"],
				correctOptionIndex: 0,
				explanation:
					'{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}',
			},
			{
				id: "fce7779c-e79a-4f77-84af-c165c2ccd5e2",
				text: "What elements can be repeated on all slides?",
				options: ["Option 1 (correct)", "Option 2", "Option 3", "Option 4"],
				correctOptionIndex: 0,
				explanation:
					'{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}',
			},
		],
	},
	"the-who-quiz": {
		id: "d5e6f7a8-b9c0-d1e2-f3a4-b5c6d7e8f9a0",
		slug: "the-who-quiz",
		title: "The Who Quiz",
		description: "Quiz for The Who",
		passingScore: 70,
		questions: [
			{
				id: "2f7a2198-6da3-41f9-a394-c002c9218834",
				text: "Our first step is 'The Who'. What do we mean by this?",
				options: ["Option 1 (correct)", "Option 2", "Option 3", "Option 4"],
				correctOptionIndex: 0,
				explanation:
					'{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}',
			},
			{
				id: "34dd66c5-562c-40f0-adea-7f36d2a0aed4",
				text: "Who is Cicero?",
				options: ["Option 1 (correct)", "Option 2", "Option 3", "Option 4"],
				correctOptionIndex: 0,
				explanation:
					'{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}',
			},
			{
				id: "63d41ee5-0cc8-41d9-9d9f-a7cfa4ec8695",
				text: "Who invented storyboards?",
				options: ["Option 1 (correct)", "Option 2", "Option 3", "Option 4"],
				correctOptionIndex: 0,
				explanation:
					'{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}',
			},
			{
				id: "82d249e9-7d95-49cc-99b7-76578e8e0643",
				text: "What are the 4 quadrants of the Audience Map?",
				options: ["Option 1 (correct)", "Option 2", "Option 3", "Option 4"],
				correctOptionIndex: 0,
				explanation:
					'{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}',
			},
			{
				id: "a9e9b4bd-ead5-43ef-ac52-13585ba09f57",
				text: "Who is the hero of our presentation?",
				options: ["Option 1 (correct)", "Option 2", "Option 3", "Option 4"],
				correctOptionIndex: 0,
				explanation:
					'{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}',
			},
		],
	},
	"introductions-quiz": {
		id: "b75e29c7-1d9f-4f41-8c91-a72847d13747",
		slug: "introductions-quiz",
		title: "The Why (Introductions) Quiz",
		description: "Quiz for The Why (Introductions)",
		passingScore: 70,
		questions: [
			{
				id: "2bf3a20e-e707-4d61-88f0-be78e56fce7d",
				text: "Why are stories like a cup?",
				options: ["Option 1 (correct)", "Option 2", "Option 3", "Option 4"],
				correctOptionIndex: 0,
				explanation:
					'{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}',
			},
			{
				id: "544f2d62-5cf3-403b-aba0-e972bf5230e0",
				text: "The second step in our process is 'The Why'. What do we mean by this?",
				options: ["Option 1 (correct)", "Option 2", "Option 3", "Option 4"],
				correctOptionIndex: 0,
				explanation:
					'{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}',
			},
			{
				id: "7b635d60-8dbd-4786-b63e-6dbec5450f17",
				text: "What do stories add to our presentations? Why should be use them?",
				options: ["Option 1 (correct)", "Option 2", "Option 3", "Option 4"],
				correctOptionIndex: 0,
				explanation:
					'{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}',
			},
			{
				id: "804f35a3-875e-4d49-869a-5bdb85989534",
				text: "Why have we repeated the principle of proximity in this lesson and the previous lesson?",
				options: ["Option 1 (correct)", "Option 2", "Option 3", "Option 4"],
				correctOptionIndex: 0,
				explanation:
					'{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}',
			},
			{
				id: "81e96916-d43a-48bd-9830-adb4dc203114",
				text: "Why are we creating our presentation?",
				options: ["Option 1 (correct)", "Option 2", "Option 3", "Option 4"],
				correctOptionIndex: 0,
				explanation:
					'{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}',
			},
		],
	},
	"why-next-steps-quiz": {
		id: "e8f9a0b1-c2d3-e4f5-a6b7-c8d9e0f1a2b3",
		slug: "why-next-steps-quiz",
		title: "The Why (Next Steps) Quiz",
		description: "Quiz for The Why (Next Steps)",
		passingScore: 70,
		questions: [
			{
				id: "2bf3a20e-e707-4d61-88f0-be78e56fce7d",
				text: "Why are stories like a cup?",
				options: ["Option 1 (correct)", "Option 2", "Option 3", "Option 4"],
				correctOptionIndex: 0,
				explanation:
					'{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}',
			},
			{
				id: "544f2d62-5cf3-403b-aba0-e972bf5230e0",
				text: "The second step in our process is 'The Why'. What do we mean by this?",
				options: ["Option 1 (correct)", "Option 2", "Option 3", "Option 4"],
				correctOptionIndex: 0,
				explanation:
					'{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}',
			},
			{
				id: "7b635d60-8dbd-4786-b63e-6dbec5450f17",
				text: "What do stories add to our presentations? Why should be use them?",
				options: ["Option 1 (correct)", "Option 2", "Option 3", "Option 4"],
				correctOptionIndex: 0,
				explanation:
					'{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}',
			},
			{
				id: "804f35a3-875e-4d49-869a-5bdb85989534",
				text: "Why have we repeated the principle of proximity in this lesson and the previous lesson?",
				options: ["Option 1 (correct)", "Option 2", "Option 3", "Option 4"],
				correctOptionIndex: 0,
				explanation:
					'{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}',
			},
			{
				id: "81e96916-d43a-48bd-9830-adb4dc203114",
				text: "Why are we creating our presentation?",
				options: ["Option 1 (correct)", "Option 2", "Option 3", "Option 4"],
				correctOptionIndex: 0,
				explanation:
					'{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}',
			},
		],
	},
	"using-stories-quiz": {
		id: "a0b1c2d3-e4f5-a6b7-c8d9-e0f1a2b3c4d5",
		slug: "using-stories-quiz",
		title: "Using Stories Quiz",
		description: "Quiz for Using Stories",
		passingScore: 70,
		questions: [
			{
				id: "f1448bc2-6467-4389-9ad4-2f047ad8423e",
				text: "What chart types should we try and avoid using?",
				options: ["Option 1 (correct)", "Option 2", "Option 3", "Option 4"],
				correctOptionIndex: 0,
				explanation:
					'{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}',
			},
		],
	},
	"visual-perception-quiz": {
		id: "f9e8d7c6-b5a4-3210-f9e8-d7c6b5a43210",
		slug: "visual-perception-quiz",
		title: "Visual Perception and Communication Quiz",
		description: "Quiz for Visual Perception and Communication",
		passingScore: 70,
		questions: [
			{
				id: "2e62e970-c4ac-4d05-b6a7-dad81250e986",
				text: "The principle of similarity states that we tend to group things which share visual characteristics such as:",
				options: ["Option 1 (correct)", "Option 2", "Option 3", "Option 4"],
				correctOptionIndex: 0,
				explanation:
					'{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}',
			},
			{
				id: "74794823-dcb6-4f2d-a964-3e94f5863f5d",
				text: "What are the visual attribute triggers of pre-attentive processing?",
				options: ["Option 1 (correct)", "Option 2", "Option 3", "Option 4"],
				correctOptionIndex: 0,
				explanation:
					'{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}',
			},
			{
				id: "fc904a38-82f9-43aa-a0fd-1ae817d2c1dd",
				text: "What is visual thinking?",
				options: ["Option 1 (correct)", "Option 2", "Option 3", "Option 4"],
				correctOptionIndex: 0,
				explanation:
					'{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}',
			},
		],
	},
	"structure-quiz": {
		id: "c1d2e3f4-a5b6-7c8d-9e0f-1a2b3c4d5e6f",
		slug: "structure-quiz",
		title: "What is Structure? Quiz",
		description: "Quiz for What is Structure?",
		passingScore: 70,
		questions: [
			{
				id: "0a7fcdf6-2c26-4272-801a-d037946fac20",
				text: "What is the rule of 7 (updated)?",
				options: ["Option 1 (correct)", "Option 2", "Option 3", "Option 4"],
				correctOptionIndex: 0,
				explanation:
					'{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}',
			},
			{
				id: "0c09da5c-fff3-41f1-9505-da246426eb4e",
				text: "Pick the question that corresponds with the 'Personality' quadrant",
				options: ["Option 1 (correct)", "Option 2", "Option 3", "Option 4"],
				correctOptionIndex: 0,
				explanation:
					'{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}',
			},
			{
				id: "0c13fb7a-23dc-46f4-8755-7658939b1695",
				text: "What chart type best communicates the 'Geospatial' relationship?",
				options: ["Option 1 (correct)", "Option 2", "Option 3", "Option 4"],
				correctOptionIndex: 0,
				explanation:
					'{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}',
			},
		],
	},
};

// Export a function to get a quiz by slug for convenience
export function getQuizBySlug(slug: string): QuizDefinition | undefined {
	return QUIZZES[slug];
}

// Export a function to get a quiz by ID
export function getQuizById(id: string): QuizDefinition | undefined {
	return Object.values(QUIZZES).find((quiz) => quiz.id === id);
}
