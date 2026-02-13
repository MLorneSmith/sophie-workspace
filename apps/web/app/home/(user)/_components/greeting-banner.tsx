"use client";

import { useEffect, useState } from "react";

interface GreetingBannerProps {
	firstName: string;
	accountCreatedAt: string | null;
	hasActivity: boolean;
}

function getGreeting(
	accountCreatedAt: string | null,
	hasActivity: boolean,
): string {
	// Brand new account (created within 24 hours)
	if (accountCreatedAt) {
		const ageMs = Date.now() - new Date(accountCreatedAt).getTime();
		if (ageMs < 24 * 60 * 60 * 1000) return "Welcome";
	}

	// Old account but no data — returning after a while
	if (!hasActivity) return "Welcome back";

	// Active returning user — time-of-day greeting
	const hour = new Date().getHours();
	if (hour < 12) return "Good morning";
	if (hour < 17) return "Good afternoon";
	return "Good evening";
}

export function GreetingBanner({
	firstName,
	accountCreatedAt,
	hasActivity,
}: GreetingBannerProps) {
	const [greeting, setGreeting] = useState("");

	useEffect(() => {
		setGreeting(getGreeting(accountCreatedAt, hasActivity));
	}, [accountCreatedAt, hasActivity]);

	if (!greeting) return null;

	return (
		<h2 className="font-heading mb-4 text-2xl tracking-tight">
			{greeting}, {firstName}
		</h2>
	);
}
