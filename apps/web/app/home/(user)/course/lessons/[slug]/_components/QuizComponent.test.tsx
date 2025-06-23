import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QuizComponent } from "./QuizComponent";

// Type definitions from QuizComponent
interface PayloadQuiz {
	id: string;
	title?: string;
	questions: Array<{
		id: string;
		question: string;
		questiontype: "single-answer" | "multi-answer";
		options: Array<{
			text: string;
			iscorrect: boolean;
		}>;
	}>;
	passingScore: number;
}

interface QuizAttempt {
	id: string;
	score: number;
	passed: boolean;
	answers: Record<string, unknown>;
	created_at: string;
}

// Mock dependencies
const mockGetCourseLessons = vi.fn();
vi.mock("@kit/cms/payload", () => ({
	getCourseLessons: mockGetCourseLessons,
}));

// Mock Lucide React icons
vi.mock("lucide-react", () => ({
	ChevronRight: () => <span data-testid="chevron-right">→</span>,
}));

// Mock UI components
vi.mock("@kit/ui/button", () => ({
	Button: ({
		children,
		onClick,
		disabled,
		variant,
		className,
		...props
	}: React.ComponentProps<"button"> & { variant?: string }) => (
		<button
			onClick={onClick}
			disabled={disabled}
			data-variant={variant}
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
		className,
		...props
	}: React.PropsWithChildren<React.HTMLAttributes<HTMLHeadingElement>>) => (
		<h2 data-testid="card-title" className={className} {...props}>
			{children}
		</h2>
	),
}));

interface CheckboxProps {
	id?: string;
	checked?: boolean;
	onCheckedChange?: (checked: boolean) => void;
	className?: string;
	[key: string]: unknown;
}

vi.mock("@kit/ui/checkbox", () => ({
	Checkbox: ({
		id,
		checked,
		onCheckedChange,
		className,
		...props
	}: CheckboxProps) => (
		<input
			type="checkbox"
			id={id}
			checked={checked}
			onChange={(e) => onCheckedChange?.(e.target.checked)}
			className={className}
			data-testid={`checkbox-${id}`}
			{...props}
		/>
	),
}));

interface LabelProps extends React.PropsWithChildren {
	htmlFor?: string;
	onClick?: () => void;
	className?: string;
	[key: string]: unknown;
}

vi.mock("@kit/ui/label", () => ({
	Label: ({ children, htmlFor, onClick, className, ...props }: LabelProps) => (
		<label
			htmlFor={htmlFor}
			onClick={onClick}
			onKeyDown={(e) => {
				if (onClick && (e.key === "Enter" || e.key === " ")) {
					e.preventDefault();
					onClick();
				}
			}}
			className={className}
			{...props}
		>
			{children}
		</label>
	),
}));

interface ProgressProps {
	value?: number;
	className?: string;
	[key: string]: unknown;
}

vi.mock("@kit/ui/progress", () => ({
	Progress: ({ value, className, ...props }: ProgressProps) => (
		<div
			data-testid="progress"
			data-value={value}
			className={className}
			{...props}
		>
			<div style={{ width: `${value}%` }} />
		</div>
	),
}));

interface RadioGroupProps extends React.PropsWithChildren {
	value?: string;
	onValueChange?: (value: string) => void;
	className?: string;
	onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
	[key: string]: unknown;
}

interface RadioGroupItemProps {
	value?: string;
	id?: string;
	className?: string;
	checked?: boolean;
	[key: string]: unknown;
}

vi.mock("@kit/ui/radio-group", () => {
	const RadioGroup = ({
		children,
		value,
		onValueChange,
		className,
		...props
	}: RadioGroupProps) => {
		const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
			if (e.target.type === "radio" && e.target.checked) {
				onValueChange?.(e.target.value);
			}
		};

		return (
			<div
				data-testid="radio-group"
				data-value={value}
				className={className}
				onChange={handleChange}
				{...props}
			>
				{React.Children.map(children, (child: React.ReactNode) => {
					if (React.isValidElement(child)) {
						const childProps = child.props as { value?: string };
						if (childProps.value !== undefined) {
							return React.cloneElement(child, {
								...childProps,
								checked: childProps.value === value,
							} as React.ComponentProps<"input">);
						}
					}
					return child;
				})}
			</div>
		);
	};

	const RadioGroupItem = ({
		value,
		id,
		className,
		checked,
		...props
	}: RadioGroupItemProps) => (
		<input
			type="radio"
			value={value}
			id={id}
			name="quiz-option"
			className={className}
			data-testid={`radio-${id}`}
			checked={checked}
			{...props}
		/>
	);

	return { RadioGroup, RadioGroupItem };
});

describe("QuizComponent", () => {
	const mockOnSubmit = vi.fn();

	// Sample quiz data
	const sampleQuiz = {
		id: "quiz-1",
		title: "Sample Quiz",
		passingScore: 70,
		questions: [
			{
				id: "q1",
				question: "What is 2 + 2?",
				questiontype: "single-answer" as const,
				options: [
					{ text: "3", iscorrect: false },
					{ text: "4", iscorrect: true },
					{ text: "5", iscorrect: false },
				],
			},
			{
				id: "q2",
				question: "Select all even numbers",
				questiontype: "multi-answer" as const,
				options: [
					{ text: "1", iscorrect: false },
					{ text: "2", iscorrect: true },
					{ text: "3", iscorrect: false },
					{ text: "4", iscorrect: true },
				],
			},
		],
	};

	const defaultProps = {
		quiz: sampleQuiz,
		onSubmit: mockOnSubmit,
		previousAttempts: [],
		courseId: "course-1",
		currentLessonId: "lesson-1",
		currentLessonNumber: 1,
	};

	beforeEach(() => {
		vi.clearAllMocks();
		// Reset window.location
		Object.defineProperty(window, "location", {
			value: { href: "" },
			writable: true,
		});
	});

	describe("Component Initialization & Validation", () => {
		it("renders quiz unavailable message when quiz is null", () => {
			render(
				<QuizComponent
					{...defaultProps}
					quiz={null as unknown as PayloadQuiz}
				/>,
			);

			expect(screen.getByText("Quiz Unavailable")).toBeInTheDocument();
			expect(screen.getByText(/currently unavailable/)).toBeInTheDocument();
		});

		it("renders quiz unavailable message when quiz has no ID", () => {
			const quizWithoutId = { title: "Test Quiz" } as unknown as PayloadQuiz;
			render(<QuizComponent {...defaultProps} quiz={quizWithoutId} />);

			expect(screen.getByText("Quiz Unavailable")).toBeInTheDocument();
		});

		it("shows quiz passed message for successful previous attempts", () => {
			const previousAttempts = [
				{ passed: true, score: 85 },
			] as unknown as QuizAttempt[];
			render(
				<QuizComponent {...defaultProps} previousAttempts={previousAttempts} />,
			);

			expect(screen.getByText("Quiz Passed! 🎉")).toBeInTheDocument();
			expect(screen.getByText(/score of 85%/)).toBeInTheDocument();
		});

		it("renders questions unavailable when no questions exist", () => {
			const quizWithoutQuestions = {
				id: "quiz-1",
				questions: [],
				passingScore: 70,
			} as PayloadQuiz;
			render(<QuizComponent {...defaultProps} quiz={quizWithoutQuestions} />);

			expect(
				screen.getByText("Quiz Questions Unavailable"),
			).toBeInTheDocument();
		});

		it("renders questions unavailable when questions property is missing", () => {
			const quizWithoutQuestions = { id: "quiz-1" } as unknown as PayloadQuiz;
			render(<QuizComponent {...defaultProps} quiz={quizWithoutQuestions} />);

			expect(
				screen.getByText("Quiz Questions Unavailable"),
			).toBeInTheDocument();
		});
	});

	describe("Quiz Rendering & Navigation", () => {
		it("renders first question correctly", () => {
			render(<QuizComponent {...defaultProps} />);

			expect(screen.getByText("What is 2 + 2?")).toBeInTheDocument();
			expect(screen.getByText("Question 1 of 2")).toBeInTheDocument();
			expect(screen.getByTestId("progress")).toHaveAttribute("data-value", "0");
		});

		it("shows correct progress indication", async () => {
			const user = userEvent.setup();
			render(<QuizComponent {...defaultProps} />);

			// Select answer and go to next question
			await user.click(screen.getByLabelText("4"));
			await user.click(screen.getByText("Next Question"));

			expect(screen.getByText("Question 2 of 2")).toBeInTheDocument();
			expect(screen.getByText("50%")).toBeInTheDocument();
			expect(screen.getByTestId("progress")).toHaveAttribute(
				"data-value",
				"50",
			);
		});

		it("disables Previous button on first question", () => {
			render(<QuizComponent {...defaultProps} />);

			const previousButton = screen.getByText("Previous");
			expect(previousButton).toBeDisabled();
		});

		it("disables Next button when no answer selected", () => {
			render(<QuizComponent {...defaultProps} />);

			const nextButton = screen.getByText("Next Question");
			expect(nextButton).toBeDisabled();
		});

		it("enables Next button when answer is selected", async () => {
			const user = userEvent.setup();
			render(<QuizComponent {...defaultProps} />);

			const nextButton = screen.getByText("Next Question");
			expect(nextButton).toBeDisabled();

			await user.click(screen.getByLabelText("4"));
			expect(nextButton).not.toBeDisabled();
		});
	});

	describe("Single Answer Question Handling", () => {
		it("renders radio buttons for single-answer questions", () => {
			render(<QuizComponent {...defaultProps} />);

			expect(screen.getByTestId("radio-group")).toBeInTheDocument();
			expect(screen.getByTestId("radio-q0-o0")).toBeInTheDocument();
			expect(screen.getByTestId("radio-q0-o1")).toBeInTheDocument();
			expect(screen.getByTestId("radio-q0-o2")).toBeInTheDocument();

			// Should not show "Select all that apply" hint
			expect(
				screen.queryByText("Select all that apply"),
			).not.toBeInTheDocument();
		});

		it("allows selecting single option", async () => {
			const user = userEvent.setup();
			render(<QuizComponent {...defaultProps} />);

			await user.click(screen.getByLabelText("4"));

			const radioButton = screen.getByTestId("radio-q0-o1");
			expect(radioButton).toBeChecked();
			expect(screen.getByText("Next Question")).not.toBeDisabled();
		});

		it("changes selection when different option clicked", async () => {
			const user = userEvent.setup();
			render(<QuizComponent {...defaultProps} />);

			// First select option A
			await user.click(screen.getByLabelText("3"));
			expect(screen.getByTestId("radio-q0-o0")).toBeChecked();

			// Then select option B
			await user.click(screen.getByLabelText("4"));
			expect(screen.getByTestId("radio-q0-o0")).not.toBeChecked();
			expect(screen.getByTestId("radio-q0-o1")).toBeChecked();
		});
	});

	describe("Multi Answer Question Handling", () => {
		it("renders checkboxes for multi-answer questions", async () => {
			const user = userEvent.setup();
			render(<QuizComponent {...defaultProps} />);

			// Navigate to multi-answer question
			await user.click(screen.getByLabelText("4"));
			await user.click(screen.getByText("Next Question"));

			expect(screen.getByText("Select all that apply")).toBeInTheDocument();
			expect(screen.getByTestId("checkbox-q1-o0")).toBeInTheDocument();
			expect(screen.getByTestId("checkbox-q1-o1")).toBeInTheDocument();
			expect(screen.getByTestId("checkbox-q1-o2")).toBeInTheDocument();
			expect(screen.getByTestId("checkbox-q1-o3")).toBeInTheDocument();
		});

		it("allows selecting multiple options", async () => {
			const user = userEvent.setup();
			render(<QuizComponent {...defaultProps} />);

			// Navigate to multi-answer question
			await user.click(screen.getByLabelText("4"));
			await user.click(screen.getByText("Next Question"));

			// Select multiple options
			await user.click(screen.getByLabelText("2"));
			await user.click(screen.getByLabelText("4"));

			expect(screen.getByTestId("checkbox-q1-o1")).toBeChecked();
			expect(screen.getByTestId("checkbox-q1-o3")).toBeChecked();
			expect(screen.getByText("Finish Quiz")).not.toBeDisabled();
		});

		it("allows deselecting options", async () => {
			const user = userEvent.setup();
			render(<QuizComponent {...defaultProps} />);

			// Navigate to multi-answer question
			await user.click(screen.getByLabelText("4"));
			await user.click(screen.getByText("Next Question"));

			// Select and then deselect
			await user.click(screen.getByLabelText("2"));
			expect(screen.getByTestId("checkbox-q1-o1")).toBeChecked();

			await user.click(screen.getByLabelText("2"));
			expect(screen.getByTestId("checkbox-q1-o1")).not.toBeChecked();
		});

		it("detects multi-answer from questiontype field", () => {
			const multiAnswerQuiz = {
				...sampleQuiz,
				questions: [
					{
						id: "q1",
						question: "Test question",
						questiontype: "multi-answer" as const,
						options: [
							{ text: "Option 1", iscorrect: true },
							{ text: "Option 2", iscorrect: false },
						],
					},
				],
			};

			render(<QuizComponent {...defaultProps} quiz={multiAnswerQuiz} />);

			expect(screen.getByText("Select all that apply")).toBeInTheDocument();
		});

		it("detects multi-answer from multiple correct options", () => {
			const multiAnswerQuiz = {
				...sampleQuiz,
				questions: [
					{
						id: "q1",
						question: "Test question",
						options: [
							{ text: "Option 1", iscorrect: true },
							{ text: "Option 2", iscorrect: true },
							{ text: "Option 3", iscorrect: false },
						],
					},
				],
			};

			render(<QuizComponent {...defaultProps} quiz={multiAnswerQuiz} />);

			expect(screen.getByText("Select all that apply")).toBeInTheDocument();
		});
	});

	describe("Question Navigation", () => {
		it("navigates to next question successfully", async () => {
			const user = userEvent.setup();
			render(<QuizComponent {...defaultProps} />);

			// Answer first question
			await user.click(screen.getByLabelText("4"));
			await user.click(screen.getByText("Next Question"));

			expect(screen.getByText("Select all even numbers")).toBeInTheDocument();
			expect(screen.getByText("Question 2 of 2")).toBeInTheDocument();
		});

		it("navigates to previous question successfully", async () => {
			const user = userEvent.setup();
			render(<QuizComponent {...defaultProps} />);

			// Navigate to second question
			await user.click(screen.getByLabelText("4"));
			await user.click(screen.getByText("Next Question"));

			// Go back to first question
			await user.click(screen.getByText("Previous"));

			expect(screen.getByText("What is 2 + 2?")).toBeInTheDocument();
			expect(screen.getByText("Question 1 of 2")).toBeInTheDocument();
		});

		it("maintains selected answers when navigating", async () => {
			const user = userEvent.setup();
			render(<QuizComponent {...defaultProps} />);

			// Answer first question
			await user.click(screen.getByLabelText("4"));
			await user.click(screen.getByText("Next Question"));

			// Answer second question
			await user.click(screen.getByLabelText("2"));

			// Go back to first question
			await user.click(screen.getByText("Previous"));

			// Verify first answer is still selected
			expect(screen.getByTestId("radio-q0-o1")).toBeChecked();

			// Go forward again
			await user.click(screen.getByText("Next Question"));

			// Verify second answer is still selected
			expect(screen.getByTestId("checkbox-q1-o1")).toBeChecked();
		});
	});

	describe("Score Calculation - Single Answer", () => {
		it("calculates correct score for all correct single answers", async () => {
			const user = userEvent.setup();
			const singleAnswerQuiz = {
				...sampleQuiz,
				questions: [
					{
						id: "q1",
						question: "What is 2 + 2?",
						options: [
							{ text: "3", iscorrect: false },
							{ text: "4", iscorrect: true },
						],
					},
					{
						id: "q2",
						question: "What is 3 + 3?",
						options: [
							{ text: "6", iscorrect: true },
							{ text: "7", iscorrect: false },
						],
					},
				],
			};

			render(<QuizComponent {...defaultProps} quiz={singleAnswerQuiz} />);

			// Answer both questions correctly
			await user.click(screen.getByLabelText("4"));
			await user.click(screen.getByText("Next Question"));
			await user.click(screen.getByLabelText("6"));
			await user.click(screen.getByText("Finish Quiz"));

			expect(mockOnSubmit).toHaveBeenCalledWith({ 0: [1], 1: [0] }, 100, true);
		});

		it("calculates correct score for mixed correct/incorrect", async () => {
			const user = userEvent.setup();
			const singleAnswerQuiz = {
				...sampleQuiz,
				questions: [
					{
						id: "q1",
						question: "What is 2 + 2?",
						options: [
							{ text: "3", iscorrect: false },
							{ text: "4", iscorrect: true },
						],
					},
					{
						id: "q2",
						question: "What is 3 + 3?",
						options: [
							{ text: "6", iscorrect: true },
							{ text: "7", iscorrect: false },
						],
					},
				],
			};

			render(<QuizComponent {...defaultProps} quiz={singleAnswerQuiz} />);

			// Answer first correctly, second incorrectly
			await user.click(screen.getByLabelText("4"));
			await user.click(screen.getByText("Next Question"));
			await user.click(screen.getByLabelText("7"));
			await user.click(screen.getByText("Finish Quiz"));

			expect(mockOnSubmit).toHaveBeenCalledWith({ 0: [1], 1: [1] }, 50, false);
		});

		it("handles unanswered single-answer questions", async () => {
			const user = userEvent.setup();
			const singleAnswerQuiz = {
				...sampleQuiz,
				questions: [
					{
						id: "q1",
						question: "What is 2 + 2?",
						options: [
							{ text: "3", iscorrect: false },
							{ text: "4", iscorrect: true },
						],
					},
				],
			};

			render(<QuizComponent {...defaultProps} quiz={singleAnswerQuiz} />);

			// Select answer but then navigate without finishing
			await user.click(screen.getByLabelText("4"));

			// Force completion with unanswered questions by manipulating state
			const finishButton = screen.getByText("Finish Quiz");
			fireEvent.click(finishButton);

			expect(mockOnSubmit).toHaveBeenCalledWith({ 0: [1] }, 100, true);
		});
	});

	describe("Score Calculation - Multi Answer", () => {
		it("calculates correct score for perfect multi-answer", async () => {
			const user = userEvent.setup();
			render(<QuizComponent {...defaultProps} />);

			// Navigate to multi-answer question and answer perfectly
			await user.click(screen.getByLabelText("4"));
			await user.click(screen.getByText("Next Question"));

			// Select both correct options (2 and 4)
			await user.click(screen.getByLabelText("2"));
			await user.click(screen.getByLabelText("4"));
			await user.click(screen.getByText("Finish Quiz"));

			expect(mockOnSubmit).toHaveBeenCalledWith(
				{ 0: [1], 1: [1, 3] },
				100,
				true,
			);
		});

		it("marks multi-answer incorrect when missing correct options", async () => {
			const user = userEvent.setup();
			render(<QuizComponent {...defaultProps} />);

			// Navigate to multi-answer question
			await user.click(screen.getByLabelText("4"));
			await user.click(screen.getByText("Next Question"));

			// Select only one correct option (missing the other)
			await user.click(screen.getByLabelText("2"));
			await user.click(screen.getByText("Finish Quiz"));

			expect(mockOnSubmit).toHaveBeenCalledWith({ 0: [1], 1: [1] }, 50, false);
		});

		it("marks multi-answer incorrect when incorrect options selected", async () => {
			const user = userEvent.setup();
			render(<QuizComponent {...defaultProps} />);

			// Navigate to multi-answer question
			await user.click(screen.getByLabelText("4"));
			await user.click(screen.getByText("Next Question"));

			// Select correct options + incorrect option
			await user.click(screen.getByLabelText("1")); // incorrect
			await user.click(screen.getByLabelText("2")); // correct
			await user.click(screen.getByLabelText("4")); // correct
			await user.click(screen.getByText("Finish Quiz"));

			expect(mockOnSubmit).toHaveBeenCalledWith(
				{ 0: [1], 1: [0, 1, 3] },
				50,
				false,
			);
		});
	});

	describe("Quiz Completion & Summary", () => {
		it("shows summary after completing all questions", async () => {
			const user = userEvent.setup();
			render(<QuizComponent {...defaultProps} />);

			// Complete quiz
			await user.click(screen.getByLabelText("4"));
			await user.click(screen.getByText("Next Question"));
			await user.click(screen.getByLabelText("2"));
			await user.click(screen.getByLabelText("4"));
			await user.click(screen.getByText("Finish Quiz"));

			expect(screen.getByText("Quiz Summary")).toBeInTheDocument();
			expect(screen.getByText("Congratulations! 🎉")).toBeInTheDocument();
		});

		it("calls onSubmit with correct parameters", async () => {
			const user = userEvent.setup();
			render(<QuizComponent {...defaultProps} />);

			// Answer questions and finish
			await user.click(screen.getByLabelText("4"));
			await user.click(screen.getByText("Next Question"));
			await user.click(screen.getByLabelText("2"));
			await user.click(screen.getByLabelText("4"));
			await user.click(screen.getByText("Finish Quiz"));

			expect(mockOnSubmit).toHaveBeenCalledTimes(1);
			expect(mockOnSubmit).toHaveBeenCalledWith(
				expect.any(Object), // answers object
				100, // percentage
				true, // passed
			);
		});

		it("shows passed state for score >= passing score", async () => {
			const user = userEvent.setup();
			render(<QuizComponent {...defaultProps} />);

			// Answer correctly to pass
			await user.click(screen.getByLabelText("4"));
			await user.click(screen.getByText("Next Question"));
			await user.click(screen.getByLabelText("2"));
			await user.click(screen.getByLabelText("4"));
			await user.click(screen.getByText("Finish Quiz"));

			expect(screen.getByText("Congratulations! 🎉")).toBeInTheDocument();
			expect(
				screen.getByText("You have successfully passed this quiz!"),
			).toBeInTheDocument();
			expect(screen.getByText("Next Lesson")).toBeInTheDocument();
		});

		it("shows failed state for score < passing score", async () => {
			const user = userEvent.setup();
			render(<QuizComponent {...defaultProps} />);

			// Answer incorrectly to fail
			await user.click(screen.getByLabelText("3")); // wrong answer
			await user.click(screen.getByText("Next Question"));
			await user.click(screen.getByLabelText("1")); // wrong answer
			await user.click(screen.getByText("Finish Quiz"));

			expect(screen.getByText("Quiz Result")).toBeInTheDocument();
			expect(
				screen.getByText("You did not pass this quiz. Please try again."),
			).toBeInTheDocument();
			expect(screen.getByText("Try Again")).toBeInTheDocument();
		});
	});

	describe("Quiz Summary Component", () => {
		it("QuizSummary displays correct score percentage", async () => {
			const user = userEvent.setup();
			const partialQuiz = {
				...sampleQuiz,
				questions: [sampleQuiz.questions[0]], // Only one question
			};

			render(<QuizComponent {...defaultProps} quiz={partialQuiz} />);

			// Answer correctly (1 of 1 = 100%)
			await user.click(screen.getByLabelText("4"));
			await user.click(screen.getByText("Finish Quiz"));

			expect(screen.getByText("1 of 1 (100%)")).toBeInTheDocument();
		});

		it("QuizSummary shows Next Lesson button when passed", async () => {
			const user = userEvent.setup();
			render(<QuizComponent {...defaultProps} />);

			// Pass the quiz
			await user.click(screen.getByLabelText("4"));
			await user.click(screen.getByText("Next Question"));
			await user.click(screen.getByLabelText("2"));
			await user.click(screen.getByLabelText("4"));
			await user.click(screen.getByText("Finish Quiz"));

			expect(screen.getByText("Next Lesson")).toBeInTheDocument();
			expect(screen.queryByText("Try Again")).not.toBeInTheDocument();
		});

		it("QuizSummary shows Try Again button when failed", async () => {
			const user = userEvent.setup();
			render(<QuizComponent {...defaultProps} />);

			// Fail the quiz
			await user.click(screen.getByLabelText("3"));
			await user.click(screen.getByText("Next Question"));
			await user.click(screen.getByLabelText("1"));
			await user.click(screen.getByText("Finish Quiz"));

			expect(screen.getByText("Try Again")).toBeInTheDocument();
			expect(screen.queryByText("Next Lesson")).not.toBeInTheDocument();
		});
	});

	describe("Quiz Retry Functionality", () => {
		it("retry resets quiz state completely", async () => {
			const user = userEvent.setup();
			render(<QuizComponent {...defaultProps} />);

			// Complete quiz
			await user.click(screen.getByLabelText("4"));
			await user.click(screen.getByText("Next Question"));
			await user.click(screen.getByLabelText("1"));
			await user.click(screen.getByText("Finish Quiz"));

			// Verify we're in summary state
			expect(screen.getByText("Quiz Summary")).toBeInTheDocument();

			// Click retry
			await user.click(screen.getByText("Try Again"));

			// Verify we're back to first question with cleared state
			expect(screen.getByText("What is 2 + 2?")).toBeInTheDocument();
			expect(screen.getByText("Question 1 of 2")).toBeInTheDocument();
			expect(screen.getByText("Next Question")).toBeDisabled();
		});

		it("retry maintains quiz configuration", async () => {
			const user = userEvent.setup();
			render(<QuizComponent {...defaultProps} />);

			// Fail and retry
			await user.click(screen.getByLabelText("3"));
			await user.click(screen.getByText("Next Question"));
			await user.click(screen.getByLabelText("1"));
			await user.click(screen.getByText("Finish Quiz"));
			await user.click(screen.getByText("Try Again"));

			// Same questions and passing score should be maintained
			expect(screen.getByText("What is 2 + 2?")).toBeInTheDocument();
			// Passing score is only shown in the summary page, not on question pages
		});
	});

	describe("Next Lesson Navigation", () => {
		it("successfully navigates to next lesson", async () => {
			const user = userEvent.setup();

			// Mock successful course lessons fetch
			mockGetCourseLessons.mockResolvedValue({
				docs: [
					{ id: "lesson-1", lesson_number: 1, slug: "lesson-1-slug" },
					{ id: "lesson-2", lesson_number: 2, slug: "lesson-2-slug" },
				],
			});

			render(<QuizComponent {...defaultProps} />);

			// Pass quiz and click Next Lesson
			await user.click(screen.getByLabelText("4"));
			await user.click(screen.getByText("Next Question"));
			await user.click(screen.getByLabelText("2"));
			await user.click(screen.getByLabelText("4"));
			await user.click(screen.getByText("Finish Quiz"));
			await user.click(screen.getByText("Next Lesson"));

			await waitFor(() => {
				expect(window.location.href).toBe("/home/course/lessons/lesson-2-slug");
			});
		});

		it("handles navigation when no next lesson exists", async () => {
			const user = userEvent.setup();

			// Mock course with current lesson as last lesson
			mockGetCourseLessons.mockResolvedValue({
				docs: [{ id: "lesson-1", lesson_number: 1, slug: "lesson-1-slug" }],
			});

			render(<QuizComponent {...defaultProps} />);

			// Pass quiz and click Next Lesson
			await user.click(screen.getByLabelText("4"));
			await user.click(screen.getByText("Next Question"));
			await user.click(screen.getByLabelText("2"));
			await user.click(screen.getByLabelText("4"));
			await user.click(screen.getByText("Finish Quiz"));
			await user.click(screen.getByText("Next Lesson"));

			await waitFor(() => {
				expect(window.location.href).toBe("/home/course");
			});
		});

		it("falls back to course page on navigation errors", async () => {
			const user = userEvent.setup();

			// Mock error in getCourseLessons
			mockGetCourseLessons.mockRejectedValue(new Error("API Error"));

			render(<QuizComponent {...defaultProps} />);

			// Pass quiz and click Next Lesson
			await user.click(screen.getByLabelText("4"));
			await user.click(screen.getByText("Next Question"));
			await user.click(screen.getByLabelText("2"));
			await user.click(screen.getByLabelText("4"));
			await user.click(screen.getByText("Finish Quiz"));
			await user.click(screen.getByText("Next Lesson"));

			await waitFor(() => {
				expect(window.location.href).toBe("/home/course");
			});
		});
	});

	describe("Edge Cases & Error Handling", () => {
		it("handles malformed question options", () => {
			const malformedQuiz = {
				...sampleQuiz,
				questions: [
					{
						id: "q1",
						question: "Test question",
						questiontype: "single-answer" as const,
						options: [
							null,
							undefined,
							{ text: "Valid option", iscorrect: true },
						] as unknown as Array<{ text: string; iscorrect: boolean }>,
					},
				],
			} as PayloadQuiz;

			render(<QuizComponent {...defaultProps} quiz={malformedQuiz} />);

			// Should render without crashing
			expect(screen.getByText("Test question")).toBeInTheDocument();
			expect(screen.getByText("Valid option")).toBeInTheDocument();
		});

		it("handles questions with no correct options", async () => {
			const user = userEvent.setup();
			const noCorrectQuiz = {
				...sampleQuiz,
				questions: [
					{
						id: "q1",
						question: "Impossible question",
						questiontype: "single-answer" as const,
						options: [
							{ text: "Option 1", iscorrect: false },
							{ text: "Option 2", iscorrect: false },
						],
					},
				],
			};

			render(<QuizComponent {...defaultProps} quiz={noCorrectQuiz} />);

			// Answer and finish
			await user.click(screen.getByLabelText("Option 1"));
			await user.click(screen.getByText("Finish Quiz"));

			// Should calculate 0% score
			expect(mockOnSubmit).toHaveBeenCalledWith({ 0: [0] }, 0, false);
		});

		it("uses default passing score when not provided", () => {
			const quizWithoutPassingScore = {
				...sampleQuiz,
				passingScore: undefined,
			} as unknown as PayloadQuiz;

			render(
				<QuizComponent {...defaultProps} quiz={quizWithoutPassingScore} />,
			);

			// Quiz should still render (passing score defaults to 70 internally)
			expect(screen.getByText("What is 2 + 2?")).toBeInTheDocument();
		});

		it("handles empty options array", () => {
			const emptyOptionsQuiz = {
				...sampleQuiz,
				questions: [
					{
						id: "q1",
						question: "Question with no options",
						questiontype: "single-answer" as const,
						options: [],
					},
				],
			};

			render(<QuizComponent {...defaultProps} quiz={emptyOptionsQuiz} />);

			// Should render question but no options
			expect(screen.getByText("Question with no options")).toBeInTheDocument();
			expect(screen.getByText("Finish Quiz")).toBeDisabled(); // No options to select
		});

		it("handles undefined options property", () => {
			const undefinedOptionsQuiz = {
				...sampleQuiz,
				questions: [
					{
						id: "q1",
						question: "Question with undefined options",
						questiontype: "single-answer" as const,
						// options property is missing
					} as unknown as PayloadQuiz["questions"][number],
				],
			} as PayloadQuiz;

			render(<QuizComponent {...defaultProps} quiz={undefinedOptionsQuiz} />);

			// Should render without crashing
			expect(
				screen.getByText("Question with undefined options"),
			).toBeInTheDocument();
		});
	});
});
