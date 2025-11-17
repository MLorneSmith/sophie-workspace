import { execSync } from "node:child_process";

export function checkPendingMigrations() {
	try {
		const output = execSync("pnpm --filter web supabase migrations list", {
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
			pendingMigrations.forEach((_migration) => {});
		} else {
		}
	} catch (_error) {}
}
