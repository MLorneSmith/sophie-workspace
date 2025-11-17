"use server";

import { relative } from "node:path";
import { DatabaseTool } from "@kit/mcp-server/database";

export async function getTableDetailsAction(
	tableName: string,
	schema = "public",
) {
	try {
		DatabaseTool.ROOT_PATH = relative(process.cwd(), "../..");

		const tableInfo = await DatabaseTool.getTableInfo(schema, tableName);

		return {
			success: true,
			data: tableInfo,
		};
	} catch (error) {
		return {
			success: false,
			error: `Failed to fetch table information: ${(error as Error).message}`,
		};
	}
}
