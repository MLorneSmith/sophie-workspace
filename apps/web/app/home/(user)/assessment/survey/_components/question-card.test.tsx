import type { SurveyQuestion } from "@kit/cms-types";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { QuestionCard } from "./question-card";

// Mock the UI components
vi.mock("@kit/ui/button", () => ({
	Button: vi.fn(({ children, onClick, disabled, className }) => (
		<button
			type="button"
			data-testid="submit-button"
			onClick={onClick}
			disabled={disabled}
			className={className}
		>
			{children}
		</button>
	)),
}));

vi.mock("@kit/ui/label", () => ({
	Label: vi.fn(({ children, htmlFor }) => (
		<label data-testid="label" htmlFor={htmlFor}>
			{children}
		</label>
	)),
}));

vi.mock("@kit/ui/textarea", () => ({
	Textarea: vi.fn(({ id, value, onChange, placeholder, className }) => (
		<textarea
			data-testid="textarea-input"
			id={id}
			value={value}
			onChange={onChange}
			placeholder={placeholder}
			className={className}
		/>
	)),
}));

vi.mock("@kit/ui/radio-group", () => ({
	RadioGroup: vi.fn(({ children }) => (
		<div data-testid="radio-group">{children}</div>
	)),
	RadioGroupItem: vi.fn(({ value, id }) => (
		<input
			data-testid={`radio-item-${id}`}
			type="radio"
			value={value}
			id={id}
		/>
	)),
}));

vi.mock("@kit/ui/trans", () => ({
	Trans: vi.fn(({ i18nKey }) => <span data-testid="trans">{i18nKey}</span>),
}));

vi.mock("@kit/shared/logger", () => ({
	createClientLogger: () => ({
		getLogger: () => ({
			info: vi.fn(),
			error: vi.fn(),
		}),
	}),
}));

// Mock scale-question and text-field-question since they have their own tests
vi.mock("./scale-question", () => ({
	ScaleQuestion: vi.fn(({ question }) => (
		<div data-testid="scale-question">Scale Question: {question.text}</div>
	)),
}));

vi.mock("./text-field-question", () => ({
	TextFieldQuestion: vi.fn(({ question }) => (
		<div data-testid="text-field-question">
			Text Field Question: {question.text}
		</div>
	)),
}));

function createMockQuestion(
	overrides: Partial<SurveyQuestion> = {},
): SurveyQuestion {
	return {
		id: "test-question-1",
		questionSlug: "test-question",
		text: "Test Question Text",
		type: "multiple_choice",
		description: "Test description",
		required: true,
		options: [
			{ id: "opt-1", option: "Option 1" },
			{ id: "opt-2", option: "Option 2" },
		],
		category: "General",
		questionspin: "Positive",
		position: 1,
		updatedAt: "2024-01-01T00:00:00.000Z",
		createdAt: "2024-01-01T00:00:00.000Z",
		...overrides,
	};
}

describe("QuestionCard", () => {
	describe("Question Type Routing", () => {
		it("should render TextFieldQuestion for text_field type", () => {
			// Arrange
			const question = createMockQuestion({ type: "text_field" });
			const onAnswer = vi.fn();

			// Act
			render(
				<QuestionCard
					question={question}
					onAnswer={onAnswer}
					isLoading={false}
				/>,
			);

			// Assert
			expect(screen.getByTestId("text-field-question")).toBeInTheDocument();
			expect(
				screen.getByText("Text Field Question: Test Question Text"),
			).toBeInTheDocument();
		});

		it("should render TextFieldQuestion for textarea type", () => {
			// Arrange
			const question = createMockQuestion({ type: "textarea" });
			const onAnswer = vi.fn();

			// Act
			render(
				<QuestionCard
					question={question}
					onAnswer={onAnswer}
					isLoading={false}
				/>,
			);

			// Assert
			expect(screen.getByTestId("text-field-question")).toBeInTheDocument();
			expect(
				screen.getByText("Text Field Question: Test Question Text"),
			).toBeInTheDocument();
		});

		it("should render ScaleQuestion for scale type", () => {
			// Arrange
			const question = createMockQuestion({ type: "scale" });
			const onAnswer = vi.fn();

			// Act
			render(
				<QuestionCard
					question={question}
					onAnswer={onAnswer}
					isLoading={false}
				/>,
			);

			// Assert
			expect(screen.getByTestId("scale-question")).toBeInTheDocument();
			expect(
				screen.getByText("Scale Question: Test Question Text"),
			).toBeInTheDocument();
		});

		it("should render multiple choice UI for multiple_choice type", () => {
			// Arrange
			const question = createMockQuestion({ type: "multiple_choice" });
			const onAnswer = vi.fn();

			// Act
			render(
				<QuestionCard
					question={question}
					onAnswer={onAnswer}
					isLoading={false}
				/>,
			);

			// Assert
			expect(screen.getByTestId("radio-group")).toBeInTheDocument();
			expect(screen.getByText("Option 1")).toBeInTheDocument();
			expect(screen.getByText("Option 2")).toBeInTheDocument();
		});
	});

	describe("Multiple Choice Question Rendering", () => {
		it("should display question text and description", () => {
			// Arrange
			const question = createMockQuestion({
				type: "multiple_choice",
				text: "What is your favorite color?",
				description: "Please select one option",
			});
			const onAnswer = vi.fn();

			// Act
			render(
				<QuestionCard
					question={question}
					onAnswer={onAnswer}
					isLoading={false}
				/>,
			);

			// Assert
			expect(
				screen.getByText("What is your favorite color?"),
			).toBeInTheDocument();
			expect(screen.getByText("Please select one option")).toBeInTheDocument();
		});

		it("should not render description if not provided", () => {
			// Arrange
			const question = createMockQuestion({
				type: "multiple_choice",
				description: null,
			});
			const onAnswer = vi.fn();

			// Act
			render(
				<QuestionCard
					question={question}
					onAnswer={onAnswer}
					isLoading={false}
				/>,
			);

			// Assert
			expect(screen.queryByText("Test description")).not.toBeInTheDocument();
		});

		it("should render all options", () => {
			// Arrange
			const question = createMockQuestion({
				type: "multiple_choice",
				options: [
					{ id: "a", option: "Alpha" },
					{ id: "b", option: "Beta" },
					{ id: "c", option: "Gamma" },
				],
			});
			const onAnswer = vi.fn();

			// Act
			render(
				<QuestionCard
					question={question}
					onAnswer={onAnswer}
					isLoading={false}
				/>,
			);

			// Assert
			expect(screen.getByText("Alpha")).toBeInTheDocument();
			expect(screen.getByText("Beta")).toBeInTheDocument();
			expect(screen.getByText("Gamma")).toBeInTheDocument();
		});
	});

	describe("Button States", () => {
		it("should disable submit button when no option is selected", () => {
			// Arrange
			const question = createMockQuestion({ type: "multiple_choice" });
			const onAnswer = vi.fn();

			// Act
			render(
				<QuestionCard
					question={question}
					onAnswer={onAnswer}
					isLoading={false}
				/>,
			);

			// Assert
			const button = screen.getByTestId("submit-button");
			expect(button).toBeDisabled();
		});

		it("should disable submit button when isLoading is true", () => {
			// Arrange
			const question = createMockQuestion({ type: "multiple_choice" });
			const onAnswer = vi.fn();

			// Act
			render(
				<QuestionCard
					question={question}
					onAnswer={onAnswer}
					isLoading={true}
				/>,
			);

			// Assert
			const button = screen.getByTestId("submit-button");
			expect(button).toBeDisabled();
		});

		it("should show saving text when isLoading is true", () => {
			// Arrange
			const question = createMockQuestion({ type: "multiple_choice" });
			const onAnswer = vi.fn();

			// Act
			render(
				<QuestionCard
					question={question}
					onAnswer={onAnswer}
					isLoading={true}
				/>,
			);

			// Assert
			expect(screen.getByText("assessment:saving")).toBeInTheDocument();
		});

		it("should show next question text when not loading", () => {
			// Arrange
			const question = createMockQuestion({ type: "multiple_choice" });
			const onAnswer = vi.fn();

			// Act
			render(
				<QuestionCard
					question={question}
					onAnswer={onAnswer}
					isLoading={false}
				/>,
			);

			// Assert
			expect(screen.getByText("assessment:nextQuestion")).toBeInTheDocument();
		});
	});

	describe("Option Selection", () => {
		it("should enable submit button after selecting an option", async () => {
			// Arrange
			const user = userEvent.setup();
			const question = createMockQuestion({ type: "multiple_choice" });
			const onAnswer = vi.fn();

			// Act
			render(
				<QuestionCard
					question={question}
					onAnswer={onAnswer}
					isLoading={false}
				/>,
			);

			// Click on an option button
			const optionButton = screen.getByRole("button", { name: /Option 1/i });
			await user.click(optionButton);

			// Assert
			await waitFor(() => {
				const submitButton = screen.getByTestId("submit-button");
				expect(submitButton).not.toBeDisabled();
			});
		});
	});
});
