import { render, screen, waitFor } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LessonViewClient } from "./LessonViewClient";

// Mock next/dynamic to render Confetti directly
vi.mock("next/dynamic", () => ({
	default: (importFn: () => Promise<{ default: React.ComponentType }>) => {
		// Return a simple component that marks confetti rendering
		const MockConfetti = (props: {
			numberOfPieces?: number;
			recycle?: boolean;
		}) => (
			<div
				data-testid="confetti-component"
				data-pieces={props.numberOfPieces}
				data-recycle={String(props.recycle)}
			>
				Confetti
			</div>
		);
		return MockConfetti;
	},
}));

// Mock react-dom createPortal to render children directly
vi.mock("react-dom", async () => {
	const actual = await vi.importActual("react-dom");
	return {
		...actual,
		createPortal: (children: React.ReactNode) => children,
	};
});

// Mock dependencies
vi.mock("@kit/cms/payload", () => ({
	PayloadContentRenderer: ({ content }: { content: unknown }) => (
		<div data-testid="payload-content">{JSON.stringify(content)}</div>
	),
	getCourseLessons: vi.fn(),
}));

// Mock server actions
vi.mock("../../../_lib/server/server-actions", () => ({
	updateLessonProgressAction: vi.fn(() => Promise.resolve()),
	submitQuizAttemptAction: vi.fn(() => Promise.resolve()),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
	},
}));

// Mock UI components
vi.mock("@kit/ui/button", () => ({
	Button: ({
		children,
		onClick,
		disabled,
		className,
		asChild,
		...props
	}: React.PropsWithChildren<{
		onClick?: () => void;
		disabled?: boolean;
		className?: string;
		asChild?: boolean;
	}>) =>
		asChild ? (
			<>{children}</>
		) : (
			<button
				onClick={onClick}
				disabled={disabled}
				className={className}
				{...props}
			>
				{children}
			</button>
		),
}));

vi.mock("@kit/ui/card", () => ({
	Card: ({
		children,
		...props
	}: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) => (
		<div data-testid="card" {...props}>
			{children}
		</div>
	),
	CardContent: ({
		children,
		...props
	}: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) => (
		<div data-testid="card-content" {...props}>
			{children}
		</div>
	),
	CardFooter: ({
		children,
		...props
	}: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) => (
		<div data-testid="card-footer" {...props}>
			{children}
		</div>
	),
	CardHeader: ({
		children,
		...props
	}: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) => (
		<div data-testid="card-header" {...props}>
			{children}
		</div>
	),
	CardTitle: ({
		children,
		...props
	}: React.PropsWithChildren<React.HTMLAttributes<HTMLHeadingElement>>) => (
		<h3 data-testid="card-title" {...props}>
			{children}
		</h3>
	),
}));

// Mock Lucide icons
vi.mock("lucide-react", () => ({
	BookOpen: () => <span data-testid="icon-book-open">📖</span>,
	Briefcase: () => <span data-testid="icon-briefcase">💼</span>,
	CheckCircle: () => <span data-testid="icon-check-circle">✓</span>,
	CheckSquare: () => <span data-testid="icon-check-square">☑</span>,
	ChevronLeft: () => <span data-testid="icon-chevron-left">←</span>,
	ChevronRight: () => <span data-testid="icon-chevron-right">→</span>,
	Play: () => <span data-testid="icon-play">▶</span>,
}));

// Mock next/link
vi.mock("next/link", () => ({
	default: ({
		children,
		href,
		...props
	}: React.PropsWithChildren<{ href: string }>) => (
		<a href={href} {...props}>
			{children}
		</a>
	),
}));

// Helper to create a basic lesson
const createBasicLesson = (overrides = {}) => ({
	id: "lesson-1",
	title: "Test Lesson",
	slug: "test-lesson",
	content: { root: { children: [] } },
	lessonNumber: 1,
	lesson_number: "1",
	course: "course-1",
	estimated_duration: 10,
	...overrides,
});

// Helper to create congratulations lesson (identified by slug, not lesson_number)
const createCongratulationsLesson = (overrides = {}) =>
	createBasicLesson({
		id: "lesson-congratulations",
		title: "Congratulations!",
		slug: "congratulations",
		lesson_number: "30", // Actual database value
		...overrides,
	});

describe("LessonViewClient", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Confetti Animation", () => {
		it("should render confetti for congratulations lesson (identified by slug)", async () => {
			// Arrange
			const congratsLesson = createCongratulationsLesson();

			// Act
			render(
				<LessonViewClient
					lesson={congratsLesson}
					quiz={null}
					quizAttempts={[]}
					lessonProgress={null}
					userId="user-1"
				/>,
			);

			// Assert - Confetti should be rendered
			await waitFor(() => {
				expect(screen.getByTestId("confetti-component")).toBeInTheDocument();
			});
		});

		it("should NOT render confetti for regular lessons", () => {
			// Arrange
			const regularLesson = createBasicLesson({ lesson_number: "1" });

			// Act
			render(
				<LessonViewClient
					lesson={regularLesson}
					quiz={null}
					quizAttempts={[]}
					lessonProgress={null}
					userId="user-1"
				/>,
			);

			// Assert - Confetti should NOT be rendered
			expect(
				screen.queryByTestId("confetti-component"),
			).not.toBeInTheDocument();
		});

		it("should configure confetti with correct props (500 pieces, no recycle)", async () => {
			// Arrange
			const congratsLesson = createCongratulationsLesson();

			// Act
			render(
				<LessonViewClient
					lesson={congratsLesson}
					quiz={null}
					quizAttempts={[]}
					lessonProgress={null}
					userId="user-1"
				/>,
			);

			// Assert
			await waitFor(() => {
				const confetti = screen.getByTestId("confetti-component");
				expect(confetti).toHaveAttribute("data-pieces", "500");
				expect(confetti).toHaveAttribute("data-recycle", "false");
			});
		});

		it("should render congratulations message for congratulations lesson", () => {
			// Arrange
			const congratsLesson = createCongratulationsLesson();

			// Act
			render(
				<LessonViewClient
					lesson={congratsLesson}
					quiz={null}
					quizAttempts={[]}
					lessonProgress={null}
					userId="user-1"
				/>,
			);

			// Assert
			expect(
				screen.getByText(/Congratulations on completing the course!/i),
			).toBeInTheDocument();
			expect(screen.getByText(/View Certificate/i)).toBeInTheDocument();
		});

		it("should NOT render congratulations section for non-congratulations lessons", () => {
			// Arrange
			const regularLesson = createBasicLesson({
				slug: "regular-lesson",
				lesson_number: "100",
			});

			// Act
			render(
				<LessonViewClient
					lesson={regularLesson}
					quiz={null}
					quizAttempts={[]}
					lessonProgress={null}
					userId="user-1"
				/>,
			);

			// Assert
			expect(
				screen.queryByText(/Congratulations on completing the course!/i),
			).not.toBeInTheDocument();
			expect(screen.queryByText(/View Certificate/i)).not.toBeInTheDocument();
		});

		it("should render confetti when lesson_number is 30 but slug is congratulations", async () => {
			// This test ensures we don't regress if lesson_number changes
			// The fix uses slug-based identification, not lesson_number
			const congratsLesson = createCongratulationsLesson({
				lesson_number: "30", // Actual database value
			});

			render(
				<LessonViewClient
					lesson={congratsLesson}
					quiz={null}
					quizAttempts={[]}
					lessonProgress={null}
					userId="user-1"
				/>,
			);

			// Should render because slug matches, regardless of lesson_number
			await waitFor(() => {
				expect(screen.getByTestId("confetti-component")).toBeInTheDocument();
			});
		});

		it("should NOT render confetti for lesson_number 30 without congratulations slug", () => {
			// Ensures we don't accidentally trigger confetti for lesson 30 with different slug
			const regularLesson30 = createBasicLesson({
				slug: "some-other-lesson",
				lesson_number: "30",
			});

			render(
				<LessonViewClient
					lesson={regularLesson30}
					quiz={null}
					quizAttempts={[]}
					lessonProgress={null}
					userId="user-1"
				/>,
			);

			// Should NOT render because slug doesn't match
			expect(
				screen.queryByTestId("confetti-component"),
			).not.toBeInTheDocument();
		});
	});

	describe("Basic Rendering", () => {
		it("should render lesson title", () => {
			// Arrange
			const lesson = createBasicLesson({ title: "Introduction to Testing" });

			// Act
			render(
				<LessonViewClient
					lesson={lesson}
					quiz={null}
					quizAttempts={[]}
					lessonProgress={null}
					userId="user-1"
				/>,
			);

			// Assert
			expect(screen.getByText("Introduction to Testing")).toBeInTheDocument();
		});

		it("should render lesson duration", () => {
			// Arrange
			const lesson = createBasicLesson({ estimated_duration: 15 });

			// Act
			render(
				<LessonViewClient
					lesson={lesson}
					quiz={null}
					quizAttempts={[]}
					lessonProgress={null}
					userId="user-1"
				/>,
			);

			// Assert
			expect(screen.getByText("15 minutes")).toBeInTheDocument();
		});

		it("should render Back to Course link", () => {
			// Arrange
			const lesson = createBasicLesson();

			// Act
			render(
				<LessonViewClient
					lesson={lesson}
					quiz={null}
					quizAttempts={[]}
					lessonProgress={null}
					userId="user-1"
				/>,
			);

			// Assert
			expect(screen.getByText(/Back to Course/i)).toBeInTheDocument();
		});
	});

	describe("Lesson Completion State", () => {
		it("should show Mark as Completed button for incomplete lesson", () => {
			// Arrange
			const lesson = createBasicLesson();

			// Act
			render(
				<LessonViewClient
					lesson={lesson}
					quiz={null}
					quizAttempts={[]}
					lessonProgress={null}
					userId="user-1"
				/>,
			);

			// Assert
			expect(screen.getByText(/Mark as Completed/i)).toBeInTheDocument();
		});

		it("should show Completed button for completed lesson", () => {
			// Arrange
			const lesson = createBasicLesson();
			const lessonProgress = {
				id: "progress-1",
				user_id: "user-1",
				course_id: "course-1",
				lesson_id: "lesson-1",
				completion_percentage: 100,
				completed_at: new Date().toISOString(),
				started_at: new Date().toISOString(),
			};

			// Act
			render(
				<LessonViewClient
					lesson={lesson}
					quiz={null}
					quizAttempts={[]}
					lessonProgress={lessonProgress}
					userId="user-1"
				/>,
			);

			// Assert
			expect(screen.getByText("Completed")).toBeInTheDocument();
			expect(screen.getByText(/Next Lesson/i)).toBeInTheDocument();
		});
	});
});
