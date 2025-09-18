import { exec } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function GetMigrations() {
	return readdir(join(process.cwd(), "apps", "web", "supabase", "migrations"));
}

export function getMigrationContent(path: string) {
	return readFile(
		join(process.cwd(), "apps", "web", "supabase", "migrations", path),
		"utf8",
	);
}

export function CreateMigration(name: string) {
	return promisify(exec)(`pnpm --filter web supabase migration new ${name}`);
}

export function Diff() {
	return promisify(exec)("supabase migration diff");
}

export function registerGetMigrationsTools(server: McpServer) {
	createGetMigrationsTool(server);
	createGetMigrationContentTool(server);
	createCreateMigrationTool(server);
	createDiffMigrationTool(server);
}

function createDiffMigrationTool(server: McpServer) {
	return server.tool(
		"diff_migrations",
		"Compare differences between the declarative schemas and the applied migrations in Supabase",
		async () => {
			const { stdout } = await Diff();

			return {
				content: [
					{
						type: "text",
						text: stdout,
					},
				],
			};
		},
	);
}

function createCreateMigrationTool(server: McpServer) {
	return server.tool(
		"create_migration",
		"Create a new Supabase Postgres migration file",
		{
			state: z.object({
				name: z.string(),
			}),
		},
		async ({ state }) => {
			const { stdout } = await CreateMigration(state.name);

			return {
				content: [
					{
						type: "text",
						text: stdout,
					},
				],
			};
		},
	);
}

function createGetMigrationContentTool(server: McpServer) {
	return server.tool(
		"get_migration_content",
		"📜 Get migration file content (HISTORICAL) - For current state use get_schema_content instead",
		{
			state: z.object({
				path: z.string(),
			}),
		},
		async ({ state }) => {
			const content = await getMigrationContent(state.path);

			return {
				content: [
					{
						type: "text",
						text: `📜 MIGRATION FILE: ${state.path} (HISTORICAL)\n\nNote: This shows historical changes. For current database state, use get_schema_content instead.\n\n${content}`,
					},
				],
			};
		},
	);
}

function createGetMigrationsTool(server: McpServer) {
	return server.tool(
		"get_migrations",
		"📜 Get migration files (HISTORICAL CHANGES) - Use schema files for current state instead",
		async () => {
			const migrations = await GetMigrations();

			return {
				content: [
					{
						type: "text",
						text: `📜 MIGRATION FILES (HISTORICAL CHANGES)\n\nNote: For current database state, use get_schema_files instead. Migrations show historical changes.\n\n${migrations.join("\n")}`,
					},
				],
			};
		},
	);
}
