import { NextResponse } from "next/server";
import { getDatabaseMetrics } from "../../../lib/database-adapter-singleton";

export async function GET() {
	try {
		const metrics = getDatabaseMetrics();
		const now = new Date();
		const dbConnected = metrics.consecutiveFailures === 0;
		const dbStatus = dbConnected ? "connected" : "disconnected";

		return NextResponse.json({
			status: dbConnected ? "healthy" : "unhealthy",
			timestamp: now.toISOString(),
			service: "payload-cms",
			database: {
				status: dbStatus,
				lastCheck: metrics.lastHealthCheck.toISOString(),
			},
			version: "3.79.0",
			ready: dbConnected,
		});
	} catch (error) {
		return NextResponse.json(
			{
				status: "unhealthy",
				timestamp: new Date().toISOString(),
				service: "payload-cms",
				error: error instanceof Error ? error.message : "Unknown error",
				ready: false,
			},
			{ status: 500 },
		);
	}
}
