"use client";

import { PlaceholdersAndVanishInput } from "@kit/ui/placeholders-and-vanish-input";

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
				onChange={(_e) => {
					// Handle search input changes
					// TODO: Async logger needed
					// (await getLogger()).info("Search input:", {
					// 	data: e.target.value,
					// });
				}}
				onSubmit={(e) => {
					e.preventDefault();
					// Handle search submission
					const input = e.currentTarget.querySelector("input");
					if (input) {
						// TODO: Async logger needed
						// (await getLogger()).info("Search submitted:", {
						// 	data: input.value,
						// });
					}
				}}
			/>
		</div>
	);
}
