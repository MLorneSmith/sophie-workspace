import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "node",
<<<<<<< HEAD
		include: ["src/__tests__/**/*.test.ts"],
=======
		include: ["src/__tests__/spike-validation.test.ts"],
>>>>>>> origin/staging
	},
});
