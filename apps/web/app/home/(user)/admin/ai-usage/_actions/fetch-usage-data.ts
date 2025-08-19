"use server";

import { enhanceAction } from "@kit/next/actions";
import { createServiceLogger } from "@kit/shared/logger";
import { getSupabaseServerClient } from "@kit/supabase/server-client";
import type { JWTUserData } from "@kit/supabase/types";
import { z } from "zod";

const { getLogger } = createServiceLogger("FETCH-USAGE-DATA");

import type { UsageStats } from "../_lib/types";

const UsageDataQuerySchema = z.object({
	timeRange: z.enum(["24h", "7d", "30d", "90d"]),
	userId: z.string().optional(),
	teamId: z.string().optional(),
});

type UsageDataQuery = z.infer<typeof UsageDataQuerySchema>; // Define type for data

export const fetchUsageDataAction = enhanceAction(
	async (data: UsageDataQuery, user: JWTUserData | null) => {
		// Explicitly type data and user
		try {
			// Check if user is authenticated and has admin role
			if (!user || !hasAdminRole(user)) {
				return {
					success: false,
					error: "Unauthorized",
				};
			}

			const supabase = getSupabaseServerClient();
			const { timeRange, userId, teamId } = data;

			// Determine time interval based on the requested time range
			let timeInterval: string;
			switch (timeRange) {
				case "24h":
					timeInterval = "1 day";
					break;
				case "7d":
					timeInterval = "7 days";
					break;
				case "30d":
					timeInterval = "30 days";
					break;
				case "90d":
					timeInterval = "90 days";
					break;
				default:
					timeInterval = "7 days";
			}

			// Base query
			let query = supabase
				.from("ai_request_logs")
				.select("*")
				.gte("request_timestamp", `now() - interval '${timeInterval}'`);

			// Add filters if specified
			if (userId) {
				query = query.eq("user_id", userId);
			}

			if (teamId) {
				query = query.eq("team_id", teamId);
			}

			// Execute query
			const { data: logs, error } = await query;

			if (error) {
				throw new Error(`Failed to fetch AI usage data: ${error.message}`);
			}

			// Process the data to generate statistics
			const stats: UsageStats = processLogsToStats(logs || []);

			return {
				success: true,
				data: stats,
			};
		} catch (error) {
			const logger = await getLogger();
			logger.error("Error fetching AI usage data", {
				operation: "fetch_usage_data",
				error,
				timeRange: data.timeRange,
				userId: data.userId,
				teamId: data.teamId,
			});
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	},
	{
		auth: true,
		schema: UsageDataQuerySchema,
	},
);

// Define a type for the AI request logs
interface AiRequestLog {
	id: string;
	request_timestamp: string | null; // Allow null
	cost: number | null;
	total_tokens: number | null;
	model: string | null;
	feature: string | null;
	user_id: string | null;
	team_id: string | null;
	// Add other relevant fields from your ai_request_logs table
}

// Function to process logs into statistics
function processLogsToStats(logs: AiRequestLog[]): UsageStats {
	// Calculate total cost and tokens
	const totalCost = logs.reduce((sum, log) => sum + (log.cost || 0), 0);
	const totalTokens = logs.reduce(
		(sum, log) => sum + (log.total_tokens || 0),
		0,
	);

	// Group logs by day for the chart
	const usageByDay = groupLogsByDay(logs);

	// Group logs by model, feature, and user
	const usageByModel = groupLogsByField(logs, (log) => log.model);
	const usageByFeature = groupLogsByField(logs, (log) => log.feature);
	const usageByUser = groupLogsByField(logs, (log) => log.user_id);

	// Sort and limit to top 10 users
	const mostActiveUsers = Object.entries(usageByUser)
		.map(([user, { cost, tokens }]) => ({
			user,
			cost,
			tokens,
		}))
		.sort((a, b) => b.cost - a.cost)
		.slice(0, 10);

	return {
		totalCost,
		totalTokens,
		averageCost: logs.length ? totalCost / logs.length : 0,
		averageTokens: logs.length ? totalTokens / logs.length : 0,
		usageByDay,
		usageByModel: Object.entries(usageByModel).map(
			([model, { cost, tokens }]) => ({
				model: model || "unknown",
				cost,
				tokens,
			}),
		),
		usageByFeature: Object.entries(usageByFeature).map(
			([feature, { cost, tokens }]) => ({
				feature: feature || "unknown",
				cost,
				tokens,
			}),
		),
		mostActiveUsers,
	};
}

// Group logs by day for time-series chart
function groupLogsByDay(
	logs: AiRequestLog[], // Explicitly type logs
): { date: string; cost: number; tokens: number }[] {
	const dayMap: Record<string, { cost: number; tokens: number }> = {};

	// Group by day
	for (const log of logs) {
		// log is now implicitly typed as AiRequestLog
		// Safely access request_timestamp
		if (!log.request_timestamp) {
			continue; // Skip logs without a timestamp
		}

		let date: string;
		try {
			date = new Date(log.request_timestamp)
				.toISOString()
				.split("T")[0] as string; // Get YYYY-MM-DD
		} catch (timestampError) {
			// Note: Can't use async logger in sync function - would need to refactor to async
			// For now, just skip invalid timestamps silently in production
			if (process.env.NODE_ENV === "development") {
				// biome-ignore lint/suspicious/noConsole: Development logging for invalid timestamps
				console.error("Invalid timestamp in usage data:", {
					timestamp: log.request_timestamp,
					error: timestampError,
				});
			}
			continue; // Skip this log if timestamp is invalid
		}
		if (!dayMap[date]) {
			dayMap[date] = { cost: 0, tokens: 0 };
		}
		const dayEntry = dayMap[date];
		if (dayEntry) {
			dayEntry.cost += log.cost || 0;
			dayEntry.tokens += log.total_tokens || 0;
		}
	}

	// Convert to array and sort by date
	return Object.entries(dayMap)
		.map(([date, stats]) => ({
			date,
			cost: stats.cost,
			tokens: stats.tokens,
		}))
		.sort((a, b) => a.date.localeCompare(b.date));
}

// Group logs by a specific field using a selector function
function groupLogsByField<T extends AiRequestLog>(
	logs: T[],
	selector: (log: T) => string | null | undefined,
): Record<string, { cost: number; tokens: number }> {
	const result: Record<string, { cost: number; tokens: number }> = {};

	for (const log of logs) {
		// Skip if log is null or undefined
		if (!log) continue;

		// Get the field value using the selector
		const value = selector(log);

		// Default to 'unknown' if value is null or undefined
		const key =
			value !== null && value !== undefined ? String(value) : "unknown";

		// Initialize if needed
		if (!result[key]) {
			result[key] = { cost: 0, tokens: 0 };
		}

		// Add the cost and tokens using nullish coalescing
		result[key].cost += log.cost ?? 0;
		result[key].tokens += log.total_tokens ?? 0;
	}

	return result;
}

// Check if user has admin role
function hasAdminRole(user: JWTUserData): boolean {
	// Implement your admin role check logic here
	// This is a placeholder - you should replace with your actual admin role check
	return user.email?.endsWith("@slideheroes.com") || false;
}
