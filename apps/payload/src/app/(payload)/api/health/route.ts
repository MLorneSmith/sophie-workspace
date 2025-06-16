import { NextResponse } from "next/server";
import { getDatabaseMetrics } from "../../../../lib/database-adapter-singleton";

export async function GET() {
	const metrics = getDatabaseMetrics();
	const now = new Date();
	const dbConnected = metrics.consecutiveFailures === 0;
	const dbStatus = dbConnected ? "connected" : "disconnected";

	return NextResponse.json({
		status: dbConnected ? "healthy" : "unhealthy",
		timestamp: now.toISOString(),
		database: {
			status: dbStatus,
			lastCheck: metrics.lastHealthCheck.toISOString(),
		},
		version: "3.42.0",
	});
}
