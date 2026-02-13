import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SkillsSpiderDiagram } from "./skills-spider-diagram";

vi.mock("next/link", () => ({
	default: vi.fn(
		({
			href,
			children,
			...props
		}: {
			href: string;
			children: React.ReactNode;
		}) => (
			<a href={href} {...props}>
				{children}
			</a>
		),
	),
}));

vi.mock("@kit/ui/chart", () => ({
	ChartContainer: vi.fn(({ children }) => (
		<div data-testid="chart-container">{children}</div>
	)),
	ChartTooltip: vi.fn(() => null),
	ChartTooltipContent: vi.fn(() => null),
}));

vi.mock("recharts", () => ({
	RadarChart: vi.fn(({ data, children }) => (
		<div data-testid="radar-chart" data-categories={JSON.stringify(data)}>
			{children}
		</div>
	)),
	PolarAngleAxis: vi.fn(({ dataKey }) => (
		<div data-testid="polar-angle-axis" data-key={dataKey} />
	)),
	PolarGrid: vi.fn(() => <div data-testid="polar-grid" />),
	Radar: vi.fn(({ dataKey }) => <div data-testid="radar" data-key={dataKey} />),
}));

const SAMPLE_SCORES = {
	structure: 75,
	story: 60,
	substance: 85,
	style: 70,
	"self-confidence": 55,
};

describe("SkillsSpiderDiagram", () => {
	describe("with assessment data", () => {
		it("renders the Skills Assessment title", () => {
			render(<SkillsSpiderDiagram categoryScores={SAMPLE_SCORES} />);

			expect(screen.getByText("Skills Assessment")).toBeInTheDocument();
		});

		it("renders RadarChart with transformed category data", () => {
			render(<SkillsSpiderDiagram categoryScores={SAMPLE_SCORES} />);

			const chart = screen.getByTestId("radar-chart");
			const data = JSON.parse(chart.dataset.categories ?? "[]");

			expect(data).toHaveLength(5);
			expect(data).toContainEqual({ category: "structure", score: 75 });
			expect(data).toContainEqual({ category: "story", score: 60 });
			expect(data).toContainEqual({ category: "substance", score: 85 });
			expect(data).toContainEqual({ category: "style", score: 70 });
			expect(data).toContainEqual({
				category: "self-confidence",
				score: 55,
			});
		});

		it("renders chart components", () => {
			render(<SkillsSpiderDiagram categoryScores={SAMPLE_SCORES} />);

			expect(screen.getByTestId("chart-container")).toBeInTheDocument();
			expect(screen.getByTestId("radar-chart")).toBeInTheDocument();
			expect(screen.getByTestId("polar-angle-axis")).toBeInTheDocument();
			expect(screen.getByTestId("polar-grid")).toBeInTheDocument();
			expect(screen.getByTestId("radar")).toBeInTheDocument();
		});

		it("uses category as PolarAngleAxis dataKey", () => {
			render(<SkillsSpiderDiagram categoryScores={SAMPLE_SCORES} />);

			const axis = screen.getByTestId("polar-angle-axis");
			expect(axis.dataset.key).toBe("category");
		});
	});

	describe("empty state", () => {
		it("displays empty state when categoryScores is null", () => {
			render(<SkillsSpiderDiagram categoryScores={null} />);

			expect(
				screen.getByText(
					"Discover your strengths across 5 presentation skill categories.",
				),
			).toBeInTheDocument();
		});

		it("displays empty state when categoryScores is undefined", () => {
			render(<SkillsSpiderDiagram />);

			expect(
				screen.getByText(
					"Discover your strengths across 5 presentation skill categories.",
				),
			).toBeInTheDocument();
		});

		it("displays empty state when categoryScores is empty object", () => {
			render(<SkillsSpiderDiagram categoryScores={{}} />);

			expect(
				screen.getByText(
					"Discover your strengths across 5 presentation skill categories.",
				),
			).toBeInTheDocument();
		});

		it("renders Take Assessment CTA linking to survey page", () => {
			render(<SkillsSpiderDiagram categoryScores={null} />);

			const link = screen.getByRole("link", { name: "Take Assessment" });
			expect(link).toBeInTheDocument();
			expect(link).toHaveAttribute("href", "/home/assessment/survey");
		});

		it("does not render chart when empty", () => {
			render(<SkillsSpiderDiagram categoryScores={null} />);

			expect(screen.queryByTestId("radar-chart")).not.toBeInTheDocument();
		});
	});

	describe("data transformation", () => {
		it("preserves category names exactly as stored", () => {
			const scores = { "Self-Confidence": 90, Structure: 80 };
			render(<SkillsSpiderDiagram categoryScores={scores} />);

			const chart = screen.getByTestId("radar-chart");
			const data = JSON.parse(chart.dataset.categories ?? "[]");

			expect(data).toContainEqual({
				category: "Self-Confidence",
				score: 90,
			});
			expect(data).toContainEqual({ category: "Structure", score: 80 });
		});

		it("handles single category", () => {
			render(<SkillsSpiderDiagram categoryScores={{ structure: 50 }} />);

			const chart = screen.getByTestId("radar-chart");
			const data = JSON.parse(chart.dataset.categories ?? "[]");

			expect(data).toHaveLength(1);
			expect(data[0]).toEqual({ category: "structure", score: 50 });
		});
	});
});
