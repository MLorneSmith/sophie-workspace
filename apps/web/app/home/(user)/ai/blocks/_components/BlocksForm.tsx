"use client";

import { Button } from "@kit/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@kit/ui/card";
import { Input } from "@kit/ui/input";
import { Progress } from "@kit/ui/progress";
import { Spinner } from "@kit/ui/spinner";
import { Textarea } from "@kit/ui/textarea";
import debounce from "lodash/debounce";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { getSuggestions } from "../_actions/ai-suggestions-action";
import { submitBuildingBlocksAction } from "../_actions/submitBuildingBlocksAction";
import {
	getQuestion,
	presentationTypes,
	type QuestionField,
	type QuestionOption,
	questions,
} from "../_config/formContent";
import { type FormData, useSetupForm } from "./BlocksFormContext";

import { createServiceLogger } from "@kit/shared/logger";

// Initialize service logger
const { getLogger } = createServiceLogger("HOME-(USER)");

interface SetupFormProps {
	_userId: string; // For cache namespacing
}

function useSuggestions(_userId: string) {
	const [suggestions, setSuggestions] = useState<string[]>([]);
	const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

	// Create a debounced function outside of useCallback
	const debouncedFetchSuggestions = debounce(
		async (
			field: "title" | "audience" | "situation" | "complication" | "answer",
			presentationType?: string,
			title?: string,
			setIsLoadingSuggestions?: (loading: boolean) => void,
			setSuggestions?: (suggestions: string[]) => void,
		) => {
			// Only require title for non-title suggestions
			if (field !== "title" && !title) return;

			if (setIsLoadingSuggestions) setIsLoadingSuggestions(true);
			try {
				const result = await getSuggestions({
					title: title || "",
					field,
					presentationType,
				});

				if (result.success && result.data && setSuggestions) {
					setSuggestions(result.data);
				} else if (setSuggestions) {
					setSuggestions([
						`Error: ${result.error || "Failed to get suggestions"}`,
					]);
				}
			} catch (error) {
				// TODO: Async logger needed
				// TODO: Fix logger call - was: error
				if (setSuggestions) setSuggestions(["An unexpected error occurred"]);
			} finally {
				if (setIsLoadingSuggestions) setIsLoadingSuggestions(false);
			}
		},
		300,
	);

	// Use the debounced function inside useCallback
	const fetchSuggestions = useCallback(
		(
			field: "title" | "audience" | "situation" | "complication" | "answer",
			presentationType?: string,
			title?: string,
		) => {
			debouncedFetchSuggestions(
				field,
				presentationType,
				title,
				setIsLoadingSuggestions,
				setSuggestions,
			);
		},
		[debouncedFetchSuggestions],
	);

	return {
		suggestions,
		isLoadingSuggestions,
		fetchSuggestions,
		setSuggestions,
	};
}

const SuggestionsList = ({
	suggestions,
	isLoading,
	isFromSuggestion,
	onSelect,
}: {
	suggestions: string[];
	isLoading: boolean;
	isFromSuggestion: boolean;
	onSelect: (suggestion: string) => void;
}) => (
	<div className="mt-4">
		<h3 className="mb-2 text-sm font-medium">Suggestions:</h3>
		<div className="flex flex-wrap gap-2">
			{isLoading && !isFromSuggestion ? (
				<Spinner className="h-5 w-5" />
			) : (
				suggestions.map((suggestion) => (
					<Button
						key={suggestion}
						type="button"
						variant="outline"
						size="sm"
						onClick={() => onSelect(suggestion)}
					>
						{suggestion}
					</Button>
				))
			)}
		</div>
	</div>
);

const MultipleChoiceQuestion = ({
	value,
	onChange,
	options,
	error,
}: {
	value: string;
	onChange: (value: string) => void;
	options: QuestionOption[];
	error?: string;
}) => (
	<div className="space-y-2">
		{options.map((option) => (
			<button
				key={option.id}
				type="button"
				onClick={() => onChange(option.id)}
				className={`focus:ring-primary w-full rounded-lg p-4 text-left transition-colors duration-200 ease-in-out focus:ring-2 focus:outline-none ${
					value === option.id
						? "bg-primary text-white"
						: "bg-background hover:bg-muted"
				}`}
			>
				<div className="font-medium">{option.label}</div>
				<div
					className={`text-sm ${
						value === option.id ? "text-white" : "text-muted-foreground"
					}`}
				>
					{option.description}
				</div>
			</button>
		))}
		{error && <p className="mt-1 text-sm text-red-500">{error}</p>}
	</div>
);

const PresentationTypeQuestion = ({
	value,
	onChange,
	error,
}: {
	value: string;
	onChange: (value: string) => void;
	error?: string;
}) => (
	<div className="space-y-2">
		{presentationTypes.map((type) => (
			<button
				key={type.id}
				type="button"
				onClick={() => onChange(type.id)}
				className={`focus:ring-primary w-full rounded-lg p-4 text-left transition-colors duration-200 ease-in-out focus:ring-2 focus:outline-none ${
					value === type.id
						? "bg-primary text-white"
						: "bg-background hover:bg-muted"
				}`}
			>
				<div className="font-medium">{type.label}</div>
				<div
					className={`text-sm ${
						value === type.id ? "text-white" : "text-muted-foreground"
					}`}
				>
					{type.description}
				</div>
			</button>
		))}
		{error && <p className="mt-1 text-sm text-red-500">{error}</p>}
	</div>
);

export function SetupForm({ _userId }: SetupFormProps) {
	const {
		formData,
		setFormData,
		currentQuestion,
		currentPath,
		handleNext,
		handlePrevious,
		handleSubmit,
		errors,
		setErrors,
		validateField,
	} = useSetupForm();

	const [isValidating, setIsValidating] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isFromSuggestion, setIsFromSuggestion] = useState(false);
	const [touchedFields, setTouchedFields] = useState<Set<keyof FormData>>(
		new Set(),
	);

	const {
		suggestions,
		isLoadingSuggestions,
		fetchSuggestions,
		setSuggestions,
	} = useSuggestions(_userId);

	const router = useRouter();

	useEffect(() => {
		// TODO: Async logger needed
		// TODO: Fix logger call - was: info
	}, [formData]);

	useEffect(() => {
		setErrors({});
	}, [setErrors]);

	useEffect(() => {
		const currentField = currentPath[currentQuestion];
		if (!currentField) return;

		// Clear suggestions when field changes
		setSuggestions([]);

		// Only fetch initial suggestions when entering the field
		// or when presentation type changes
		if (currentField === "title" && formData.presentation_type) {
			// TODO: Async logger needed
			// TODO: Fix logger call - was: info
			void fetchSuggestions("title", formData.presentation_type);
		}
	}, [
		currentQuestion,
		formData.presentation_type,
		fetchSuggestions,
		currentPath,
		setSuggestions,
	]);

	// Separate effect for audience suggestions that depend on title changes
	useEffect(() => {
		const currentField = currentPath[currentQuestion];
		if (currentField === "audience" && formData.title && !isFromSuggestion) {
			// TODO: Async logger needed
			// TODO: Fix logger call - was: info
			void fetchSuggestions("audience", undefined, formData.title);
		}
	}, [
		currentQuestion,
		formData.title,
		currentPath,
		fetchSuggestions,
		isFromSuggestion,
	]);

	const handleInputChange =
		(field: keyof FormData) =>
		(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
			const value = e.target.value;
			setFormData({ ...formData, [field]: value });
			setTouchedFields(new Set(touchedFields).add(field));

			// Only fetch suggestions on manual input, not when selecting a suggestion
			if (field === "title" && !isFromSuggestion) {
				if (currentField === "title" && formData.presentation_type) {
					// Update title suggestions as user types
					void fetchSuggestions("title", formData.presentation_type);
				} else if (currentField === "audience") {
					// When title changes and we're on the audience field, update audience suggestions
					void fetchSuggestions("audience", undefined, value);
				}
			}
		};

	const handleSelectChange = async (value: string) => {
		(await getLogger()).info("Selected presentation type:", value);
		setFormData({ ...formData, presentation_type: value });
		setTouchedFields(new Set(touchedFields).add("presentation_type"));

		const isValid = validateField("presentation_type");
		// TODO: Async logger needed
		// TODO: Fix logger call - was: info

		if (isValid) {
			// Small delay to allow path update effect to run
			await new Promise((resolve) => setTimeout(resolve, 100));
			handleNext();
		}
	};

	const handleBlur = (field: keyof FormData) => () => {
		setTouchedFields(new Set(touchedFields).add(field));
		validateField(field);
	};

	const getPresentationTypeLabel = (id: string) => {
		const type = presentationTypes.find((t) => t.id === id);
		return type?.label || id;
	};

	const getQuestionTypeLabel = (id: string) => {
		const option = questions.question_type.options?.find((o) => o.id === id);
		return option?.label || id;
	};

	const handleFormSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);
		try {
			await handleSubmit(e);
			// First submit to building_blocks_submissions table
			const {
				title,
				audience,
				presentation_type,
				question_type,
				situation,
				complication,
				answer,
			} = formData;
			await submitBuildingBlocksAction({
				title,
				audience,
				presentation_type: getPresentationTypeLabel(presentation_type),
				question_type: getQuestionTypeLabel(question_type),
				situation,
				complication,
				answer,
			});
			// Navigate back to AI home page
			router.push("/home/ai");
		} catch (error) {
			// TODO: Async logger needed
			// TODO: Fix logger call - was: error
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleNextClick = async () => {
		setIsValidating(true);
		try {
			const currentField = currentPath[currentQuestion];
			if (currentField) {
				(await getLogger()).info("Validating field:", currentField);

				const isValid = validateField(currentField);
				(await getLogger()).info(
					"Field validation result:",
					currentField,
					isValid,
				);

				if (isValid) {
					// Add field to touched fields to ensure error state is shown
					setTouchedFields(new Set(touchedFields).add(currentField));

					// Small delay for UX
					await new Promise((resolve) => setTimeout(resolve, 300));

					(await getLogger()).info("Moving to next question");
					handleNext();
					setErrors({}); // Clear errors after successful navigation
				} else {
					logger.info({ message: "Validation failed, showing error" });
					// Ensure the field is marked as touched to show the error
					setTouchedFields(new Set(touchedFields).add(currentField));
				}
			} else {
				// TODO: Async logger needed
				// TODO: Fix logger call - was: error
			}
		} catch (error) {
			// TODO: Async logger needed
			// TODO: Fix logger call - was: error
		} finally {
			setIsValidating(false);
		}
	};

	const renderQuestion = () => {
		const currentField = currentPath[currentQuestion];
		if (!currentField) return null;

		const question = getQuestion(currentField as QuestionField);
		const field = question.field;

		const commonProps = {
			id: field,
			value: formData[field],
			onChange: handleInputChange(field),
			onBlur: handleBlur(field),
			className: `${
				touchedFields.has(field) && errors[field] ? "border-red-500" : ""
			} ${question.type === "textarea" ? "min-h-[100px] resize-none overflow-y-auto" : ""}`,
		};

		switch (question.type) {
			case "input":
				return (
					<>
						<Input
							{...commonProps}
							placeholder={`Enter the ${question.label.toLowerCase()}`}
						/>
						{touchedFields.has(field) && errors[field] && (
							<p className="mt-1 text-sm text-red-500">{errors[field]}</p>
						)}
					</>
				);
			case "textarea":
				return (
					<>
						<Textarea
							{...commonProps}
							placeholder={`Describe the ${question.label.toLowerCase()}`}
						/>
						{touchedFields.has(field) && errors[field] && (
							<p className="mt-1 text-sm text-red-500">{errors[field]}</p>
						)}
					</>
				);
			case "select":
				return (
					<PresentationTypeQuestion
						value={formData.presentation_type}
						onChange={handleSelectChange}
						error={touchedFields.has(field) ? errors[field] : undefined}
					/>
				);
			case "multiple_choice":
				return (
					<MultipleChoiceQuestion
						value={formData[field]}
						onChange={(value) => {
							setFormData({ ...formData, [field]: value });
							setTouchedFields(new Set(touchedFields).add(field));
							validateField(field);
						}}
						options={question.options || []}
						error={touchedFields.has(field) ? errors[field] : undefined}
					/>
				);
			default:
				return null;
		}
	};

	const currentField = currentPath[currentQuestion];
	const currentQuestionData = currentField
		? getQuestion(currentField as QuestionField)
		: null;
	const fallbackQuestionData = getQuestion(currentPath[0] as QuestionField);

	return (
		<div className="container mx-auto p-4">
			<h2 className="mb-6 text-2xl font-bold">
				{currentQuestionData?.section || fallbackQuestionData?.section}
			</h2>
			<Progress
				value={((currentQuestion + 1) / currentPath.length) * 100}
				className="mb-6"
			/>
			<Card>
				<CardHeader>
					<CardTitle>
						{currentQuestionData?.label || fallbackQuestionData?.label}
					</CardTitle>
					<CardDescription>
						{currentQuestionData?.description ||
							fallbackQuestionData?.description}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleFormSubmit} className="space-y-8">
						{renderQuestion()}
						{(currentField === "audience" || currentField === "title") && (
							<SuggestionsList
								suggestions={suggestions}
								isLoading={isLoadingSuggestions}
								isFromSuggestion={isFromSuggestion}
								onSelect={(suggestion: string) => {
									setIsFromSuggestion(true);
									try {
										if (currentField === "title") {
											setFormData({
												...formData,
												title: suggestion,
											});
											setTouchedFields(new Set(touchedFields).add("title"));
											validateField("title");
										} else if (currentField === "audience") {
											setFormData({
												...formData,
												audience: suggestion,
											});
											setTouchedFields(new Set(touchedFields).add("audience"));
											validateField("audience");
										}
									} finally {
										setIsFromSuggestion(false);
									}
								}}
							/>
						)}
						<div className="mt-4 flex justify-end space-x-4">
							{currentQuestion > 0 && (
								<Button
									type="button"
									onClick={handlePrevious}
									disabled={isValidating || isSubmitting}
								>
									Previous
								</Button>
							)}
							{currentQuestion === currentPath.length - 1 ? (
								<Button type="submit" disabled={isValidating || isSubmitting}>
									{isSubmitting ? "Submitting..." : "Submit"}
								</Button>
							) : (
								<Button
									type="button"
									onClick={handleNextClick}
									disabled={isValidating || isSubmitting}
								>
									{isValidating ? "Validating..." : "Next"}
								</Button>
							)}
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}

const _cleanSuggestions = (rawSuggestions: string): string[] => {
	// TODO: Async logger needed
	// TODO: Fix logger call - was: info
	const lines = rawSuggestions.split("\n");
	const startIndex = lines.findIndex((line) => /^\d+\./.test(line.trim()));
	if (startIndex === -1) {
		// TODO: Async logger needed
		// TODO: Fix logger call - was: info
		return [];
	}

	const cleaned = lines
		.slice(startIndex)
		.map((line) => line.replace(/^\d+\.\s*/, "").trim())
		.filter(Boolean);

	// TODO: Async logger needed
	// TODO: Fix logger call - was: info
	return cleaned;
};
