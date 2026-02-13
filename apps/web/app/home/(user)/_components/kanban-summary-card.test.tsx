import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { KanbanSummaryData } from "../_lib/dashboard/types";
import { KanbanSummaryCard } from "./kanban-summary-card";

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

vi.mock("lucide-react", () => ({
	ClipboardList: vi.fn(() => <span data-testid="clipboard-icon" />),
}));

const SAMPLE_SUMMARY: KanbanSummaryData = {
	doingCount: 3,
	nextTask: {
		id: "task-1",
		title: "Prepare presentation slides",
		priority: "high",
	},
	totalTasks: 10,
	statusCounts: { do: 4, doing: 3, done: 3 },
};

const EMPTY_SUMMARY: KanbanSummaryData = {
	doingCount: 0,
	nextTask: null,
	totalTasks: 5,
	statusCounts: { do: 3, doing: 0, done: 2 },
};

describe("KanbanSummaryCard", () => {
	describe("populated state", () => {
		it("renders Current Tasks title", () => {
			render(<KanbanSummaryCard kanbanSummary={SAMPLE_SUMMARY} />);

			expect(screen.getByText("Current Tasks")).toBeInTheDocument();
		});

		it("displays doing count badge", () => {
			render(<KanbanSummaryCard kanbanSummary={SAMPLE_SUMMARY} />);

			expect(screen.getByTestId("doing-count-badge")).toHaveTextContent(
				"3 in progress",
			);
		});

		it("shows next task preview with title", () => {
			render(<KanbanSummaryCard kanbanSummary={SAMPLE_SUMMARY} />);

			expect(
				screen.getByText("Prepare presentation slides"),
			).toBeInTheDocument();
		});

		it("shows priority badge for next task", () => {
			render(<KanbanSummaryCard kanbanSummary={SAMPLE_SUMMARY} />);

			const badge = screen.getByTestId("priority-badge");
			expect(badge).toHaveTextContent("high");
		});

		it("shows status counts", () => {
			render(<KanbanSummaryCard kanbanSummary={SAMPLE_SUMMARY} />);

			expect(screen.getByText("4 to do")).toBeInTheDocument();
			expect(screen.getByText("3 doing")).toBeInTheDocument();
			expect(screen.getByText("3 done")).toBeInTheDocument();
		});

		it("renders View Kanban link", () => {
			render(<KanbanSummaryCard kanbanSummary={SAMPLE_SUMMARY} />);

			const link = screen.getByTestId("view-kanban-link");
			expect(link).toHaveAttribute("href", "/home/kanban");
		});
	});

	describe("empty state", () => {
		it("displays no tasks in progress message when doingCount is 0", () => {
			render(<KanbanSummaryCard kanbanSummary={EMPTY_SUMMARY} />);

			expect(screen.getByText("No tasks in progress")).toBeInTheDocument();
		});

		it("displays helpful instruction text", () => {
			render(<KanbanSummaryCard kanbanSummary={EMPTY_SUMMARY} />);

			expect(
				screen.getByText(/Move a task to "Doing" to see it here/),
			).toBeInTheDocument();
		});

		it("renders View Kanban CTA link in empty state", () => {
			render(<KanbanSummaryCard kanbanSummary={EMPTY_SUMMARY} />);

			const link = screen.getByRole("link", { name: "View Kanban" });
			expect(link).toHaveAttribute("href", "/home/kanban");
		});

		it("displays empty state when kanbanSummary is null", () => {
			render(<KanbanSummaryCard kanbanSummary={null} />);

			expect(screen.getByText("No tasks in progress")).toBeInTheDocument();
		});

		it("does not show doing count badge when zero", () => {
			render(<KanbanSummaryCard kanbanSummary={EMPTY_SUMMARY} />);

			expect(screen.queryByTestId("doing-count-badge")).not.toBeInTheDocument();
		});
	});

	describe("loading skeleton state", () => {
		it("renders skeleton when kanbanSummary is undefined", () => {
			render(<KanbanSummaryCard />);

			expect(screen.getByTestId("kanban-summary-skeleton")).toBeInTheDocument();
		});

		it("does not render card content when loading", () => {
			render(<KanbanSummaryCard />);

			expect(screen.queryByText("Current Tasks")).not.toBeInTheDocument();
		});
	});

	describe("priority variants", () => {
		it("renders medium priority badge", () => {
			const summary: KanbanSummaryData = {
				...SAMPLE_SUMMARY,
				nextTask: {
					id: "t-2",
					title: "Review docs",
					priority: "medium" as const,
				},
			};
			render(<KanbanSummaryCard kanbanSummary={summary} />);

			const badge = screen.getByTestId("priority-badge");
			expect(badge).toHaveTextContent("medium");
		});

		it("renders low priority badge", () => {
			const summary: KanbanSummaryData = {
				...SAMPLE_SUMMARY,
				nextTask: { id: "t-3", title: "Clean up", priority: "low" as const },
			};
			render(<KanbanSummaryCard kanbanSummary={summary} />);

			const badge = screen.getByTestId("priority-badge");
			expect(badge).toHaveTextContent("low");
		});
	});
});
