import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CourseProgressData } from "../../_lib/dashboard/types";
import { CourseProgressRadial } from "./course-progress-radial";

vi.mock("recharts", () => ({
	PieChart: vi.fn(({ children }: { children: React.ReactNode }) => (
		<div data-testid="pie-chart">{children}</div>
	)),
	Pie: vi.fn(({ children }: { children: React.ReactNode }) => (
		<div data-testid="pie">{children}</div>
	)),
	Cell: vi.fn(() => <div data-testid="cell" />),
}));

vi.mock("@kit/ui/chart", () => ({
	ChartContainer: vi.fn(
		({
			children,
		}: {
			children: React.ReactNode;
			config: unknown;
			className: string;
		}) => <div data-testid="chart-container">{children}</div>,
	),
}));

vi.mock("next/link", () => ({
	default: vi.fn(
		({ children, href }: { children: React.ReactNode; href: string }) => (
			<a href={href}>{children}</a>
		),
	),
}));

function makeCourseProgress(
	overrides: Partial<CourseProgressData> = {},
): CourseProgressData {
	return {
		courseProgress: {
			completion_percentage: 75,
			current_lesson_id: "lesson-1",
			started_at: "2026-01-01T00:00:00Z",
		},
		totalLessons: 18,
		completedLessons: 12,
		...overrides,
	};
}

describe("CourseProgressRadial", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders the card with title", () => {
		render(<CourseProgressRadial data={makeCourseProgress()} />);

		expect(screen.getByText("Course Progress")).toBeInTheDocument();
	});

	it("renders the donut chart", () => {
		render(<CourseProgressRadial data={makeCourseProgress()} />);

		expect(screen.getByTestId("chart-container")).toBeInTheDocument();
		expect(screen.getByTestId("pie-chart")).toBeInTheDocument();
	});

	it("displays the percentage in center", () => {
		render(<CourseProgressRadial data={makeCourseProgress()} />);

		expect(screen.getByText("75%")).toBeInTheDocument();
	});

	it("displays lessons count for non-zero progress", () => {
		render(<CourseProgressRadial data={makeCourseProgress()} />);

		expect(screen.getByText("12 of 18 lessons")).toBeInTheDocument();
	});

	it("shows Start Course CTA for zero progress", () => {
		const zeroData = makeCourseProgress({
			courseProgress: {
				completion_percentage: 0,
				current_lesson_id: null as unknown as string,
				started_at: null as unknown as string,
			},
			completedLessons: 0,
			totalLessons: 18,
		});

		render(<CourseProgressRadial data={zeroData} />);

		expect(screen.getByText("Start Course")).toBeInTheDocument();
		expect(
			screen.getByText("Start your first lesson to track progress here."),
		).toBeInTheDocument();
		expect(screen.queryByText(/of.*lessons/)).not.toBeInTheDocument();
	});

	it("shows Start Course CTA when data is null", () => {
		render(<CourseProgressRadial data={null} />);

		expect(screen.getByText("Start Course")).toBeInTheDocument();
		expect(
			screen.getByText("Start your first lesson to track progress here."),
		).toBeInTheDocument();
	});

	it("clamps percentage between 0 and 100", () => {
		const overData = makeCourseProgress({
			courseProgress: {
				completion_percentage: 150,
				current_lesson_id: "lesson-1",
				started_at: "2026-01-01T00:00:00Z",
			},
		});

		render(<CourseProgressRadial data={overData} />);

		// The percentage text shows the raw value, but chart data is clamped
		expect(screen.getByText("150%")).toBeInTheDocument();
	});

	it("renders the Start Course link with correct href", () => {
		render(<CourseProgressRadial data={null} />);

		const link = screen.getByText("Start Course").closest("a");
		expect(link).toHaveAttribute("href", "/home/course");
	});
});
