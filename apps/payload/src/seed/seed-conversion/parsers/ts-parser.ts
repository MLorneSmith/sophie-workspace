import * as ts from "typescript";
import type { ParsedContent } from "../types";

export interface QuizDefinition {
	id: string;
	slug: string;
	title: string;
	description: string;
	passingScore: number;
	questions: QuizQuestion[];
}

export interface QuizQuestion {
	id: string;
	question: string;
	answers: Array<{
		answer: string;
		isCorrect: boolean;
	}>;
	explanation?: string;
}

export function parseTsQuizFile(content: string): ParsedContent {
	try {
		// Create a temporary module to evaluate the TypeScript
		// In production, we'd want to use a safer evaluation method
		const quizzes = extractQuizzesFromTs(content);

		return {
			frontmatter: {
				type: "quiz-questions",
				quizzes,
			},
			content: "",
			references: {
				media: [],
				downloads: [],
				collections: [],
			},
		};
	} catch (error) {
		throw new Error(`Failed to parse TypeScript quiz file: ${error}`);
	}
}

function extractQuizzesFromTs(content: string): Record<string, QuizDefinition> {
	// Parse the TypeScript AST
	const sourceFile = ts.createSourceFile(
		"quiz.ts",
		content,
		ts.ScriptTarget.Latest,
		true,
	);

	const quizzes: Record<string, QuizDefinition> = {};

	// Find the QUIZZES export
	function visit(node: ts.Node) {
		if (ts.isVariableStatement(node)) {
			const declaration = node.declarationList.declarations[0];
			if (
				ts.isVariableDeclaration(declaration) &&
				declaration.name.getText() === "QUIZZES" &&
				declaration.initializer
			) {
				// Extract the quiz data from the object literal
				if (ts.isObjectLiteralExpression(declaration.initializer)) {
					declaration.initializer.properties.forEach((prop) => {
						if (
							ts.isPropertyAssignment(prop) &&
							ts.isObjectLiteralExpression(prop.initializer)
						) {
							const quizKey = prop.name?.getText().replace(/['"]/g, "");
							const quizData = parseQuizObject(prop.initializer);
							if (quizKey && quizData) {
								quizzes[quizKey] = quizData;
							}
						}
					});
				}
			}
		}

		ts.forEachChild(node, visit);
	}

	visit(sourceFile);

	return quizzes;
}

function parseQuizObject(
	node: ts.ObjectLiteralExpression,
): QuizDefinition | null {
	const quiz: Partial<QuizDefinition> = {};

	node.properties.forEach((prop) => {
		if (ts.isPropertyAssignment(prop)) {
			const key = prop.name?.getText().replace(/['"]/g, "");

			switch (key) {
				case "id":
				case "slug":
				case "title":
				case "description":
					if (ts.isStringLiteral(prop.initializer)) {
						(quiz as any)[key] = prop.initializer.text;
					}
					break;

				case "passingScore":
					if (ts.isNumericLiteral(prop.initializer)) {
						quiz.passingScore = Number(prop.initializer.text);
					}
					break;

				case "questions":
					if (ts.isArrayLiteralExpression(prop.initializer)) {
						quiz.questions = prop.initializer.elements
							.filter(ts.isObjectLiteralExpression)
							.map(parseQuestionObject)
							.filter(Boolean) as QuizQuestion[];
					}
					break;
			}
		}
	});

	return quiz.id && quiz.slug && quiz.title ? (quiz as QuizDefinition) : null;
}

function parseQuestionObject(
	node: ts.ObjectLiteralExpression,
): QuizQuestion | null {
	const question: Partial<QuizQuestion> = {};

	node.properties.forEach((prop) => {
		if (ts.isPropertyAssignment(prop)) {
			const key = prop.name?.getText().replace(/['"]/g, "");

			switch (key) {
				case "id":
				case "question":
				case "explanation":
					if (ts.isStringLiteral(prop.initializer)) {
						(question as any)[key] = prop.initializer.text;
					}
					break;

				case "answers":
					if (ts.isArrayLiteralExpression(prop.initializer)) {
						question.answers = prop.initializer.elements
							.filter(ts.isObjectLiteralExpression)
							.map((answerNode) => {
								const answer: any = {};
								answerNode.properties.forEach((answerProp) => {
									if (ts.isPropertyAssignment(answerProp)) {
										const answerKey = answerProp.name
											?.getText()
											.replace(/['"]/g, "");
										if (
											answerKey === "answer" &&
											ts.isStringLiteral(answerProp.initializer)
										) {
											answer.answer = answerProp.initializer.text;
										} else if (
											answerKey === "isCorrect" &&
											(answerProp.initializer.kind ===
												ts.SyntaxKind.TrueKeyword ||
												answerProp.initializer.kind ===
													ts.SyntaxKind.FalseKeyword)
										) {
											answer.isCorrect =
												answerProp.initializer.kind ===
												ts.SyntaxKind.TrueKeyword;
										}
									}
								});
								return answer;
							})
							.filter((a) => a.answer);
					}
					break;
			}
		}
	});

	return question.id && question.question && question.answers
		? (question as QuizQuestion)
		: null;
}

export function convertQuizToPayloadFormat(quiz: QuizDefinition): any {
	return {
		id: quiz.id,
		slug: quiz.slug,
		title: quiz.title,
		description: quiz.description,
		passingScore: quiz.passingScore,
		questions: quiz.questions.map((q) => ({
			id: q.id,
			question: q.question,
			answers: q.answers,
			explanation: q.explanation || "",
		})),
	};
}
