/*
    Mock modules for development.

    This file is used to mock the modules that are not needed during development (unless they are used).
    It allows the development server to load faster by not loading the modules that are not needed.
 */

// Turnstile
export const Turnstile = undefined;
export const TurnstileProps = {};

// Baselime
export const useBaselimeRum = undefined;
export const BaselimeRum = undefined;

// Sentry
export const captureException =() => ({});
export const captureEvent = () => ({});
export const setUser = () => ({});
export const init = () => ({});
