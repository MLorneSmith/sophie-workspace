import "server-only";

import { getLogger } from "@kit/shared/logger";
import { z } from "zod";

import type { CalcomBooking, CalcomBookingsResponse } from "./calcom-types";

const CALCOM_BASE_URL = "https://api.cal.com/v2";
const CALCOM_API_VERSION = "2024-08-13";

function getCalcomApiKey(): string {
	return z
		.string()
		.startsWith("cal_", "CALCOM_API_KEY must start with cal_ prefix")
		.parse(process.env.CALCOM_API_KEY);
}

class CalcomClient {
	private readonly namespace = "calcom.client";
	private readonly baseUrl = CALCOM_BASE_URL;

	private async request<T>(
		path: string,
		params?: Record<string, string>,
	): Promise<T> {
		const logger = await getLogger();
		const ctx = { name: this.namespace, path };

		const apiKey = getCalcomApiKey();
		const url = new URL(`${this.baseUrl}${path}`);

		if (params) {
			for (const [key, value] of Object.entries(params)) {
				url.searchParams.set(key, value);
			}
		}

		try {
			const response = await fetch(url.toString(), {
				method: "GET",
				headers: {
					Authorization: `Bearer ${apiKey}`,
					"cal-api-version": CALCOM_API_VERSION,
					"Content-Type": "application/json",
				},
				cache: "no-store",
			});

			if (!response.ok) {
				const errorText = await response.text().catch(() => "Unknown error");
				logger.error(
					{ ...ctx, status: response.status, errorText },
					"Cal.com API request failed",
				);
				throw new Error(
					`Cal.com API error: ${response.status} ${response.statusText}`,
				);
			}

			return response.json() as Promise<T>;
		} catch (error) {
			logger.error({ ...ctx, error }, "Cal.com API request error");
			throw error;
		}
	}

	async getBookings(
		params?: Record<string, string>,
	): Promise<CalcomBookingsResponse> {
		return this.request<CalcomBookingsResponse>("/bookings", params);
	}
}

export function createCalcomClient() {
	return new CalcomClient();
}

export async function fetchUpcomingBookings(
	email: string,
): Promise<CalcomBooking[]> {
	const logger = await getLogger();
	const ctx = { name: "calcom.fetchUpcomingBookings", email };

	try {
		const client = createCalcomClient();

		const response = await client.getBookings({
			status: "upcoming",
			attendeeEmail: email,
			sortStart: "asc",
			take: "10",
		});

		return response.data ?? [];
	} catch (error) {
		logger.error({ ...ctx, error }, "Failed to fetch upcoming bookings");
		return [];
	}
}
