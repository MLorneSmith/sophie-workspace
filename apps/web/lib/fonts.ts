import { cn } from "@kit/ui/utils";
import { DM_Sans, Plus_Jakarta_Sans } from "next/font/google";

/**
 * @sans
 * @description DM Sans - Contemporary, friendly, highly readable body font.
 */
const sans = DM_Sans({
	subsets: ["latin"],
	variable: "--font-sans",
	fallback: ["system-ui", "Helvetica Neue", "Helvetica", "Arial"],
	preload: true,
	weight: ["400", "500", "700"],
});

/**
 * @heading
 * @description Plus Jakarta Sans - Modern, geometric heading font.
 */
const heading = Plus_Jakarta_Sans({
	subsets: ["latin"],
	variable: "--font-heading",
	fallback: ["system-ui", "Helvetica Neue", "Helvetica", "Arial"],
	preload: true,
	weight: ["400", "500", "600", "700"],
});

// we export these fonts into the root layout
export { sans, heading };

/**
 * @name getFontsClassName
 * @description Get the class name for the root layout.
 * @param theme
 */
export function getFontsClassName(theme?: string) {
	const dark = theme === "dark";
	const light = !dark;

	const font = [sans.variable, heading.variable].reduce<string[]>(
		(acc, curr) => {
			if (acc.includes(curr)) return acc;

			acc.push(curr);
			return acc;
		},
		[],
	);

	return cn("bg-background min-h-screen antialiased", ...font, {
		dark,
		light,
	});
}
