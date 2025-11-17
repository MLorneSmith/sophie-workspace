"use client";

import {
	Turnstile,
	type TurnstileInstance,
	type TurnstileProps,
} from "@marsidev/react-turnstile";
import { useRef } from "react";
import type { Control, FieldPath, FieldValues } from "react-hook-form";
import { useController } from "react-hook-form";

interface BaseCaptchaFieldProps {
	siteKey: string | undefined;
	options?: TurnstileProps;
	nonce?: string;
}

interface StandaloneCaptchaFieldProps extends BaseCaptchaFieldProps {
	onTokenChange: (token: string) => void;
	onInstanceChange?: (instance: TurnstileInstance | null) => void;
	control?: never;
	name?: never;
}

interface ReactHookFormCaptchaFieldProps<
	TFieldValues extends FieldValues = FieldValues,
	TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends BaseCaptchaFieldProps {
	control: Control<TFieldValues>;
	name: TName;
	onTokenChange?: never;
	onInstanceChange?: never;
}

type CaptchaFieldProps<
	TFieldValues extends FieldValues = FieldValues,
	TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> =
	| StandaloneCaptchaFieldProps
	| ReactHookFormCaptchaFieldProps<TFieldValues, TName>;

/**
 * @name CaptchaField
 * @description Self-contained captcha component with two modes:
 *
 * **Standalone mode** - For use outside react-hook-form:
 * ```tsx
 * <CaptchaField
 *   siteKey={siteKey}
 *   onTokenChange={setToken}
 * />
 * ```
 *
 * **React Hook Form mode** - Automatic form integration:
 * ```tsx
 * <CaptchaField
 *   siteKey={siteKey}
 *   control={form.control}
 *   name="captchaToken"
 * />
 * ```
 */
// Internal component for React Hook Form mode
function CaptchaFieldWithForm<
	TFieldValues extends FieldValues = FieldValues,
	TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(
	props: ReactHookFormCaptchaFieldProps<TFieldValues, TName> & {
		instanceRef: React.RefObject<TurnstileInstance | null>;
		siteKey: string; // Override to narrow type - parent already guards against undefined
	},
) {
	const { siteKey, options, nonce, control, name, instanceRef } = props;

	const controller = useController({
		control,
		name,
	});

	const defaultOptions: Partial<TurnstileProps> = {
		options: {
			size: "invisible",
		},
	};

	const handleSuccess = (token: string) => {
		controller.field.onChange(token);
	};

	const handleInstanceChange = (instance: TurnstileInstance | null) => {
		instanceRef.current = instance;
	};

	return (
		<Turnstile
			ref={(instance) => {
				if (instance) {
					handleInstanceChange(instance);
				}
			}}
			siteKey={siteKey}
			onSuccess={handleSuccess}
			scriptOptions={{
				nonce,
			}}
			{...defaultOptions}
			{...options}
		/>
	);
}

// Internal component for standalone mode
function CaptchaFieldStandalone(
	props: StandaloneCaptchaFieldProps & {
		instanceRef: React.RefObject<TurnstileInstance | null>;
		siteKey: string; // Override to narrow type - parent already guards against undefined
	},
) {
	const {
		siteKey,
		options,
		nonce,
		onTokenChange,
		onInstanceChange,
		instanceRef,
	} = props;

	const defaultOptions: Partial<TurnstileProps> = {
		options: {
			size: "invisible",
		},
	};

	const handleSuccess = (token: string) => {
		onTokenChange(token);
	};

	const handleInstanceChange = (instance: TurnstileInstance | null) => {
		instanceRef.current = instance;

		if (onInstanceChange) {
			onInstanceChange(instance);
		}
	};

	return (
		<Turnstile
			ref={(instance) => {
				if (instance) {
					handleInstanceChange(instance);
				}
			}}
			siteKey={siteKey}
			onSuccess={handleSuccess}
			scriptOptions={{
				nonce,
			}}
			{...defaultOptions}
			{...options}
		/>
	);
}

export function CaptchaField<
	TFieldValues extends FieldValues = FieldValues,
	TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(props: CaptchaFieldProps<TFieldValues, TName>) {
	const { siteKey } = props;
	const instanceRef = useRef<TurnstileInstance | null>(null);

	if (!siteKey) {
		return null;
	}

	// Route to appropriate internal component based on props
	// At this point, siteKey is guaranteed to be a non-empty string
	if ("control" in props && props.control) {
		return (
			<CaptchaFieldWithForm
				{...props}
				siteKey={siteKey}
				instanceRef={instanceRef}
			/>
		);
	}

	return (
		<CaptchaFieldStandalone
			{...props}
			siteKey={siteKey}
			instanceRef={instanceRef}
		/>
	);
}
