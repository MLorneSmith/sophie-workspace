import "server-only";

import { getLogger } from "@kit/shared/logger";
import { cache } from "react";

import type { CalcomBooking } from "./calcom-types";
import { fetchUpcomingBookings } from "./calcom-client";

async function _fetchUserBookings(
	email: string,
): Promise<CalcomBooking[] | null> {
	const logger = await getLogger();
	const ctx = { name: "calcom.fetchUserBookings", email };

	try {
		const bookings = await fetchUpcomingBookings(email);

		const now = new Date();

		return bookings
			.filter(
				(booking) =>
					booking.status === "accepted" && new Date(booking.start) > now,
			)
			.sort(
				(a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
			)
			.slice(0, 2);
	} catch (error) {
		logger.error({ ...ctx, error }, "Failed to fetch user bookings");

		return null;
	}
}

export const fetchUserBookings = cache(_fetchUserBookings);

export async function loadCoachingSessions(
	userEmail: string,
): Promise<CalcomBooking[] | null> {
	return fetchUserBookings(userEmail);
}
