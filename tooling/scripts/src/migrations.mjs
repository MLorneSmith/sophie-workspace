import { execSync } from "node:child_process";

export function checkPendingMigrations() {
	try {
		process.stdout.write("\x1b[34mChecking for pending migrations...\x1b[0m\n");

		const output = execSync("pnpm --filter web supabase migration list", {
			encoding: "utf-8",
			stdio: "pipe",
		});

		const lines = output.split("\n");

		// Skip header lines
		const migrationLines = lines.slice(4);

		const pendingMigrations = migrationLines
			.filter((line) => {
				const [local, remote] = line.split("│").map((s) => s.trim());
				return local !== "" && remote === "";
			})
			.map((line) => (line.split("│")[0] ?? "").trim());

		if (pendingMigrations.length > 0) {
			process.stdout.write(
				"\x1b[33m⚠️  There are pending migrations that need to be applied:\x1b[0m\n",
			);

			for (const migration of pendingMigrations) {
				process.stdout.write(`  - ${migration}\n`);
			}

			process.stdout.write(
				"\nSome functionality may not work as expected until these migrations are applied.\n",
			);

			process.stdout.write(
				'\nAfter testing the migrations in your local environment and ideally in a staging environment, please run "pnpm --filter web supabase db push" to apply them to your database. If you have any questions, please open a support ticket.\n',
			);
		} else {
			process.stdout.write(
				"\x1b[32m✅ All migrations are up to date.\x1b[0m\n",
			);
		}
	} catch (_error) {
		process.stdout.write(
			"\x1b[33m💡 Info: Project not yet linked to a remote Supabase project. Migration checks skipped - this is expected for new projects. Link your project when you're ready to sync with Supabase.\x1b[0m\n\n",
		);
	}
}
