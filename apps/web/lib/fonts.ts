import { cn } from "@kit/ui/utils";
import { Whisper } from "next/font/google";
import localFont from "next/font/local";

/**
 * @sans
 * @description Untitled Sans - Clean, neutral grotesque for body text.
 * Test fonts from Klim Type Foundry.
 */
const sans = localFont({
	src: [
		{
			path: "../fonts/untitled-sans/test-untitled-sans-light.woff2",
			weight: "300",
			style: "normal",
		},
		{
			path: "../fonts/untitled-sans/test-untitled-sans-light-italic.woff2",
			weight: "300",
			style: "italic",
		},
		{
			path: "../fonts/untitled-sans/test-untitled-sans-regular.woff2",
			weight: "400",
			style: "normal",
		},
		{
			path: "../fonts/untitled-sans/test-untitled-sans-regular-italic.woff2",
			weight: "400",
			style: "italic",
		},
		{
			path: "../fonts/untitled-sans/test-untitled-sans-medium.woff2",
			weight: "500",
			style: "normal",
		},
		{
			path: "../fonts/untitled-sans/test-untitled-sans-medium-italic.woff2",
			weight: "500",
			style: "italic",
		},
		{
			path: "../fonts/untitled-sans/test-untitled-sans-bold.woff2",
			weight: "700",
			style: "normal",
		},
		{
			path: "../fonts/untitled-sans/test-untitled-sans-bold-italic.woff2",
			weight: "700",
			style: "italic",
		},
		{
			path: "../fonts/untitled-sans/test-untitled-sans-black.woff2",
			weight: "900",
			style: "normal",
		},
		{
			path: "../fonts/untitled-sans/test-untitled-sans-black-italic.woff2",
			weight: "900",
			style: "italic",
		},
	],
	variable: "--font-sans",
	fallback: ["system-ui", "Helvetica Neue", "Helvetica", "Arial"],
	preload: true,
});

/**
 * @heading
 * @description Untitled Sans - Same family for headings, unified typography.
 * Test fonts from Klim Type Foundry.
 */
const heading = localFont({
	src: [
		{
			path: "../fonts/untitled-sans/test-untitled-sans-medium.woff2",
			weight: "500",
			style: "normal",
		},
		{
			path: "../fonts/untitled-sans/test-untitled-sans-bold.woff2",
			weight: "700",
			style: "normal",
		},
		{
			path: "../fonts/untitled-sans/test-untitled-sans-black.woff2",
			weight: "900",
			style: "normal",
		},
	],
	variable: "--font-heading",
	fallback: ["system-ui", "Helvetica Neue", "Helvetica", "Arial"],
	preload: true,
});

/**
 * @script
 * @description Whisper - Realistic handwritten signature font.
 */
const script = Whisper({
	subsets: ["latin"],
	weight: "400",
	variable: "--font-script",
	display: "swap",
});

// we export these fonts into the root layout
export { sans, heading, script };

/**
 * @name getFontsClassName
 * @description Get the class name for the root layout.
 * @param theme
 */
export function getFontsClassName(theme?: string) {
	const dark = theme === "dark";
	const light = !dark;

	const font = [sans.variable, heading.variable, script.variable].reduce<
		string[]
	>((acc, curr) => {
		if (acc.includes(curr)) return acc;

		acc.push(curr);
		return acc;
	}, []);

	return cn("bg-background min-h-screen antialiased", ...font, {
		dark,
		light,
	});
}
