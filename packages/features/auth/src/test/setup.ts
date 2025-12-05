/**
 * Test setup file for auth package
 * Configures testing environment for authentication functionality
 */

import { vi } from "vitest";

// Mock server-only package (Next.js specific import)
vi.mock("server-only", () => ({}));
