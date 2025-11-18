"use client";

import { createEnvironmentLogger } from "@kit/shared/logger";

type SubmissionState = "idle" | "submitting" | "success" | "error";
type FormType = "server-rendered" | "dynamic" | "unknown";

interface FormSubmissionConfig {
	timeoutMs: number;
	retryDelayMs: number;
	maxRetries: number;
	enableLogging: boolean;
	formSelectors: string[];
	buttonSelectors: string[];
	hydrationTimeoutMs: number;
}

interface FormSubmissionTracker {
	state: SubmissionState;
	formType: FormType;
	startTime: number;
	attemptCount: number;
	lastError?: string;
	isProtected: boolean;
	originalButtonStates: Map<
		HTMLButtonElement | HTMLInputElement,
		{ text: string; disabled: boolean }
	>;
}

interface HydrationState {
	isComplete: boolean;
	startTime: number;
	checkInterval?: number;
	maxWaitTime: number;
	confirmationSignals: number;
	requiredSignals: number;
}

export class FormSubmissionProtectionManager {
	private formTrackers = new WeakMap<HTMLFormElement, FormSubmissionTracker>();
	private trackedForms = new Set<HTMLFormElement>();
	private readonly config: FormSubmissionConfig;
	private observers: MutationObserver[] = [];
	private isInitialized = false;
	private hydrationState: HydrationState;
	private logger = createEnvironmentLogger("FORM-PROTECTION");
	private hydrationTimeoutId: NodeJS.Timeout | null = null;

	constructor(config?: Partial<FormSubmissionConfig>) {
		this.config = {
			timeoutMs: 30000,
			retryDelayMs: 2000,
			maxRetries: 3,
			enableLogging: process.env.NODE_ENV === "development",
			formSelectors: [
				"form[data-payload-form]",
				'form[action*="create-first-user"]',
				'form[action*="api/"]',
				".payload-form",
			],
			buttonSelectors: [
				'button[type="submit"]',
				'input[type="submit"]',
				".btn--style-primary",
				".form-submit",
			],
			hydrationTimeoutMs: 10000, // Increased to 10 seconds
			...config,
		};

		this.hydrationState = {
			isComplete: false,
			startTime: Date.now(),
			maxWaitTime: this.config.hydrationTimeoutMs,
			confirmationSignals: 0,
			requiredSignals: 3, // Require multiple confirmation signals
		};

		this.log(
			"FormSubmissionProtectionManager initialized - ULTRA-CONSERVATIVE MODE",
			"info",
		);
	}

	initialize(): void {
		if (this.isInitialized) {
			this.log("Already initialized", "debug");
			return;
		}

		this.log(
			"Initializing ultra-conservative form submission protection",
			"info",
		);

		// Set initialized immediately to prevent double initialization
		this.isInitialized = true;

		// Clear any existing hydration timeout
		if (this.hydrationTimeoutId) {
			clearTimeout(this.hydrationTimeoutId);
			this.hydrationTimeoutId = null;
		}

		// ONLY setup memory-only protection - NO DOM modifications
		this.setupMemoryOnlyProtection();

		// Use ultra-conservative hydration detection
		this.waitForUltraConservativeHydration(() => {
			this.setupPostHydrationMonitoring();
		});
	}

	private setupMemoryOnlyProtection(): void {
		// Immediately protect all existing forms in memory ONLY
		this.scanAndTrackForms();
		this.setupGlobalEventListeners();
		this.log(
			"Memory-only form protection activated - NO DOM MODIFICATIONS",
			"info",
		);
	}

	private waitForUltraConservativeHydration(callback: () => void): void {
		const checkHydration = () => {
			const currentSignals = this.countHydrationSignals();
			this.hydrationState.confirmationSignals = Math.max(
				this.hydrationState.confirmationSignals,
				currentSignals,
			);

			const elapsed = Date.now() - this.hydrationState.startTime;
			const minimumTimeElapsed = elapsed > 3000; // MINIMUM 3 seconds
			const hasEnoughSignals =
				this.hydrationState.confirmationSignals >=
				this.hydrationState.requiredSignals;

			if (minimumTimeElapsed && hasEnoughSignals) {
				this.hydrationState.isComplete = true;
				this.log(
					`Ultra-conservative hydration detected complete after ${elapsed}ms with ${this.hydrationState.confirmationSignals} signals`,
					"info",
				);
				callback();
				return;
			}

			if (elapsed > this.hydrationState.maxWaitTime) {
				this.log(
					`Hydration timeout reached after ${elapsed}ms, staying in SAFE MODE (no DOM modifications)`,
					"warn",
				);
				this.hydrationState.isComplete = false; // Stay in safe mode
				callback();
				return;
			}

			// Continue checking more frequently for better detection
			this.hydrationTimeoutId = setTimeout(checkHydration, 50);
		};

		checkHydration();
	}

	private countHydrationSignals(): number {
		let signals = 0;

		// Signal 1: Document complete
		if (document.readyState === "complete") signals++;

		// Signal 2: React roots present
		if (
			document.querySelector("[data-reactroot]") !== null ||
			document.querySelector("#__next") !== null ||
			document.querySelector("#root") !== null
		)
			signals++;

		// Signal 3: Sufficient time passed
		if (Date.now() - this.hydrationState.startTime > 3000) signals++;

		// Signal 4: No recent navigation
		if (!this.hasRecentNavigation()) signals++;

		// Signal 5: React components likely mounted
		if (
			document.querySelectorAll("[data-react-component], [data-reactid]")
				.length > 0
		)
			signals++;

		return signals;
	}

	private hasRecentNavigation(): boolean {
		// Simple heuristic - in a real app you might track navigation events
		return false;
	}

	private setupPostHydrationMonitoring(): void {
		// Even after hydration, we stay in ultra-conservative mode
		this.setupMutationObserver();
		this.log(
			"Post-hydration monitoring activated - STILL NO DOM MODIFICATIONS",
			"info",
		);
	}

	private scanAndTrackForms(): void {
		for (const selector of this.config.formSelectors) {
			const forms = document.querySelectorAll<HTMLFormElement>(selector);
			Array.from(forms).forEach((form) => {
				this.trackFormInMemory(form);
			});
		}
	}

	private trackFormInMemory(form: HTMLFormElement): void {
		if (this.formTrackers.has(form)) {
			return;
		}

		// ULTRA-CONSERVATIVE: Assume ALL forms are server-rendered unless explicitly proven otherwise
		const formType = this.determineFormTypeUltraConservative(form);

		const tracker: FormSubmissionTracker = {
			state: "idle",
			formType,
			startTime: 0,
			attemptCount: 0,
			isProtected: true,
			originalButtonStates: new Map(),
		};

		this.formTrackers.set(form, tracker);
		this.trackedForms.add(form);

		this.log(
			`Tracked ${formType} form in memory ONLY (no DOM changes)`,
			"debug",
		);
	}

	private determineFormTypeUltraConservative(form: HTMLFormElement): FormType {
		// ULTRA-CONSERVATIVE: Only dynamic if EXPLICITLY and UNMISTAKABLY marked
		if (
			form.hasAttribute("data-explicitly-dynamic-form") &&
			form.getAttribute("data-explicitly-dynamic-form") === "true"
		) {
			return "dynamic";
		}

		// EVERYTHING ELSE is treated as server-rendered to be safe
		return "server-rendered";
	}

	private setupMutationObserver(): void {
		const observer = new MutationObserver((mutations) => {
			for (const mutation of mutations) {
				Array.from(mutation.addedNodes).forEach((node) => {
					if (node.nodeType === Node.ELEMENT_NODE) {
						const element = node as Element;
						for (const selector of this.config.formSelectors) {
							if (element.matches?.(selector)) {
								this.trackFormInMemory(element as HTMLFormElement);
							}
							const childForms =
								element.querySelectorAll<HTMLFormElement>(selector);
							Array.from(childForms).forEach((form) => {
								this.trackFormInMemory(form);
							});
						}
					}
				});
			}
		});
		observer.observe(document.body, { childList: true, subtree: true });
		this.observers.push(observer);
	}

	private setupGlobalEventListeners(): void {
		// Event delegation for button clicks - MEMORY ONLY
		document.addEventListener(
			"click",
			(event) => {
				const target = event.target as Element;
				for (const selector of this.config.buttonSelectors) {
					if (target.matches?.(selector)) {
						this.handleButtonClick(target as HTMLButtonElement, event);
					}
				}
			},
			true,
		);

		// Event delegation for form submission - MEMORY ONLY
		document.addEventListener(
			"submit",
			(event) => {
				const form = event.target as HTMLFormElement;
				this.handleFormSubmission(form, event);
			},
			true,
		);
	}

	private handleButtonClick(
		button: HTMLButtonElement,
		event: MouseEvent,
	): void {
		if (button.disabled) {
			event.preventDefault();
			event.stopPropagation();
			this.log("Prevented click on disabled button", "debug");
			return;
		}

		const form = button.closest("form");
		if (!form) return;

		const tracker = this.formTrackers.get(form);
		if (tracker && tracker.state === "submitting") {
			event.preventDefault();
			event.stopPropagation();
			this.log("Prevented double-click on submitting form", "info");
			this.showMemoryMessage(form, "Please wait, processing...", "info");
		}
	}

	private handleFormSubmission(
		form: HTMLFormElement,
		event: SubmitEvent,
	): void {
		let tracker = this.formTrackers.get(form);

		if (!tracker) {
			this.trackFormInMemory(form);
			tracker = this.formTrackers.get(form);
			if (!tracker) return;
		}

		if (tracker.state === "submitting") {
			event.preventDefault();
			event.stopPropagation();
			this.log("Prevented duplicate submission", "info");
			this.showMemoryMessage(form, "Submission already in progress...", "info");
			return;
		}

		tracker.state = "submitting";
		tracker.startTime = Date.now();
		tracker.attemptCount++;

		// ULTRA-CONSERVATIVE: NO DOM modifications for ANY forms
		// Only store state in memory for ALL forms
		this.disableFormInMemoryOnly(form, tracker);

		setTimeout(() => {
			if (tracker && tracker.state === "submitting") {
				this.handleSubmissionTimeout(form, tracker);
			}
		}, this.config.timeoutMs);

		this.log("Form submission started - MEMORY ONLY TRACKING", "info");
	}

	private disableFormInMemoryOnly(
		form: HTMLFormElement,
		tracker: FormSubmissionTracker,
	): void {
		// Store original button states WITHOUT modifying DOM
		for (const selector of this.config.buttonSelectors) {
			const buttons = form.querySelectorAll<
				HTMLButtonElement | HTMLInputElement
			>(selector);
			Array.from(buttons).forEach((button) => {
				tracker.originalButtonStates.set(button, {
					text: button.textContent || button.value || "",
					disabled: button.disabled,
				});
			});
		}

		this.log("Form disabled in memory only - NO DOM CHANGES", "debug");
	}

	private enableForm(form: HTMLFormElement): void {
		const tracker = this.formTrackers.get(form);
		if (!tracker) return;

		// ULTRA-CONSERVATIVE: Even restoration is very limited
		// Only restore if we're absolutely certain about hydration AND it's explicitly dynamic
		if (
			this.hydrationState.isComplete &&
			this.hydrationState.confirmationSignals >=
				this.hydrationState.requiredSignals &&
			tracker.formType === "dynamic"
		) {
			// Only restore button states for explicitly dynamic forms
			Array.from(tracker.originalButtonStates).forEach(
				([button, originalState]) => {
					button.disabled = originalState.disabled;
					if (button instanceof HTMLButtonElement) {
						button.textContent = originalState.text;
					} else if (
						button instanceof HTMLInputElement &&
						button.type === "submit"
					) {
						button.value = originalState.text;
					}
				},
			);
		}

		tracker.originalButtonStates.clear();
	}

	private handleSubmissionTimeout(
		form: HTMLFormElement,
		tracker: FormSubmissionTracker,
	): void {
		this.log("Form submission timed out", "warn");
		tracker.state = "error";
		this.enableForm(form);
		this.showMemoryMessage(
			form,
			"Submission timed out. Please try again.",
			"error",
		);
	}

	markSubmissionSuccess(form: HTMLFormElement): void {
		const tracker = this.formTrackers.get(form);
		if (!tracker) return;
		tracker.state = "success";
		this.enableForm(form);
		this.showMemoryMessage(form, "Submission successful!", "success");
		this.log("Form submission successful", "info");
	}

	markSubmissionError(form: HTMLFormElement, error: string): void {
		const tracker = this.formTrackers.get(form);
		if (!tracker) return;
		tracker.state = "error";
		tracker.lastError = error;
		this.enableForm(form);
		this.showMemoryMessage(form, `Error: ${error}`, "error");
		this.log(`Form submission failed: ${error}`, "error");
	}

	private showMemoryMessage(
		_form: HTMLFormElement,
		message: string,
		type: "success" | "error" | "info",
	): void {
		// ULTRA-CONSERVATIVE: NO visual messages - console only
		this.log(
			`Form message (${type}): ${message}`,
			type === "error" ? "error" : "info",
		);

		// Optional: Could show native browser alerts for critical errors, but that's not DOM modification
		if (type === "error" && this.config.enableLogging) {
			// Could use alert() for critical errors, but generally avoid it
			// alert(`Form Error: ${message}`);
		}
	}

	getStatus() {
		const status = {
			totalForms: this.trackedForms.size,
			submittingForms: 0,
			errorForms: 0,
			successForms: 0,
			serverRenderedForms: 0,
			dynamicForms: 0,
			hydrationComplete: this.hydrationState.isComplete,
			hydrationSignals: this.hydrationState.confirmationSignals,
			mode: "ULTRA-CONSERVATIVE",
		};

		Array.from(this.trackedForms).forEach((form) => {
			const tracker = this.formTrackers.get(form);
			if (!tracker) return;

			if (tracker.formType === "server-rendered") status.serverRenderedForms++;
			if (tracker.formType === "dynamic") status.dynamicForms++;

			switch (tracker.state) {
				case "submitting":
					status.submittingForms++;
					break;
				case "error":
					status.errorForms++;
					break;
				case "success":
					status.successForms++;
					break;
			}
		});

		return status;
	}

	cleanup(): void {
		// Clear hydration timeout if it exists
		if (this.hydrationTimeoutId) {
			clearTimeout(this.hydrationTimeoutId);
			this.hydrationTimeoutId = null;
		}

		for (const observer of this.observers) {
			observer.disconnect();
		}
		this.observers = [];
		this.formTrackers = new WeakMap();
		this.trackedForms.clear();
		this.isInitialized = false;
		this.hydrationState.isComplete = false;
		this.log("Form submission protection cleaned up", "info");
	}

	private log(
		message: string,
		level: "debug" | "info" | "warn" | "error" = "info",
	): void {
		if (!this.config.enableLogging && level === "debug") return;
		this.logger[level](message);
	}
}

// Global singleton instance
declare global {
	var __formSubmissionProtectionManager:
		| FormSubmissionProtectionManager
		| undefined;
}

export function getFormSubmissionProtectionManager(): FormSubmissionProtectionManager {
	if (!globalThis.__formSubmissionProtectionManager) {
		globalThis.__formSubmissionProtectionManager =
			new FormSubmissionProtectionManager();
	}
	return globalThis.__formSubmissionProtectionManager;
}

export function initializeFormSubmissionProtection(
	config?: Partial<FormSubmissionConfig>,
): void {
	const manager =
		globalThis.__formSubmissionProtectionManager ||
		new FormSubmissionProtectionManager(config);
	if (!globalThis.__formSubmissionProtectionManager) {
		globalThis.__formSubmissionProtectionManager = manager;
	}
	manager.initialize();
}

export function cleanupFormSubmissionProtection(): void {
	if (globalThis.__formSubmissionProtectionManager) {
		globalThis.__formSubmissionProtectionManager.cleanup();
		globalThis.__formSubmissionProtectionManager = undefined;
	}
}
