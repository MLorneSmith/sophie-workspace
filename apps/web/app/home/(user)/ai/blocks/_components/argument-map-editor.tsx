"use client";

import { Button } from "@kit/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@kit/ui/card";
import { cn } from "@kit/ui/utils";
import { GitBranch, Plus, RefreshCw } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import type {
	ArgumentMapNode,
	ArgumentMapNodeType,
} from "../../_lib/schemas/presentation-artifacts";
import { ArgumentMapNode as ArgumentMapNodeComponent } from "./argument-map-node";

export interface ArgumentMapEditorProps {
	value: ArgumentMapNode | null;
	onChange: (next: ArgumentMapNode) => void;
	className?: string;
}

function makeNode(type: ArgumentMapNodeType, text: string): ArgumentMapNode {
	return {
		id: crypto.randomUUID(),
		type,
		text,
		children: [],
	};
}

function defaultTree(): ArgumentMapNode {
	return makeNode("claim", "");
}

function updateNode(
	root: ArgumentMapNode,
	nodeId: string,
	updater: (node: ArgumentMapNode) => ArgumentMapNode,
): ArgumentMapNode {
	if (root.id === nodeId) return updater(root);

	if (root.children.length === 0) return root;

	let changed = false;
	const nextChildren = root.children.map((child) => {
		const next = updateNode(child, nodeId, updater);
		if (next !== child) changed = true;
		return next;
	});

	return changed ? { ...root, children: nextChildren } : root;
}

function deleteNode(root: ArgumentMapNode, nodeId: string): ArgumentMapNode {
	if (root.children.length === 0) return root;

	let changed = false;
	const nextChildren: ArgumentMapNode[] = [];

	for (const child of root.children) {
		if (child.id === nodeId) {
			changed = true;
			continue;
		}
		const nextChild = deleteNode(child, nodeId);
		if (nextChild !== child) changed = true;
		nextChildren.push(nextChild);
	}

	return changed ? { ...root, children: nextChildren } : root;
}

function findNode(
	root: ArgumentMapNode,
	nodeId: string,
): ArgumentMapNode | null {
	if (root.id === nodeId) return root;
	for (const child of root.children) {
		const found = findNode(child, nodeId);
		if (found) return found;
	}
	return null;
}

function moveWithinParent(
	root: ArgumentMapNode,
	nodeId: string,
	direction: "up" | "down",
): ArgumentMapNode {
	const idx = root.children.findIndex((c) => c.id === nodeId);
	if (idx >= 0) {
		const nextIndex = direction === "up" ? idx - 1 : idx + 1;
		if (nextIndex < 0 || nextIndex >= root.children.length) return root;
		const nextChildren = root.children.slice();
		const [item] = nextChildren.splice(idx, 1);
		if (!item) return root;
		nextChildren.splice(nextIndex, 0, item);
		return { ...root, children: nextChildren };
	}

	let changed = false;
	const nextChildren = root.children.map((child) => {
		const next = moveWithinParent(child, nodeId, direction);
		if (next !== child) changed = true;
		return next;
	});

	return changed ? { ...root, children: nextChildren } : root;
}

export function ArgumentMapEditor({
	value,
	onChange,
	className,
}: ArgumentMapEditorProps) {
	const initial = useMemo<ArgumentMapNode>(
		() => value ?? defaultTree(),
		[value],
	);
	const [tree, setTree] = useState<ArgumentMapNode>(initial);

	const setAndNotify = useCallback(
		(next: ArgumentMapNode) => {
			setTree(next);
			onChange(next);
		},
		[onChange],
	);

	const handleReset = useCallback(() => {
		const next = defaultTree();
		setAndNotify(next);
	}, [setAndNotify]);

	const handleEditText = useCallback(
		(nodeId: string, nextText: string) => {
			setAndNotify(
				updateNode(tree, nodeId, (node) => ({ ...node, text: nextText })),
			);
		},
		[tree, setAndNotify],
	);

	const handleAddChild = useCallback(
		(parentId: string) => {
			const parent = findNode(tree, parentId);
			if (!parent) return;

			const childType: ArgumentMapNodeType =
				parent.type === "claim" ? "support" : "evidence";

			setAndNotify(
				updateNode(tree, parentId, (node) => ({
					...node,
					children: [...node.children, makeNode(childType, "")],
				})),
			);
		},
		[tree, setAndNotify],
	);

	const handleDelete = useCallback(
		(nodeId: string) => {
			const node = findNode(tree, nodeId);
			if (!node) return;

			if (node.children.length > 0) {
				const ok = window.confirm(
					"This node has children. Delete it and all nested nodes?",
				);
				if (!ok) return;
			}

			setAndNotify(deleteNode(tree, nodeId));
		},
		[tree, setAndNotify],
	);

	const handleMove = useCallback(
		(nodeId: string, direction: "up" | "down") => {
			setAndNotify(moveWithinParent(tree, nodeId, direction));
		},
		[tree, setAndNotify],
	);

	const rootEmpty = tree.text.trim().length === 0;
	const canAddSupport = true;

	return (
		<Card className={cn("border-white/10 bg-white/5", className)}>
			<CardHeader className="flex flex-row items-center justify-between gap-3">
				<CardTitle className="flex items-center gap-2 text-base">
					<GitBranch className="h-4 w-4 text-muted-foreground" />
					Argument Map (Pyramid Principle)
				</CardTitle>

				<div className="flex items-center gap-2">
					<Button size="sm" variant="outline" onClick={handleReset}>
						<RefreshCw className="mr-1.5 h-3.5 w-3.5" />
						Reset
					</Button>
					<Button
						size="sm"
						variant="default"
						onClick={() => handleAddChild(tree.id)}
						disabled={!canAddSupport}
					>
						<Plus className="mr-1.5 h-3.5 w-3.5" />
						Add support
					</Button>
				</div>
			</CardHeader>

			<CardContent className="space-y-3">
				<p className="text-muted-foreground text-xs">
					Start with a single <span className="text-blue-300">Claim</span>, add
					supporting arguments, then attach evidence to each supporting point.
				</p>

				{rootEmpty && (
					<div className="rounded-md border border-blue-500/20 bg-blue-500/10 p-3 text-xs text-blue-200">
						Tip: click the pencil icon on the Claim to write your main
						recommendation.
					</div>
				)}

				<ArgumentMapNodeComponent
					node={tree}
					depth={0}
					isRoot
					canMoveUp={false}
					canMoveDown={false}
					onEditText={handleEditText}
					onAddChild={handleAddChild}
					onDelete={handleDelete}
					onMove={handleMove}
				/>
			</CardContent>
		</Card>
	);
}
