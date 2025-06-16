"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { cn, setCookie } from "../lib/utils";
import { Button } from "../shadcn/button";

export function MobileModeToggle(props: { className?: string }) {
	const { resolvedTheme, setTheme } = useTheme();

	const toggleTheme = () => {
		const next = resolvedTheme === "dark" ? "light" : "dark";
		setTheme(next);
		setCookie('theme', next, { path: '/', maxAge: 31536000 });
	};

	return (
		<Button
			variant="ghost"
			size="icon"
			aria-label="Toggle theme"
			className={cn(props.className)}
			onClick={toggleTheme}
		>
			<Sun className="h-[0.9rem] w-[0.9rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
			<Moon className="absolute h-[0.9rem] w-[0.9rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
			<span className="sr-only">Toggle theme</span>
		</Button>
	);
}

