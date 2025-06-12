import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { CourseProgressBar } from "./CourseProgressBar";

// Mock the Progress component from @kit/ui/progress
vi.mock("@kit/ui/progress", () => ({
	Progress: vi.fn(({ value, className, ...props }) => (
		<div
			data-testid="progress-component"
			data-value={value}
			className={className}
			{...props}
		>
			Progress: {value}%
		</div>
	)),
}));

describe("CourseProgressBar", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Core Functionality", () => {
		it("should render progress bar with correct calculated percentage", () => {
			// Arrange
			const props = { percentage: 999, totalLessons: 10, completedLessons: 6 };

			// Act
			render(<CourseProgressBar {...props} />);

			// Assert
			const progressComponent = screen.getByTestId("progress-component");
			expect(progressComponent).toHaveAttribute("data-value", "60");
			expect(screen.getByText("6 of 10 lessons completed")).toBeInTheDocument();
		});

		it("should display correct lesson completion text", () => {
			// Arrange
			const props = { percentage: 50, totalLessons: 8, completedLessons: 4 };

			// Act
			render(<CourseProgressBar {...props} />);

			// Assert
			expect(screen.getByText("4 of 8 lessons completed")).toBeInTheDocument();
		});

		it("should calculate percentage correctly ignoring the percentage prop", () => {
			// Arrange - percentage prop should be ignored
			const props = { percentage: 999, totalLessons: 5, completedLessons: 3 };

			// Act
			render(<CourseProgressBar {...props} />);

			// Assert
			const progressComponent = screen.getByTestId("progress-component");
			expect(progressComponent).toHaveAttribute("data-value", "60"); // 3/5 * 100 = 60
		});

		it("should round percentage to nearest integer", () => {
			// Arrange - 1/3 = 33.333... should round to 33
			const props = { percentage: 0, totalLessons: 3, completedLessons: 1 };

			// Act
			render(<CourseProgressBar {...props} />);

			// Assert
			const progressComponent = screen.getByTestId("progress-component");
			expect(progressComponent).toHaveAttribute("data-value", "33");
		});

		it("should round percentage correctly for 2/3 (66.666...)", () => {
			// Arrange - 2/3 = 66.666... should round to 67
			const props = { percentage: 0, totalLessons: 3, completedLessons: 2 };

			// Act
			render(<CourseProgressBar {...props} />);

			// Assert
			const progressComponent = screen.getByTestId("progress-component");
			expect(progressComponent).toHaveAttribute("data-value", "67");
		});
	});

	describe("Edge Cases", () => {
		it("should handle zero total lessons without dividing by zero", () => {
			// Arrange
			const props = { percentage: 50, totalLessons: 0, completedLessons: 0 };

			// Act
			render(<CourseProgressBar {...props} />);

			// Assert
			const progressComponent = screen.getByTestId("progress-component");
			expect(progressComponent).toHaveAttribute("data-value", "0");
			expect(screen.getByText("0 of 0 lessons completed")).toBeInTheDocument();
		});

		it("should handle zero completed lessons", () => {
			// Arrange
			const props = { percentage: 0, totalLessons: 5, completedLessons: 0 };

			// Act
			render(<CourseProgressBar {...props} />);

			// Assert
			const progressComponent = screen.getByTestId("progress-component");
			expect(progressComponent).toHaveAttribute("data-value", "0");
			expect(screen.getByText("0 of 5 lessons completed")).toBeInTheDocument();
		});

		it("should handle completed lessons equal to total (100% completion)", () => {
			// Arrange
			const props = { percentage: 100, totalLessons: 4, completedLessons: 4 };

			// Act
			render(<CourseProgressBar {...props} />);

			// Assert
			const progressComponent = screen.getByTestId("progress-component");
			expect(progressComponent).toHaveAttribute("data-value", "100");
			expect(screen.getByText("4 of 4 lessons completed")).toBeInTheDocument();
		});

		it("should handle completed lessons greater than total (data inconsistency)", () => {
			// Arrange - Edge case where data might be inconsistent
			const props = { percentage: 100, totalLessons: 3, completedLessons: 5 };

			// Act
			render(<CourseProgressBar {...props} />);

			// Assert - Should calculate 5/3 * 100 = 167 (rounded)
			const progressComponent = screen.getByTestId("progress-component");
			expect(progressComponent).toHaveAttribute("data-value", "167");
			expect(screen.getByText("5 of 3 lessons completed")).toBeInTheDocument();
		});
	});

	describe("Error Scenarios", () => {
		it("should handle negative total lessons gracefully", () => {
			// Arrange
			const props = { percentage: 50, totalLessons: -2, completedLessons: 1 };

			// Act
			render(<CourseProgressBar {...props} />);

			// Assert - Component uses guard clause: totalLessons > 0 ? ... : 0
			// So negative totalLessons results in 0%, which is defensive programming
			const progressComponent = screen.getByTestId("progress-component");
			expect(progressComponent).toHaveAttribute("data-value", "0");
			expect(screen.getByText("1 of -2 lessons completed")).toBeInTheDocument();
		});

		it("should handle negative completed lessons gracefully", () => {
			// Arrange
			const props = { percentage: 50, totalLessons: 5, completedLessons: -1 };

			// Act
			render(<CourseProgressBar {...props} />);

			// Assert - Should handle gracefully
			const progressComponent = screen.getByTestId("progress-component");
			expect(progressComponent).toHaveAttribute("data-value", "-20"); // -1/5 * 100 = -20
			expect(screen.getByText("-1 of 5 lessons completed")).toBeInTheDocument();
		});
	});

	describe("Rendering Tests", () => {
		it('should render "Course Progress" label', () => {
			// Arrange
			const props = { percentage: 50, totalLessons: 4, completedLessons: 2 };

			// Act
			render(<CourseProgressBar {...props} />);

			// Assert
			expect(screen.getByText("Course Progress")).toBeInTheDocument();
		});

		it("should render progress component with correct value and className", () => {
			// Arrange
			const props = { percentage: 0, totalLessons: 10, completedLessons: 7 };

			// Act
			render(<CourseProgressBar {...props} />);

			// Assert
			const progressComponent = screen.getByTestId("progress-component");
			expect(progressComponent).toHaveAttribute("data-value", "70"); // 7/10 * 100 = 70
			expect(progressComponent).toHaveClass("h-2"); // Checking the className prop
		});

		it("should render the complete component structure", () => {
			// Arrange
			const props = { percentage: 25, totalLessons: 8, completedLessons: 2 };

			// Act
			const { container } = render(<CourseProgressBar {...props} />);

			// Assert - Check overall structure
			expect(screen.getByText("Course Progress")).toBeInTheDocument();
			expect(screen.getByText("2 of 8 lessons completed")).toBeInTheDocument();
			expect(screen.getByTestId("progress-component")).toBeInTheDocument();

			// Check that the component has the expected structure
			const mainDiv = container.firstChild;
			expect(mainDiv).toHaveClass("space-y-2");
		});
	});

	describe("Business Logic Verification", () => {
		it("should always use calculated percentage, never the passed percentage prop", () => {
			// Arrange - Test with various "incorrect" percentage props
			const testCases = [
				{ percentage: 0, totalLessons: 4, completedLessons: 2, expected: "50" },
				{
					percentage: 100,
					totalLessons: 8,
					completedLessons: 3,
					expected: "38",
				},
				{
					percentage: 999,
					totalLessons: 2,
					completedLessons: 1,
					expected: "50",
				},
				{
					percentage: -50,
					totalLessons: 10,
					completedLessons: 9,
					expected: "90",
				},
			];

			testCases.forEach(
				({ percentage, totalLessons, completedLessons, expected }, index) => {
					// Act
					const { unmount } = render(
						<CourseProgressBar
							percentage={percentage}
							totalLessons={totalLessons}
							completedLessons={completedLessons}
						/>,
					);

					// Assert
					const progressComponent = screen.getByTestId("progress-component");
					expect(progressComponent).toHaveAttribute("data-value", expected);

					// Cleanup for next iteration
					unmount();
				},
			);
		});

		it("should correctly calculate percentages for various fraction scenarios", () => {
			// Arrange - Test various fraction scenarios
			const testCases = [
				{ totalLessons: 1, completedLessons: 1, expected: "100" }, // 1/1 = 100%
				{ totalLessons: 7, completedLessons: 1, expected: "14" }, // 1/7 = 14.28... rounds to 14
				{ totalLessons: 6, completedLessons: 1, expected: "17" }, // 1/6 = 16.66... rounds to 17
				{ totalLessons: 9, completedLessons: 4, expected: "44" }, // 4/9 = 44.44... rounds to 44
				{ totalLessons: 11, completedLessons: 7, expected: "64" }, // 7/11 = 63.63... rounds to 64
			];

			testCases.forEach(
				({ totalLessons, completedLessons, expected }, index) => {
					// Act
					const { unmount } = render(
						<CourseProgressBar
							percentage={0}
							totalLessons={totalLessons}
							completedLessons={completedLessons}
						/>,
					);

					// Assert
					const progressComponent = screen.getByTestId("progress-component");
					expect(progressComponent).toHaveAttribute("data-value", expected);

					// Cleanup for next iteration
					unmount();
				},
			);
		});
	});
});
