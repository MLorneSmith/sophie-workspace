/**
 * Test setup file for accounts package
 * Configures testing environment for account functionality
 */

import { vi } from "vitest";

// Mock server-only package (Next.js specific import)
vi.mock("server-only", () => ({}));
