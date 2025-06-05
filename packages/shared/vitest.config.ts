/**
 * Vitest configuration for shared package
 * Tests utility functions and shared components
 */

import { defineConfig } from "vitest/config";
import { createPackageConfig } from "../vitest.config.base";

export default defineConfig(createPackageConfig(__dirname));
