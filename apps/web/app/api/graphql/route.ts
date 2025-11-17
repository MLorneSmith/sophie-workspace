import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * GraphQL API endpoint placeholder.
 *
 * This endpoint provides a minimal GraphQL implementation for integration testing.
 * It returns a simple health check response.
 *
 * Note: This is a placeholder. If GraphQL functionality is needed in the future,
 * this should be replaced with a proper GraphQL server implementation.
 */

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { query } = body;

		// Handle introspection query for integration tests
		// Check for secret header to bypass Vercel WAF restrictions
		if (query?.includes("__schema") || query?.includes("__type")) {
			const allowHeader = request.headers.get("x-allow-introspection");
			const expectedSecret =
				process.env.INTROSPECTION_SECRET || "dev-test-secret";

			// Only allow introspection with correct secret header or in development
			if (
				process.env.NODE_ENV !== "production" ||
				allowHeader === expectedSecret
			) {
				return NextResponse.json({
					data: {
						__schema: {
							queryType: {
								name: "Query",
							},
						},
					},
				});
			} else {
				// Return the same error format as Vercel WAF for consistency
				return NextResponse.json({
					errors: [
						{
							message:
								"GraphQL introspection is not allowed, but the query contained __schema or __type",
							locations: [{ line: 1, column: 3 }],
						},
					],
				});
			}
		}

		// Handle health query
		if (query?.includes("health")) {
			return NextResponse.json({
				data: {
					health: "ok",
					version: "1.0.0",
				},
			});
		}

		// Default response for other queries
		return NextResponse.json({
			data: null,
			errors: [
				{
					message: "Query not supported in this minimal GraphQL implementation",
				},
			],
		});
	} catch {
		return NextResponse.json(
			{
				errors: [
					{
						message: "Invalid GraphQL request",
					},
				],
			},
			{ status: 400 },
		);
	}
}

// Also support GET for GraphQL playground (optional)
export async function GET() {
	return NextResponse.json({
		message: "GraphQL endpoint",
		status: "ok",
		note: "This is a minimal GraphQL implementation for integration testing. Use POST method with GraphQL queries.",
	});
}
