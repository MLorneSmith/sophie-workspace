/**
 * Test setup file for team-accounts package
 * Configures testing environment for team account functionality
 */

import { vi } from "vitest";

// Mock server-only package (Next.js specific import)
vi.mock("server-only", () => ({}));
