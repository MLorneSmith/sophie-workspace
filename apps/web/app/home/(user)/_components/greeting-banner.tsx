"use client";

import { useEffect, useState } from "react";

import type { DailyMessage } from "../_lib/types/daily-message.types";
import { detectUserCountry } from "../_lib/utils/detect-country";
import { getDailyMessage } from "../_lib/utils/get-daily-message";

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

function shouldShowDailyMessage(
	accountCreatedAt: string | null,
	hasActivity: boolean,
): boolean {
	// Only show for active returning users (time-of-day greeting)
	if (!hasActivity) return false;
	if (accountCreatedAt) {
		const ageMs = Date.now() - new Date(accountCreatedAt).getTime();
		if (ageMs < 24 * 60 * 60 * 1000) return false;
	}
	return true;
}

export function GreetingBanner({
	firstName,
	accountCreatedAt,
	hasActivity,
}: GreetingBannerProps) {
	const [greeting, setGreeting] = useState("");
	const [dailyMessage, setDailyMessage] = useState<DailyMessage | null>(null);

	useEffect(() => {
		setGreeting(getGreeting(accountCreatedAt, hasActivity));

		if (shouldShowDailyMessage(accountCreatedAt, hasActivity)) {
			const country = detectUserCountry();
			setDailyMessage(getDailyMessage(country));
		}
	}, [accountCreatedAt, hasActivity]);

	if (!greeting) return null;

	return (
		<div className="mb-4">
			<h2 className="font-heading mb-1 text-2xl tracking-tight">
				{greeting}, {firstName}
			</h2>

			{dailyMessage && (
				<p className="text-muted-foreground text-sm">
					{dailyMessage.emoji && `${dailyMessage.emoji} `}
					{dailyMessage.text}
				</p>
			)}
		</div>
	);
}
