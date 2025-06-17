import { execSync } from "node:child_process";

import { checkPendingMigrations } from "./migrations.mjs";

function runGitCommand(command) {
	try {
		return execSync(command, { encoding: "utf8", stdio: "pipe" }).trim();
	} catch (_error) {
		return null;
	}
}

function checkMakerkitVersion() {
	// Fetch the latest changes from upstream without merging
	const fetchResult = runGitCommand("git fetch upstream");

	if (fetchResult === null) {
		// Warning output for missing upstream setup
		process.stdout.write(
			"\x1b[33m⚠️ You have not setup 'upstream'. Please set up the upstream remote so you can update your Makerkit version.\x1b[0m\n",
		);

		return;
	}

	// Get the number of commits the local branch is behind upstream
	const behindCount = runGitCommand("git rev-list --count HEAD..upstream/main");

	if (behindCount === null) {
		// Warning output for git command failure
		process.stderr.write(
			"Failed to get commit count. Ensure you're on a branch that tracks upstream/main.\n",
		);

		return;
	}

	const count = Number.parseInt(behindCount, 10);
	const { severity } = getSeveriyLevel(count);

	if (severity === "critical") {
		// Critical version status output
		process.stdout.write(
			"\x1b[31m❌  Your Makerkit version is outdated. Please update to the latest version.\x1b[0m\n",
		);
	} else if (severity === "warning") {
		// Warning version status output
		process.stdout.write(
			"\x1b[33m⚠️  Your Makerkit version is outdated! Best to update to the latest version.\x1b[0m\n",
		);
	} else {
		// Success version status output
		process.stdout.write(
			"\x1b[32m✅ Your Makerkit version is up to date!\x1b[0m\n",
		);
	}

	if (count > 0) {
		logInstructions(count);
	}
}

function logInstructions(count) {
	// Version status information output
	process.stdout.write(
		`\x1b[33mYou are ${count} commit(s) behind the latest version.\x1b[0m\n`,
	);

	// Update recommendation output
	process.stdout.write(
		"\x1b[33mPlease consider updating to the latest version for bug fixes and optimizations that your version does not have.\x1b[0m\n",
	);

	// Update instructions output
	process.stdout.write(
		"\x1b[36mTo update, run: git pull upstream main\x1b[0m\n",
	);
}

function getSeveriyLevel(count) {
	if (count > 5) {
		return {
			severity: "critical",
		};
	}

	if (count > 0) {
		return {
			severity: "warning",
		};
	}

	return {
		severity: "success",
	};
}

checkMakerkitVersion();
checkPendingMigrations();
