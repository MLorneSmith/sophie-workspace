"use client";

import { PlaceholdersAndVanishInput } from "@kit/ui/placeholders-and-vanish-input";

// Client-safe logger wrapper for development logging
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

export function CtaPresentationName() {
	return (
		<div className="w-full px-4">
			<PlaceholdersAndVanishInput
				placeholders={[
					"Market entry strategy for selling ice cubes in the Antarctic",
					"Market Domination: Why We Should Just Buy Everyone Out",
					"How to Outsmart Competitors (and Maybe Even Ourselves)",
					"Charging More for Less and Making It Seem Like a Bargain!",
					"Strategic Acquisition of the United States for Global Domination",
				]}
				onChange={(e) => {
					// Handle search input changes
					logger.debug("Presentation name search input changed", {
						value: e.target.value,
						length: e.target.value.length,
					});
				}}
				onSubmit={(e) => {
					e.preventDefault();
					// Handle search submission
					const input = e.currentTarget.querySelector("input");
					if (input) {
						logger.info("Presentation name search submitted", {
							value: input.value,
							length: input.value.length,
							timestamp: new Date().toISOString(),
						});
					}
				}}
			/>
		</div>
	);
}
