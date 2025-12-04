/**
 * Unit tests for InvitationContextBuilder
 * Tests the context builder for invitation policy evaluation
 */

import type { Database } from "@kit/supabase/database";
import type { SupabaseClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createInvitationContextBuilder } from "./invitation-context-builder";

// Helper to create mock Supabase query builder
function createMockQueryBuilder(options?: {
	selectData?: any;
	selectError?: any;
}) {
	return {
		select: vi.fn().mockReturnThis(),
		eq: vi.fn().mockReturnThis(),
		single: vi.fn().mockResolvedValue({
			data: options?.selectData ?? null,
			error: options?.selectError ?? null,
		}),
		match: vi.fn().mockReturnThis(),
	};
}

// Helper to create a chainable mock builder
function createChainableMock(finalResult: any) {
	const builder: any = {};
	builder.select = vi.fn().mockReturnValue(builder);
	builder.eq = vi.fn().mockReturnValue(builder);
	builder.single = vi.fn().mockResolvedValue(finalResult);
	return builder;
}

// Helper to create mock Supabase client that properly chains methods
function createMockSupabaseClient(config?: {
	accountData?: any;
	accountError?: any;
	subscriptionData?: any;
	subscriptionError?: any;
	memberCountData?: number;
	memberCountError?: any;
}): SupabaseClient<Database> {
	const fromMock = vi.fn((table: string) => {
		if (table === "accounts") {
			// Use "accountData" in config to check if it was explicitly set (even to null)
			const accountData =
				config && "accountData" in config
					? config.accountData
					: { id: "acc-123" };
			return createChainableMock({
				data: accountData,
				error: config?.accountError ?? null,
			});
		}
		if (table === "subscriptions") {
			return createChainableMock({
				data: config?.subscriptionData ?? null,
				error: config?.subscriptionError ?? null,
			});
		}
		if (table === "accounts_memberships") {
			// This mock handles: .select("*", { count: "exact", head: true }).eq(...)
			// which returns { count } directly, not { data }
			// Use "memberCountData" in config to check if it was explicitly set (even to 0)
			const memberCount =
				config && "memberCountData" in config ? config.memberCountData : 2;
			const builder: any = {};
			builder.select = vi.fn().mockReturnValue(builder);
			builder.eq = vi.fn().mockResolvedValue({
				count: memberCount,
				error: config?.memberCountError ?? null,
			});
			return builder;
		}
		return createMockQueryBuilder();
	});

	return {
		from: fromMock,
	} as unknown as SupabaseClient<Database>;
}

describe("createInvitationContextBuilder", () => {
	describe("Factory Function", () => {
		it("should create a context builder instance", () => {
			const client = createMockSupabaseClient();
			const builder = createInvitationContextBuilder(client);

			expect(builder).toBeDefined();
		});

		it("should return an object with buildContext method", () => {
			const client = createMockSupabaseClient();
			const builder = createInvitationContextBuilder(client);

			expect(typeof builder.buildContext).toBe("function");
		});
	});

	describe("buildContext", () => {
		const mockUser = {
			id: "user-123",
			email: "inviter@example.com",
			aud: "authenticated",
			role: "authenticated",
		};

		const mockParams = {
			accountSlug: "test-account",
			invitations: [{ email: "invited@example.com", role: "member" }],
		};

		beforeEach(() => {
			vi.clearAllMocks();
		});

		it("should build context with all required fields", async () => {
			const client = createMockSupabaseClient({
				accountData: { id: "acc-123" },
				memberCountData: 3,
			});
			const builder = createInvitationContextBuilder(client);

			const context = await builder.buildContext(mockParams, mockUser as any);

			expect(context).toMatchObject({
				accountSlug: "test-account",
				accountId: "acc-123",
				currentMemberCount: 3,
				invitations: [{ email: "invited@example.com", role: "member" }],
				invitingUser: {
					id: "user-123",
					email: "inviter@example.com",
				},
			});
		});

		it("should include timestamp in context", async () => {
			const client = createMockSupabaseClient();
			const builder = createInvitationContextBuilder(client);

			const beforeTime = new Date().toISOString();
			const context = await builder.buildContext(mockParams, mockUser as any);
			const afterTime = new Date().toISOString();

			expect(context.timestamp).toBeDefined();
			expect(context.timestamp >= beforeTime).toBe(true);
			expect(context.timestamp <= afterTime).toBe(true);
		});

		it("should include metadata in context", async () => {
			const client = createMockSupabaseClient();
			const builder = createInvitationContextBuilder(client);

			const context = await builder.buildContext(mockParams, mockUser as any);

			expect(context.metadata).toEqual({
				accountSlug: "test-account",
				invitationCount: 1,
				invitingUserEmail: "inviter@example.com",
			});
		});

		it("should throw error when account not found", async () => {
			const client = createMockSupabaseClient({
				accountData: null,
			});
			const builder = createInvitationContextBuilder(client);

			await expect(
				builder.buildContext(mockParams, mockUser as any),
			).rejects.toThrow("Account not found");
		});

		it("should handle subscription data correctly", async () => {
			const subscriptionData = {
				id: "sub-123",
				status: "active",
				active: true,
				trial_starts_at: "2024-01-01T00:00:00Z",
				trial_ends_at: "2024-01-31T00:00:00Z",
				billing_provider: "stripe",
				subscription_items: [
					{
						id: "item-1",
						type: "flat",
						quantity: 1,
						product_id: "prod-1",
						variant_id: "var-1",
					},
				],
			};

			const client = createMockSupabaseClient({
				accountData: { id: "acc-123" },
				subscriptionData,
			});
			const builder = createInvitationContextBuilder(client);

			const context = await builder.buildContext(mockParams, mockUser as any);

			expect(context.subscription).toEqual({
				id: "sub-123",
				status: "active",
				provider: "stripe",
				active: true,
				trial_starts_at: "2024-01-01T00:00:00Z",
				trial_ends_at: "2024-01-31T00:00:00Z",
				items: [
					{
						id: "item-1",
						type: "flat",
						quantity: 1,
						product_id: "prod-1",
						variant_id: "var-1",
					},
				],
			});
		});

		it("should handle missing subscription", async () => {
			const client = createMockSupabaseClient({
				accountData: { id: "acc-123" },
				subscriptionData: null,
			});
			const builder = createInvitationContextBuilder(client);

			const context = await builder.buildContext(mockParams, mockUser as any);

			expect(context.subscription).toBeUndefined();
		});

		it("should handle subscription without trial dates", async () => {
			const subscriptionData = {
				id: "sub-123",
				status: "active",
				active: true,
				trial_starts_at: null,
				trial_ends_at: null,
				billing_provider: "stripe",
				subscription_items: [],
			};

			const client = createMockSupabaseClient({
				accountData: { id: "acc-123" },
				subscriptionData,
			});
			const builder = createInvitationContextBuilder(client);

			const context = await builder.buildContext(mockParams, mockUser as any);

			expect(context.subscription?.trial_starts_at).toBeUndefined();
			expect(context.subscription?.trial_ends_at).toBeUndefined();
		});

		it("should handle subscription without items", async () => {
			const subscriptionData = {
				id: "sub-123",
				status: "active",
				active: true,
				trial_starts_at: null,
				trial_ends_at: null,
				billing_provider: "stripe",
				subscription_items: null,
			};

			const client = createMockSupabaseClient({
				accountData: { id: "acc-123" },
				subscriptionData,
			});
			const builder = createInvitationContextBuilder(client);

			const context = await builder.buildContext(mockParams, mockUser as any);

			expect(context.subscription?.items).toEqual([]);
		});

		it("should handle zero member count", async () => {
			const client = createMockSupabaseClient({
				accountData: { id: "acc-123" },
				memberCountData: 0,
			});
			const builder = createInvitationContextBuilder(client);

			const context = await builder.buildContext(mockParams, mockUser as any);

			expect(context.currentMemberCount).toBe(0);
		});

		it("should handle multiple invitations", async () => {
			const paramsWithMultipleInvitations = {
				accountSlug: "test-account",
				invitations: [
					{ email: "user1@example.com", role: "member" },
					{ email: "user2@example.com", role: "admin" },
					{ email: "user3@example.com", role: "member" },
				],
			};

			const client = createMockSupabaseClient();
			const builder = createInvitationContextBuilder(client);

			const context = await builder.buildContext(
				paramsWithMultipleInvitations,
				mockUser as any,
			);

			expect(context.invitations).toHaveLength(3);
			expect(context.metadata?.invitationCount).toBe(3);
		});

		it("should query accounts table with correct slug", async () => {
			const client = createMockSupabaseClient();
			const builder = createInvitationContextBuilder(client);

			await builder.buildContext(mockParams, mockUser as any);

			expect(client.from).toHaveBeenCalledWith("accounts");
		});
	});
});
