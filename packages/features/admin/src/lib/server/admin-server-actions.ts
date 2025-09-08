"use server";

import { enhanceAction } from "@kit/next/actions";
import { getLogger } from "@kit/shared/logger";
import { getSupabaseServerAdminClient } from "@kit/supabase/server-admin-client";
import { getSupabaseServerClient } from "@kit/supabase/server-client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
	BanUserSchema,
	DeleteAccountSchema,
	DeleteUserSchema,
	ImpersonateUserSchema,
	ReactivateUserSchema,
} from "./schema/admin-actions.schema";
import { CreateUserSchema } from "./schema/create-user.schema";
import { ResetPasswordSchema } from "./schema/reset-password.schema";
import { createAdminAccountsService } from "./services/admin-accounts.service";
import { createAdminAuthUserService } from "./services/admin-auth-user.service";
import { adminAction } from "./utils/admin-action";

/**
 * Bans a user from the system, preventing them from accessing the application.
 *
 * This action marks a user as banned in the authentication system. Banned users
 * cannot log in or access any protected resources. The action is logged for
 * audit purposes.
 *
 * @param {Object} params - The action parameters
 * @param {string} params.userId - The UUID of the user to ban
 * @returns {Promise<{success: boolean}>} Success status of the operation
 * @throws {Error} If the ban operation fails
 *
 * @example
 * await banUserAction({ userId: '123e4567-e89b-12d3-a456-426614174000' });
 */
export const banUserAction = adminAction(
	enhanceAction(
		async ({ userId }) => {
			const service = getAdminAuthService();
			const logger = await getLogger();

			logger.info({ userId }, "Super Admin is banning user...");

			await service.banUser(userId);

			logger.info({ userId }, "Super Admin has successfully banned user");

			revalidateAdmin();

			return {
				success: true,
			};
		},
		{
			schema: BanUserSchema,
		},
	),
);

/**
 * Reactivates a previously banned user, restoring their access to the application.
 *
 * This action removes the ban status from a user account, allowing them to log in
 * and access the application again. The action is logged for audit purposes.
 *
 * @param {Object} params - The action parameters
 * @param {string} params.userId - The UUID of the user to reactivate
 * @returns {Promise<{success: boolean}>} Success status of the operation
 * @throws {Error} If the reactivation fails
 *
 * @example
 * await reactivateUserAction({ userId: '123e4567-e89b-12d3-a456-426614174000' });
 */
export const reactivateUserAction = adminAction(
	enhanceAction(
		async ({ userId }) => {
			const service = getAdminAuthService();
			const logger = await getLogger();

			logger.info({ userId }, "Super Admin is reactivating user...");

			await service.reactivateUser(userId);

			logger.info({ userId }, "Super Admin has successfully reactivated user");

			revalidateAdmin();

			return {
				success: true,
			};
		},
		{
			schema: ReactivateUserSchema,
		},
	),
);

/**
 * Impersonates a user account for debugging and support purposes.
 *
 * This action allows a super-admin to access the application as if they were
 * the specified user, useful for debugging user-specific issues. The impersonation
 * is logged for security and audit purposes.
 *
 * @param {Object} params - The action parameters
 * @param {string} params.userId - The UUID of the user to impersonate
 * @returns {Promise<Object>} Impersonation session data
 * @throws {Error} If impersonation fails
 *
 * @security This action should be used with extreme caution and only for legitimate support purposes
 *
 * @example
 * const session = await impersonateUserAction({ userId: '123e4567-e89b-12d3-a456-426614174000' });
 */
export const impersonateUserAction = adminAction(
	enhanceAction(
		async ({ userId }) => {
			const service = getAdminAuthService();
			const logger = await getLogger();

			logger.info({ userId }, "Super Admin is impersonating user...");

			return await service.impersonateUser(userId);
		},
		{
			schema: ImpersonateUserSchema,
		},
	),
);

/**
 * Permanently deletes a user account from the system.
 *
 * This action completely removes a user and all associated data from the authentication
 * system. This operation is irreversible. After successful deletion, the browser is
 * redirected to the admin accounts page.
 *
 * @param {Object} params - The action parameters
 * @param {string} params.userId - The UUID of the user to delete
 * @returns {Promise<void>} Redirects to /admin/accounts on success
 * @throws {Error} If the deletion fails
 *
 * @warning This action is irreversible and will permanently delete all user data
 *
 * @example
 * await deleteUserAction({ userId: '123e4567-e89b-12d3-a456-426614174000' });
 * // Browser will redirect to /admin/accounts
 */
export const deleteUserAction = adminAction(
	enhanceAction(
		async ({ userId }) => {
			const service = getAdminAuthService();
			const logger = await getLogger();

			logger.info({ userId }, "Super Admin is deleting user...");

			await service.deleteUser(userId);

			logger.info({ userId }, "Super Admin has successfully deleted user");

			revalidateAdmin();

			return redirect("/admin/accounts");
		},
		{
			schema: DeleteUserSchema,
		},
	),
);

/**
 * Permanently deletes an entire account (team or personal) from the system.
 *
 * This action removes an account and all associated data, including memberships,
 * subscriptions, and related resources. This operation is irreversible. After
 * successful deletion, the browser is redirected to the admin accounts page.
 *
 * @param {Object} params - The action parameters
 * @param {string} params.accountId - The UUID of the account to delete
 * @returns {Promise<void>} Redirects to /admin/accounts on success
 * @throws {Error} If the deletion fails
 *
 * @warning This action is irreversible and will delete the account and all associated data
 *
 * @example
 * await deleteAccountAction({ accountId: '123e4567-e89b-12d3-a456-426614174000' });
 * // Browser will redirect to /admin/accounts
 */
export const deleteAccountAction = adminAction(
	enhanceAction(
		async ({ accountId }) => {
			const service = getAdminAccountsService();
			const logger = await getLogger();

			logger.info({ accountId }, "Super Admin is deleting account...");

			await service.deleteAccount(accountId);

			logger.info(
				{ accountId },
				"Super Admin has successfully deleted account",
			);

			revalidateAdmin();

			return redirect("/admin/accounts");
		},
		{
			schema: DeleteAccountSchema,
		},
	),
);

/**
 * Creates a new user account in the authentication system.
 *
 * This action creates a new user with the specified email and password. Optionally,
 * the email can be auto-confirmed to skip email verification. The action is logged
 * for audit purposes.
 *
 * @param {Object} params - The action parameters
 * @param {string} params.email - The email address for the new user
 * @param {string} params.password - The password for the new user account
 * @param {boolean} params.emailConfirm - Whether to auto-confirm the email address
 * @returns {Promise<{success: boolean, user: Object}>} Success status and created user object
 * @throws {Error} If user creation fails (e.g., email already exists)
 *
 * @example
 * const result = await createUserAction({
 *   email: 'newuser@example.com',
 *   password: 'SecurePassword123!',
 *   emailConfirm: true
 * });
 * console.log('Created user:', result.user.id);
 */
export const createUserAction = adminAction(
	enhanceAction(
		async ({ email, password, emailConfirm }) => {
			const adminClient = getSupabaseServerAdminClient();
			const logger = await getLogger();

			logger.info({ email }, "Super Admin is creating a new user...");

			const { data, error } = await adminClient.auth.admin.createUser({
				email,
				password,
				email_confirm: emailConfirm,
			});

			if (error) {
				logger.error({ error }, "Error creating user");
				throw new Error(`Error creating user: ${error.message}`);
			}

			logger.info(
				{ userId: data.user.id },
				"Super Admin has successfully created a new user",
			);

			revalidateAdmin();

			return {
				success: true,
				user: data.user,
			};
		},
		{
			schema: CreateUserSchema,
		},
	),
);

/**
 * Initiates a password reset for a user by sending them a reset email.
 *
 * This action triggers the password reset flow for a specified user. A password
 * reset link is sent to the user's registered email address. The action is logged
 * for security and audit purposes.
 *
 * @param {Object} params - The action parameters
 * @param {string} params.userId - The UUID of the user whose password should be reset
 * @returns {Promise<Object>} Result of the password reset operation
 * @throws {Error} If the password reset fails
 *
 * @example
 * const result = await resetPasswordAction({ userId: '123e4567-e89b-12d3-a456-426614174000' });
 * console.log('Password reset email sent');
 */
export const resetPasswordAction = adminAction(
	enhanceAction(
		async ({ userId }) => {
			const service = getAdminAuthService();
			const logger = await getLogger();

			logger.info({ userId }, "Super Admin is resetting user password...");

			const result = await service.resetPassword(userId);

			logger.info(
				{ userId },
				"Super Admin has successfully sent password reset email",
			);

			revalidateAdmin();

			return result;
		},
		{
			schema: ResetPasswordSchema,
		},
	),
);

function revalidateAdmin() {
	revalidatePath("/admin", "layout");
}

function getAdminAuthService() {
	const client = getSupabaseServerClient();
	const adminClient = getSupabaseServerAdminClient();

	return createAdminAuthUserService(client, adminClient);
}

function getAdminAccountsService() {
	const adminClient = getSupabaseServerAdminClient();

	return createAdminAccountsService(adminClient);
}
