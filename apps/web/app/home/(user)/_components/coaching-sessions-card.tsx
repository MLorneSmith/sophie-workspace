"use client";

import { Button } from "@kit/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@kit/ui/card";
import { Calendar, Clock, ExternalLink } from "lucide-react";

import type { CoachingSessionData } from "../_lib/dashboard/types";

interface CoachingSessionsCardProps {
	sessions?: CoachingSessionData[] | null;
}

export function CoachingSessionsCard({ sessions }: CoachingSessionsCardProps) {
	return (
		<Card className="flex flex-col overflow-hidden border-l-4 border-l-[#24E0DD]">
			<CardHeader className="pb-3">
				<CardTitle className="font-heading flex items-center gap-2">
					<Calendar className="h-4 w-4" aria-hidden="true" />
					Coaching Sessions
				</CardTitle>
			</CardHeader>

			<CardContent className="flex-1">
				<SessionsContent sessions={sessions} />
			</CardContent>
		</Card>
	);
}

function SessionsContent({
	sessions,
}: {
	sessions?: CoachingSessionData[] | null;
}) {
	if (!sessions) {
		return <BookingCta />;
	}

	if (sessions.length === 0) {
		return <BookingCta />;
	}

	const upcoming = sessions.filter((s) => s.status === "upcoming").slice(0, 2);

	if (upcoming.length === 0) {
		return <BookingCta />;
	}

	return (
		<div className="space-y-3">
			{upcoming.map((session) => (
				<SessionRow key={session.id} session={session} />
			))}
		</div>
	);
}

function SessionRow({ session }: { session: CoachingSessionData }) {
	return (
		<div className="flex items-start justify-between gap-2 rounded-md border p-3">
			<div className="min-w-0 flex-1 space-y-1">
				<p className="truncate text-sm font-medium">{session.title}</p>
				<div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
					<span>{session.date}</span>
					<span className="flex items-center gap-1">
						<Clock className="h-3 w-3" aria-hidden="true" />
						{session.time}
					</span>
				</div>
			</div>

			{session.joinLink && (
				<a
					href={session.joinLink}
					target="_blank"
					rel="noopener noreferrer"
					aria-label={`Join session: ${session.title} on ${session.date}`}
					className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline"
				>
					<span className="hidden sm:inline">Join Session</span>
					<ExternalLink
						className="h-3.5 w-3.5 sm:h-3 sm:w-3"
						aria-hidden="true"
					/>
				</a>
			)}
		</div>
	);
}

function BookingCta() {
	const coachUsername = process.env.NEXT_PUBLIC_CALCOM_COACH_USERNAME;
	const eventSlug = process.env.NEXT_PUBLIC_CALCOM_EVENT_SLUG;
	const bookingUrl =
		coachUsername && eventSlug
			? `https://cal.com/${coachUsername}/${eventSlug}`
			: null;

	return (
		<div className="flex flex-col items-center justify-center gap-3 py-4 text-center">
			<p className="text-muted-foreground text-sm">No upcoming sessions</p>
			{bookingUrl ? (
				<Button variant="outline" size="sm" asChild>
					<a
						href={bookingUrl}
						target="_blank"
						rel="noopener noreferrer"
						aria-label="Book a coaching session"
					>
						<Calendar className="mr-2 h-4 w-4" aria-hidden="true" />
						Book a Session
					</a>
				</Button>
			) : (
				<p className="text-muted-foreground text-xs">
					Contact your coach to schedule a session
				</p>
			)}
		</div>
	);
}
