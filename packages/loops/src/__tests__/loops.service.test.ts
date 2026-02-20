import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock server-only to prevent import error in tests
vi.mock("server-only", () => ({}));

// Mock the logger
const mockLogger = {
	info: vi.fn(),
	warn: vi.fn(),
	error: vi.fn(),
};

vi.mock("@kit/shared/logger", () => ({
	getLogger: vi.fn(() => Promise.resolve(mockLogger)),
}));

// Mock the Loops client
const mockSendTransactionalEmail = vi.fn();
const mockSendEvent = vi.fn();

vi.mock("loops", () => {
	return {
		LoopsClient: class MockLoopsClient {
			sendTransactionalEmail = mockSendTransactionalEmail;
			sendEvent = mockSendEvent;
		},
	};
});

// Set LOOPS_API_KEY env before importing the service
process.env.LOOPS_API_KEY = "test-api-key";

// Import after mocks are set up
const { createLoopsService } = await import("../loops.service");

describe("LoopsService", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("sendTransactionalEmail", () => {
		it("should send a transactional email successfully", async () => {
			mockSendTransactionalEmail.mockResolvedValueOnce({ success: true });

			const service = createLoopsService();
			const result = await service.sendTransactionalEmail({
				transactionalId: "welcome-email",
				email: "user@example.com",
			});

			expect(result).toEqual({ success: true });
			expect(mockSendTransactionalEmail).toHaveBeenCalledWith({
				transactionalId: "welcome-email",
				email: "user@example.com",
				addToAudience: undefined,
				dataVariables: undefined,
			});
			expect(mockLogger.info).toHaveBeenCalled();
		});

		it("should send with data variables", async () => {
			mockSendTransactionalEmail.mockResolvedValueOnce({ success: true });

			const service = createLoopsService();
			const result = await service.sendTransactionalEmail({
				transactionalId: "course-notification",
				email: "user@example.com",
				addToAudience: true,
				dataVariables: { firstName: "John", courseName: "Presentation Skills" },
			});

			expect(result).toEqual({ success: true });
			expect(mockSendTransactionalEmail).toHaveBeenCalledWith({
				transactionalId: "course-notification",
				email: "user@example.com",
				addToAudience: true,
				dataVariables: { firstName: "John", courseName: "Presentation Skills" },
			});
		});

		it("should return error for invalid email", async () => {
			const service = createLoopsService();
			const result = await service.sendTransactionalEmail({
				transactionalId: "welcome-email",
				email: "invalid-email",
			});

			expect(result.success).toBe(false);
			expect(result.error).toBeDefined();
			expect(mockSendTransactionalEmail).not.toHaveBeenCalled();
			expect(mockLogger.error).toHaveBeenCalled();
		});

		it("should return error for empty transactionalId", async () => {
			const service = createLoopsService();
			const result = await service.sendTransactionalEmail({
				transactionalId: "",
				email: "user@example.com",
			});

			expect(result.success).toBe(false);
			expect(result.error).toBeDefined();
			expect(mockSendTransactionalEmail).not.toHaveBeenCalled();
		});

		it("should handle API errors gracefully", async () => {
			mockSendTransactionalEmail.mockRejectedValueOnce(
				new Error("API rate limit exceeded"),
			);

			const service = createLoopsService();
			const result = await service.sendTransactionalEmail({
				transactionalId: "welcome-email",
				email: "user@example.com",
			});

			expect(result).toEqual({
				success: false,
				error: "API rate limit exceeded",
			});
			expect(mockLogger.error).toHaveBeenCalled();
		});
	});

	describe("sendEvent", () => {
		it("should send an event with email successfully", async () => {
			mockSendEvent.mockResolvedValueOnce({ success: true });

			const service = createLoopsService();
			const result = await service.sendEvent({
				eventName: "userSignedUp",
				email: "user@example.com",
			});

			expect(result).toEqual({ success: true });
			expect(mockSendEvent).toHaveBeenCalledWith({
				eventName: "userSignedUp",
				email: "user@example.com",
				userId: undefined,
				contactProperties: undefined,
				eventProperties: undefined,
			});
			expect(mockLogger.info).toHaveBeenCalled();
		});

		it("should send an event with userId", async () => {
			mockSendEvent.mockResolvedValueOnce({ success: true });

			const service = createLoopsService();
			const result = await service.sendEvent({
				eventName: "courseEnrolled",
				userId: "user-123",
				eventProperties: {
					courseId: "course-1",
					courseName: "Presentation Skills",
				},
			});

			expect(result).toEqual({ success: true });
			expect(mockSendEvent).toHaveBeenCalledWith({
				eventName: "courseEnrolled",
				email: undefined,
				userId: "user-123",
				contactProperties: undefined,
				eventProperties: {
					courseId: "course-1",
					courseName: "Presentation Skills",
				},
			});
		});

		it("should send an event with contact properties", async () => {
			mockSendEvent.mockResolvedValueOnce({ success: true });

			const service = createLoopsService();
			const result = await service.sendEvent({
				eventName: "userSignedUp",
				email: "user@example.com",
				contactProperties: { firstName: "John" },
			});

			expect(result).toEqual({ success: true });
			expect(mockSendEvent).toHaveBeenCalledWith(
				expect.objectContaining({
					contactProperties: { firstName: "John" },
				}),
			);
		});

		it("should return error when neither email nor userId is provided", async () => {
			const service = createLoopsService();
			const result = await service.sendEvent({
				eventName: "someEvent",
			} as never);

			expect(result.success).toBe(false);
			expect(result.error).toBeDefined();
			expect(mockSendEvent).not.toHaveBeenCalled();
		});

		it("should return error for empty eventName", async () => {
			const service = createLoopsService();
			const result = await service.sendEvent({
				eventName: "",
				email: "user@example.com",
			});

			expect(result.success).toBe(false);
			expect(result.error).toBeDefined();
			expect(mockSendEvent).not.toHaveBeenCalled();
		});

		it("should handle API failure response", async () => {
			mockSendEvent.mockResolvedValueOnce({ success: false });

			const service = createLoopsService();
			const result = await service.sendEvent({
				eventName: "userSignedUp",
				email: "user@example.com",
			});

			expect(result).toEqual({
				success: false,
				error: "Loops API returned failure",
			});
			expect(mockLogger.warn).toHaveBeenCalled();
		});

		it("should handle API errors gracefully", async () => {
			mockSendEvent.mockRejectedValueOnce(new Error("Network error"));

			const service = createLoopsService();
			const result = await service.sendEvent({
				eventName: "userSignedUp",
				email: "user@example.com",
			});

			expect(result).toEqual({
				success: false,
				error: "Network error",
			});
			expect(mockLogger.error).toHaveBeenCalled();
		});
	});
});
