/**
 * Unit tests for Column component
 * Verifies correct SortableContext items format (ID array, not objects)
 */

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Task } from "../_lib/schema/task.schema";
import { Column } from "./column";

// Mock dnd-kit core
const mockSetNodeRef = vi.fn();
vi.mock("@dnd-kit/core", () => ({
	useDroppable: vi.fn(() => ({
		setNodeRef: mockSetNodeRef,
		isOver: false,
	})),
}));

// Track what items are passed to SortableContext
let capturedSortableContextItems: unknown[] = [];

vi.mock("@dnd-kit/sortable", () => ({
	SortableContext: ({
		items,
		children,
	}: {
		items: unknown[];
		children: React.ReactNode;
	}) => {
		capturedSortableContextItems = items;
		return <div data-testid="sortable-context">{children}</div>;
	},
	rectSortingStrategy: vi.fn(),
}));

// Mock TaskCard to avoid complex dependencies
vi.mock("./task-card", () => ({
	TaskCard: ({ task }: { task: Task }) => (
		<div data-testid={`task-card-${task.id}`}>{task.title}</div>
	),
}));

// Mock translations
vi.mock("@kit/ui/trans", () => ({
	Trans: ({ i18nKey }: { i18nKey: string }) => <span>{i18nKey}</span>,
}));

// Helper to create mock tasks with proper typing
const createMockTask = (overrides: Partial<Task> & { id: string }): Task => ({
	title: "Default Task",
	status: "do",
	priority: "medium",
	image_url: null,
	created_at: "2024-01-01T00:00:00Z",
	updated_at: "2024-01-01T00:00:00Z",
	account_id: "user-123",
	subtasks: [],
	...overrides,
});

const mockTasks: Task[] = [
	createMockTask({
		id: "task-1",
		title: "Task 1",
		description: "Description 1",
		priority: "medium",
	}),
	createMockTask({
		id: "task-2",
		title: "Task 2",
		priority: "high",
		created_at: "2024-01-02T00:00:00Z",
		updated_at: "2024-01-02T00:00:00Z",
	}),
	createMockTask({
		id: "task-3",
		title: "Task 3",
		description: "Description 3",
		priority: "low",
		created_at: "2024-01-03T00:00:00Z",
		updated_at: "2024-01-03T00:00:00Z",
	}),
];

describe("Column Component", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		capturedSortableContextItems = [];
	});

	describe("SortableContext items format", () => {
		it("should pass ID array to SortableContext, not task objects", () => {
			render(
				// biome-ignore lint/correctness/useUniqueElementIds: id prop is a domain identifier for column status, not HTML id attribute
				<Column
					id="do"
					title="To Do"
					tasks={mockTasks}
					updatingTaskId={null}
				/>,
			);

			// Verify SortableContext received an array of string IDs
			expect(capturedSortableContextItems).toEqual([
				"task-1",
				"task-2",
				"task-3",
			]);

			// Verify it's not receiving full task objects
			expect(capturedSortableContextItems).not.toEqual(mockTasks);

			// Verify each item is a string (not an object)
			for (const item of capturedSortableContextItems) {
				expect(typeof item).toBe("string");
			}
		});

		it("should handle empty tasks array", () => {
			render(
				// biome-ignore lint/correctness/useUniqueElementIds: id prop is a domain identifier for column status, not HTML id attribute
				<Column id="do" title="To Do" tasks={[]} updatingTaskId={null} />,
			);

			// When tasks is empty, SortableContext should not be rendered
			// Instead, the drop hint message should be shown
			expect(screen.getByText("kanban:task.dropHint")).toBeInTheDocument();
			expect(screen.queryByTestId("sortable-context")).not.toBeInTheDocument();
		});

		it("should pass IDs in the same order as tasks", () => {
			const orderedTasks: Task[] = [
				createMockTask({ id: "first-task", title: "First Task" }),
				createMockTask({ id: "second-task", title: "Second Task" }),
				createMockTask({ id: "third-task", title: "Third Task" }),
			];

			render(
				// biome-ignore lint/correctness/useUniqueElementIds: id prop is a domain identifier for column status, not HTML id attribute
				<Column
					id="do"
					title="To Do"
					tasks={orderedTasks}
					updatingTaskId={null}
				/>,
			);

			// Verify order is preserved
			expect(capturedSortableContextItems).toEqual([
				"first-task",
				"second-task",
				"third-task",
			]);
		});
	});

	describe("Rendering", () => {
		it("should render task count badge", () => {
			render(
				// biome-ignore lint/correctness/useUniqueElementIds: id prop is a domain identifier for column status, not HTML id attribute
				<Column
					id="do"
					title="To Do"
					tasks={mockTasks}
					updatingTaskId={null}
				/>,
			);

			expect(screen.getByText("3")).toBeInTheDocument();
		});

		it("should render all task cards", () => {
			render(
				// biome-ignore lint/correctness/useUniqueElementIds: id prop is a domain identifier for column status, not HTML id attribute
				<Column
					id="do"
					title="To Do"
					tasks={mockTasks}
					updatingTaskId={null}
				/>,
			);

			expect(screen.getByTestId("task-card-task-1")).toBeInTheDocument();
			expect(screen.getByTestId("task-card-task-2")).toBeInTheDocument();
			expect(screen.getByTestId("task-card-task-3")).toBeInTheDocument();
		});

		it("should show loading overlay for updating task", () => {
			const { container } = render(
				// biome-ignore lint/correctness/useUniqueElementIds: id prop is a domain identifier for column status, not HTML id attribute
				<Column
					id="do"
					title="To Do"
					tasks={mockTasks}
					updatingTaskId="task-2"
				/>,
			);

			// Check for the loading spinner (Loader2Icon with animate-spin class)
			const spinner = container.querySelector(".animate-spin");
			expect(spinner).toBeInTheDocument();
		});
	});
});
