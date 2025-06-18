"use client";

import { Slot, Slottable } from "@radix-ui/react-slot";
import { useMutation } from "@tanstack/react-query";
import React, {
	createContext,
	type HTMLProps,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import type { UseFormReturn } from "react-hook-form";

import { cn } from "../lib/utils";

interface MultiStepFormProps {
	// biome-ignore lint/suspicious/noExplicitAny: Required to avoid TypeScript memory exhaustion from complex generic constraints
	form: UseFormReturn<any>;
	// biome-ignore lint/suspicious/noExplicitAny: Required to avoid TypeScript memory exhaustion from complex generic constraints
	onSubmit: (data: any) => void;
	useStepTransition?: boolean;
	className?: string;
	// biome-ignore lint/suspicious/noExplicitAny: Required to avoid TypeScript memory exhaustion from complex generic constraints
	validation?: (stepName: string, data: any) => boolean;
}

type StepProps = React.PropsWithChildren<
	{
		name: string;
		asChild?: boolean;
	} & React.HTMLProps<HTMLDivElement>
>;

const MultiStepFormContext = createContext<ReturnType<
	typeof useMultiStepForm
> | null>(null);

/**
 * @name MultiStepForm
 * @description Multi-step form component for React
 * @param schema
 * @param form
 * @param onSubmit
 * @param children
 * @param className
 * @constructor
 */
export function MultiStepForm({
	form,
	onSubmit,
	children,
	className,
	validation,
}: React.PropsWithChildren<MultiStepFormProps>) {
	const steps = useMemo(
		() =>
			React.Children.toArray(children).filter(
				(child): child is React.ReactElement<StepProps> =>
					React.isValidElement(child) && child.type === MultiStepFormStep,
			),
		[children],
	);

	const header = useMemo(() => {
		return React.Children.toArray(children).find(
			(child) =>
				React.isValidElement(child) && child.type === MultiStepFormHeader,
		);
	}, [children]);

	const footer = useMemo(() => {
		return React.Children.toArray(children).find(
			(child) =>
				React.isValidElement(child) && child.type === MultiStepFormFooter,
		);
	}, [children]);

	const stepNames = steps.map((step) => step.props.name);
	const multiStepForm = useMultiStepForm(form, stepNames, onSubmit, validation);

	return (
		<MultiStepFormContext.Provider value={multiStepForm}>
			<form
				onSubmit={form.handleSubmit(onSubmit)}
				className={cn(className, "flex size-full flex-col overflow-hidden")}
			>
				{header}

				<div className="relative transition-transform duration-500">
					{steps.map((step, index) => {
						const isActive = index === multiStepForm.currentStepIndex;

						return (
							<AnimatedStep
								key={step.props.name}
								direction={multiStepForm.direction}
								isActive={isActive}
								index={index}
								currentIndex={multiStepForm.currentStepIndex}
							>
								{step}
							</AnimatedStep>
						);
					})}
				</div>

				{footer}
			</form>
		</MultiStepFormContext.Provider>
	);
}

export function MultiStepFormContextProvider(props: {
	children: (context: ReturnType<typeof useMultiStepForm>) => React.ReactNode;
}) {
	const ctx = useMultiStepFormContext();

	if (Array.isArray(props.children)) {
		const [child] = props.children;

		return (
			child as (context: ReturnType<typeof useMultiStepForm>) => React.ReactNode
		)(ctx);
	}

	return props.children(ctx);
}

export const MultiStepFormStep: React.FC<
	React.PropsWithChildren<
		{
			asChild?: boolean;
			ref?: React.Ref<HTMLDivElement>;
		} & HTMLProps<HTMLDivElement>
	>
> = function MultiStepFormStep({ children, asChild, ...props }) {
	const Cmp = asChild ? Slot : "div";

	return (
		<Cmp {...props}>
			<Slottable>{children}</Slottable>
		</Cmp>
	);
};

export function useMultiStepFormContext() {
	const context = useContext(MultiStepFormContext);

	if (!context) {
		throw new Error(
			"useMultiStepFormContext must be used within a MultiStepForm",
		);
	}

	return context;
}

/**
 * @name useMultiStepForm
 * @description Hook for multi-step forms
 * @param schema
 * @param form
 * @param stepNames
 * @param onSubmit
 */
export function useMultiStepForm(
	// biome-ignore lint/suspicious/noExplicitAny: Required to avoid TypeScript memory exhaustion from complex generic constraints
	form: UseFormReturn<any>,
	stepNames: string[],
	// biome-ignore lint/suspicious/noExplicitAny: Required to avoid TypeScript memory exhaustion from complex generic constraints
	onSubmit: (data: any) => void,
	// biome-ignore lint/suspicious/noExplicitAny: Required to avoid TypeScript memory exhaustion from complex generic constraints
	validation?: (stepName: string, data: any) => boolean,
) {
	const [state, setState] = useState({
		currentStepIndex: 0,
		direction: undefined as "forward" | "backward" | undefined,
	});

	const isStepValid = useCallback(() => {
		const currentStepName = stepNames[state.currentStepIndex];

		if (!currentStepName) {
			return false;
		}

		// Use custom validation function if provided
		if (validation) {
			// biome-ignore lint/suspicious/noExplicitAny: Required to avoid TypeScript memory exhaustion from complex generic constraints
			const currentStepData = form.getValues(currentStepName as any) ?? {};
			return validation(currentStepName, currentStepData);
		}

		// Default to form validation state
		return !form.formState.errors[currentStepName];
	}, [validation, form, stepNames, state.currentStepIndex]);

	const nextStep = useCallback(
		<Ev extends React.SyntheticEvent>(e: Ev) => {
			// prevent form submission when the user presses Enter
			// or if the user forgets [type="button"] on the button
			e.preventDefault();

			const isValid = isStepValid();

			if (!isValid) {
				// Trigger validation for the current step
				const currentStepName = stepNames[state.currentStepIndex];
				if (currentStepName) {
					// biome-ignore lint/suspicious/noExplicitAny: Required to avoid TypeScript memory exhaustion from complex generic constraints
					void form.trigger(currentStepName as any);
				}
				return;
			}

			if (isValid && state.currentStepIndex < stepNames.length - 1) {
				setState((prevState) => {
					return {
						...prevState,
						direction: "forward",
						currentStepIndex: prevState.currentStepIndex + 1,
					};
				});
			}
		},
		[state.currentStepIndex, stepNames, form, isStepValid],
	);

	const prevStep = useCallback(
		<Ev extends React.SyntheticEvent>(e: Ev) => {
			// prevent form submission when the user presses Enter
			// or if the user forgets [type="button"] on the button
			e.preventDefault();

			if (state.currentStepIndex > 0) {
				setState((prevState) => {
					return {
						...prevState,
						direction: "backward",
						currentStepIndex: prevState.currentStepIndex - 1,
					};
				});
			}
		},
		[state.currentStepIndex],
	);

	const goToStep = useCallback(
		(index: number) => {
			if (index >= 0 && index < stepNames.length && isStepValid()) {
				setState((prevState) => {
					return {
						...prevState,
						direction:
							index > prevState.currentStepIndex ? "forward" : "backward",
						currentStepIndex: index,
					};
				});
			}
		},
		[stepNames.length, isStepValid],
	);

	const isValid = form.formState.isValid;
	const errors = form.formState.errors;

	const mutation = useMutation({
		mutationFn: () => {
			return form.handleSubmit(onSubmit)();
		},
	});

	return useMemo(
		() => ({
			form,
			currentStep: stepNames[state.currentStepIndex] as string,
			currentStepIndex: state.currentStepIndex,
			totalSteps: stepNames.length,
			isFirstStep: state.currentStepIndex === 0,
			isLastStep: state.currentStepIndex === stepNames.length - 1,
			nextStep,
			prevStep,
			goToStep,
			direction: state.direction,
			isStepValid,
			isValid,
			errors,
			mutation,
		}),
		[
			form,
			mutation,
			stepNames,
			state.currentStepIndex,
			state.direction,
			nextStep,
			prevStep,
			goToStep,
			isValid,
			isStepValid,
			errors,
		],
	);
}

export const MultiStepFormHeader: React.FC<
	React.PropsWithChildren<
		{
			asChild?: boolean;
		} & HTMLProps<HTMLDivElement>
	>
> = function MultiStepFormHeader({ children, asChild, ...props }) {
	const Cmp = asChild ? Slot : "div";

	return (
		<Cmp {...props}>
			<Slottable>{children}</Slottable>
		</Cmp>
	);
};

export const MultiStepFormFooter: React.FC<
	React.PropsWithChildren<
		{
			asChild?: boolean;
		} & HTMLProps<HTMLDivElement>
	>
> = function MultiStepFormFooter({ children, asChild, ...props }) {
	const Cmp = asChild ? Slot : "div";

	return (
		<Cmp {...props}>
			<Slottable>{children}</Slottable>
		</Cmp>
	);
};

/**
 * @name createValidationFunction
 * @description Create a validation function for a multi-step form
 * @param validators - Object mapping step names to validation functions
 */
export function createValidationFunction(
	// biome-ignore lint/suspicious/noExplicitAny: Required to avoid TypeScript memory exhaustion from complex generic constraints
	validators: Record<string, (data: any) => boolean>,
	// biome-ignore lint/suspicious/noExplicitAny: Required to avoid TypeScript memory exhaustion from complex generic constraints
): (stepName: string, data: any) => boolean {
	// biome-ignore lint/suspicious/noExplicitAny: Required to avoid TypeScript memory exhaustion from complex generic constraints
	return (stepName: string, data: any) => {
		const validator = validators[stepName];
		return validator ? validator(data) : true;
	};
}

interface AnimatedStepProps {
	direction: "forward" | "backward" | undefined;
	isActive: boolean;
	index: number;
	currentIndex: number;
}

function AnimatedStep({
	isActive,
	direction,
	children,
	index,
	currentIndex,
}: React.PropsWithChildren<AnimatedStepProps>) {
	const [shouldRender, setShouldRender] = useState(isActive);
	const stepRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (isActive) {
			setShouldRender(true);
		} else {
			const timer = setTimeout(() => setShouldRender(false), 300);

			return () => clearTimeout(timer);
		}
	}, [isActive]);

	useEffect(() => {
		if (isActive && stepRef.current) {
			const focusableElement = stepRef.current.querySelector(
				'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
			);

			if (focusableElement) {
				(focusableElement as HTMLElement).focus();
			}
		}
	}, [isActive]);

	if (!shouldRender) {
		return null;
	}

	const baseClasses =
		" top-0 left-0 w-full h-full transition-all duration-300 ease-in-out animate-in fade-in zoom-in-95";

	const visibilityClasses = isActive ? "opacity-100" : "opacity-0 absolute";

	const transformClasses = cn(
		"translate-x-0",
		isActive
			? {}
			: {
					"-translate-x-full": direction === "forward" || index < currentIndex,
					"translate-x-full": direction === "backward" || index > currentIndex,
				},
	);

	const className = cn(baseClasses, visibilityClasses, transformClasses);

	return (
		<div ref={stepRef} className={className} aria-hidden={!isActive}>
			{children}
		</div>
	);
}
