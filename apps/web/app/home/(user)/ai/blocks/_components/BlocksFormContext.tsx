"use client";


import { createServiceLogger } from "@kit/shared/logger";
import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import {
	getPath,
	type PresentationPathType,
	type QuestionField,
} from "../_config/formContent";

// Initialize service logger
const { getLogger } = createServiceLogger("HOME-(USER)");

export interface FormData {
	title: string;
	audience: string;
	presentation_type: string;
	question_type: string;
	situation: string;
	complication: string;
	answer: string;
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
}

const SetupFormContext = createContext<FormContextType | undefined>(undefined);

export function SetupFormProvider({ children }: { children: React.ReactNode }) {
	const [formData, setFormData] = useState<FormData>({
		title: "",
		audience: "",
		presentation_type: "",
		question_type: "",
		situation: "",
		complication: "",
		answer: "",
	// });

	const [currentQuestion, setCurrentQuestion] = useState(0);
	const [currentPath, setCurrentPath] = useState<QuestionField[]>([
		"presentation_type",
	]);
	const [errors, setErrors] = useState<Record<string, string>>({});

	// Initialize with default path and update when presentation type changes
	useEffect(() => {
		// When presentation type changes, update the path to the full path for that type
		const type = formData.presentation_type as PresentationPathType;

		if (type) {
			// TODO: Async logger needed
			// TODO: Fix logger call - was: info
			const newPath = getPath(type);
			// TODO: Async logger needed
			// TODO: Fix logger call - was: info
			setCurrentPath(newPath);
		}
	}, [formData.presentation_type]);

	const validateField = (field: keyof FormData): boolean => {
		const value = formData[field];
		let isValid = true;
		const newErrors = { ...errors };

		if (!value || value.trim() === "") {
			newErrors[field] = "This field is required";
			isValid = false;
			// TODO: Async logger needed
			// TODO: Fix logger call - was: info
		} else {
			delete newErrors[field];
			// TODO: Async logger needed
			// TODO: Fix logger call - was: info
		}

		setErrors(newErrors);
		return isValid;
	};

	const handleNext = () => {
		const currentField = currentPath[currentQuestion];
		if (!currentField) {
			// TODO: Async logger needed
			// TODO: Fix logger call - was: info
			return;
		}

		// Move to next question if we're not at the end
		if (currentQuestion < currentPath.length - 1) {
			logger.info({
				currentQuestion,
				nextQuestion: currentQuestion + 1,
			// });
			logger.info({
				currentPath: currentPath.join(", "),
				message: "Current path",
			// });
			setCurrentQuestion((_prev) => prev + 1);
		} else {
			logger.info({ message: "Reached end of questions" });
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
			(await getLogger()).info("Form submitted:", formData);
		} else {
			// TODO: Async logger needed
			// TODO: Fix logger call - was: info
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
