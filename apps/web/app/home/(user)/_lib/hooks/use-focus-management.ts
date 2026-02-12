"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * Trap focus within a container element. Useful for modals and dialogs.
 * Returns a ref to attach to the container element.
 */
export function useFocusTrap<T extends HTMLElement = HTMLElement>(
	active = true,
) {
	const containerRef = useRef<T>(null);

	useEffect(() => {
		if (!active) return;

		const container = containerRef.current;
		if (!container) return;

		const focusableSelector =
			'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

		function handleKeyDown(event: KeyboardEvent) {
			if (event.key !== "Tab") return;

			const focusableElements =
				container!.querySelectorAll<HTMLElement>(focusableSelector);
			if (focusableElements.length === 0) return;

			const first = focusableElements[0]!;
			const last = focusableElements[focusableElements.length - 1]!;

			if (event.shiftKey) {
				if (document.activeElement === first) {
					event.preventDefault();
					last.focus();
				}
			} else {
				if (document.activeElement === last) {
					event.preventDefault();
					first.focus();
				}
			}
		}

		container.addEventListener("keydown", handleKeyDown);
		return () => container.removeEventListener("keydown", handleKeyDown);
	}, [active]);

	return containerRef;
}

/**
 * Save and restore focus when a component unmounts or an action completes.
 * Call `saveFocus()` before the action, and `restoreFocus()` after.
 */
export function useFocusRestore() {
	const savedElementRef = useRef<HTMLElement | null>(null);

	const saveFocus = useCallback(() => {
		savedElementRef.current = document.activeElement as HTMLElement | null;
	}, []);

	const restoreFocus = useCallback(() => {
		const element = savedElementRef.current;
		if (element && typeof element.focus === "function") {
			element.focus();
			savedElementRef.current = null;
		}
	}, []);

	useEffect(() => {
		return () => {
			savedElementRef.current = null;
		};
	}, []);

	return { saveFocus, restoreFocus };
}
