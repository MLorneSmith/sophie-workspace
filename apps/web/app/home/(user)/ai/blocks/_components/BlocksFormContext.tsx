"use client";

import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import {
	getPath,
	type PresentationPathType,
	type QuestionField,
} from "../_config/formContent";
import type {
	PresentationType,
	QuestionType,
} from "~/home/(user)/ai/_lib/schemas/presentation-artifacts";

// Create a client-safe logger wrapper
const logger = {
	info: (...args: unknown[]) => {
		if (process.env.NODE_ENV === "development") {
			// biome-ignore lint/suspicious/noConsole: Development logging is allowed
			console.info(...args);
		}
	},
	error: (...args: unknown[]) => {
		if (process.env.NODE_ENV === "development") {
			// biome-ignore lint/suspicious/noConsole: Development logging is allowed
			console.error(...args);
		}
	},
	warn: (...args: unknown[]) => {
		if (process.env.NODE_ENV === "development") {
			// biome-ignore lint/suspicious/noConsole: Development logging is allowed
			console.warn(...args);
		}
	},
	debug: (...args: unknown[]) => {
		if (process.env.NODE_ENV === "development") {
			// biome-ignore lint/suspicious/noConsole: Development logging is allowed
			console.debug(...args);
		}
	},
};

export interface FormData {
	title: string;
	audience: string;
	presentation_type: PresentationType;
	question_type: QuestionType;
	situation: string;
	complication: string;
	// NOTE: Current flow uses `answer`. Upcoming Argument Map flow may replace this
	// with an `argument_map` step.
	answer: string;
	argument_map?: unknown;
}

interface FormContextType {
	formData: FormData;
	setFormData: (data: FormData) => void;
	currentQuestion: number;
	currentPath: QuestionField[];
	handleNext: () => void;
	handlePrevious: () => void;
	handleSubmit: (e: React.FormEvent) => Promise<void>;
	errors: Record<string, string>;
	setErrors: (errors: Record<string, string>) => void;
	validateField: (field: keyof FormData) => boolean;
	touchedFieldsOnBlur: Set<keyof FormData>;
	markFieldAsTouchedOnBlur: (field: keyof FormData) => void;
}

const SetupFormContext = createContext<FormContextType | undefined>(undefined);

export function SetupFormProvider({
	children,
	initialFormData,
}: {
	children: React.ReactNode;
	initialFormData?: Partial<FormData>;
}) {
	const [formData, setFormData] = useState<FormData>({
		title: "",
		audience: "",
		presentation_type: "general",
		question_type: "strategy",
		situation: "",
		complication: "",
		answer: "",
		argument_map: undefined,
	});

	const [currentQuestion, setCurrentQuestion] = useState(0);
	const [currentPath, setCurrentPath] = useState<QuestionField[]>([
		"presentation_type",
	]);
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [touchedFieldsOnBlur, setTouchedFieldsOnBlur] = useState<
		Set<keyof FormData>
	>(new Set());

	useEffect(() => {
		if (!initialFormData) return;

		logger.info("Initializing form with initial data", {
			keys: Object.keys(initialFormData),
		});

		setFormData((prev) => ({ ...prev, ...initialFormData }));
	}, [initialFormData]);

	// Initialize with default path and update when presentation type changes
	useEffect(() => {
		// When presentation type changes, update the path to the full path for that type
		const type = formData.presentation_type as PresentationPathType;

		if (type) {
			logger.info("Presentation type changed, updating path", {
				presentationType: type,
				currentQuestion,
			});
			const newPath = getPath(type);
			logger.info("New path set for presentation type", {
				presentationType: type,
				newPath: newPath.join(", "),
				pathLength: newPath.length,
			});
			setCurrentPath(newPath);
		}
	}, [formData.presentation_type, currentQuestion]);

	const validateField = (field: keyof FormData): boolean => {
		const value = formData[field];
		let isValid = true;
		const newErrors = { ...errors };

		const isEmptyString = typeof value === "string" && value.trim() === "";
		const isMissing = value === undefined || value === null || isEmptyString;

		if (isMissing) {
			newErrors[field] = "This field is required";
			isValid = false;
			logger.info("Field validation failed", {
				field,
				error: "Field is required",
			});
		} else {
			// Optimistic error clearing - clear error when value becomes non-empty
			delete newErrors[field];
			logger.info("Field validation passed", {
				field,
				valueType: typeof value,
			});
		}

		setErrors(newErrors);
		return isValid;
	};

	const markFieldAsTouchedOnBlur = (field: keyof FormData) => {
		setTouchedFieldsOnBlur(new Set(touchedFieldsOnBlur).add(field));
		logger.info("Field marked as touched on blur", { field });
	};

	const handleNext = () => {
		const currentField = currentPath[currentQuestion];
		if (!currentField) {
			logger.info("No current field found for navigation", {
				currentQuestion,
				pathLength: currentPath.length,
				currentPath: currentPath.join(", "),
			});
			return;
		}

		// Move to next question if we're not at the end
		if (currentQuestion < currentPath.length - 1) {
			logger.info("Moving to next question", {
				currentQuestion,
				nextQuestion: currentQuestion + 1,
				currentField,
				totalQuestions: currentPath.length,
			});
			logger.info("Current navigation path", {
				currentPath: currentPath.join(", "),
				progress: `${currentQuestion + 1}/${currentPath.length}`,
			});
			setCurrentQuestion((prev) => prev + 1);
		} else {
			logger.info("Reached end of questions", {
				currentQuestion,
				totalQuestions: currentPath.length,
				currentField,
			});
		}
	};

	const handlePrevious = () => {
		setCurrentQuestion((prev) => Math.max(prev - 1, 0));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		// Only validate fields that are in the current path
		const validations = currentPath.map((field) => validateField(field));

		if (validations.every((valid) => valid)) {
			logger.info("Form submitted successfully", {
				formData,
				fieldsValidated: currentPath,
				totalFields: currentPath.length,
			});
		} else {
			logger.info("Form submission failed validation", {
				currentPath,
				validationResults: validations,
				errors,
			});
			// Find the first invalid field and set it as current
			const firstInvalidIndex = validations.findIndex((valid) => !valid);
			if (firstInvalidIndex !== -1) {
				setCurrentQuestion(firstInvalidIndex);
			}
		}
	};

	return (
		<SetupFormContext.Provider
			value={{
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
				touchedFieldsOnBlur,
				markFieldAsTouchedOnBlur,
			}}
		>
			{children}
		</SetupFormContext.Provider>
	);
}

export function useSetupForm() {
	const context = useContext(SetupFormContext);
	if (context === undefined) {
		throw new Error("useSetupForm must be used within a SetupFormProvider");
	}
	return context;
}
