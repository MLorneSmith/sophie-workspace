import { createServiceLogger } from "@kit/shared/logger";

// Initialize service logger
const { getLogger } = createServiceLogger("LIB-DEV_MOCK_MODULES.TS");

/*
* Mock modules for development.

This file is used to mock the modules that are not needed during development (unless they are used).
It allows the development server to load faster by not loading the modules that are not needed.
 */

const noop = (name: string) => {
	return () => {
		// TODO: Async logger needed
		// TODO: Fix logger call - was: debug
	};
};

// Turnstile
export const Turnstile = undefined;
export const TurnstileProps = {};

// Baselime
export const useBaselimeRum = noop("useBaselimeRum");
export const BaselimeRum = undefined;

// Sentry
export const captureException = noop("Sentry.captureException");
export const captureEvent = noop("Sentry.captureEvent");
export const init = noop("Sentry.init");
export const setUser = noop("Sentry.setUser");

// Stripe
export const loadStripe = noop("Stripe.loadStripe");

// Nodemailer
export const createTransport = noop("Nodemailer.createTransport");
