"use client";

import "@xyflow/react/dist/style.css";

import { Button } from "@kit/ui/button";
import { cn } from "@kit/ui/utils";
import Dagre from "@dagrejs/dagre";
import {
	Background,
	Controls,
	type Edge,
	MarkerType,
	MiniMap,
	ReactFlow,
	useEdgesState,
	useNodesState,
} from "@xyflow/react";
import { Plus, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type {
	ArgumentMapNode as ArgumentMapNodeType,
	ArgumentMapNodeType as NodeType,
} from "../../_lib/schemas/presentation-artifacts";
import { ArgumentMapNode, type ArgumentMapFlowNode } from "./argument-map-node";

export interface ArgumentMapEditorProps {
	value: ArgumentMapNodeType | null;
	onChange: (next: ArgumentMapNodeType) => void;
	className?: string;
}

const nodeTypes = {
	argumentNode: ArgumentMapNode,
};

const NODE_WIDTH = 300;
const NODE_HEIGHT = 140;

function makeNode(type: NodeType, text: string): ArgumentMapNodeType {
	return {
		id: crypto.randomUUID(),
		type,
		text,
		children: [],
	};
}

function defaultTree(): ArgumentMapNodeType {
	return makeNode("claim", "");
}

function updateNodeInTree(
	root: ArgumentMapNodeType,
	nodeId: string,
	updater: (node: ArgumentMapNodeType) => ArgumentMapNodeType,
): ArgumentMapNodeType {
	if (root.id === nodeId) return updater(root);

	if (root.children.length === 0) return root;

	let changed = false;
	const nextChildren = root.children.map((child) => {
		const next = updateNodeInTree(child, nodeId, updater);
		if (next !== child) changed = true;
		return next;
	});

	return changed ? { ...root, children: nextChildren } : root;
}

function deleteNodeFromTree(
	root: ArgumentMapNodeType,
	nodeId: string,
): ArgumentMapNodeType {
	if (root.children.length === 0) return root;

	let changed = false;
	const nextChildren: ArgumentMapNodeType[] = [];

	for (const child of root.children) {
		if (child.id === nodeId) {
			changed = true;
			continue;
		}
		const nextChild = deleteNodeFromTree(child, nodeId);
		if (nextChild !== child) changed = true;
		nextChildren.push(nextChild);
	}

	return changed ? { ...root, children: nextChildren } : root;
}

function findNodeInTree(
	root: ArgumentMapNodeType,
	nodeId: string,
): ArgumentMapNodeType | null {
	if (root.id === nodeId) return root;
	for (const child of root.children) {
		const found = findNodeInTree(child, nodeId);
		if (found) return found;
	}
	return null;
}

// Convert ArgumentMapNode tree to React Flow nodes and edges
function treeToFlowElements(
	tree: ArgumentMapNodeType,
	editingNodeId: string | null,
	editDraft: string,
	callbacks: {
		onStartEdit: (nodeId: string, currentText: string) => void;
		onDraftChange: (nodeId: string, nextDraft: string) => void;
		onSaveEdit: (nodeId: string) => void;
		onCancelEdit: (nodeId: string, currentText: string) => void;
		onAddChild: (parentId: string) => void;
		onDelete: (nodeId: string) => void;
	},
): { nodes: ArgumentMapFlowNode[]; edges: Edge[] } {
	const nodes: ArgumentMapFlowNode[] = [];
	const edges: Edge[] = [];

	function walk(node: ArgumentMapNodeType, isRoot: boolean) {
		const isEditing = editingNodeId === node.id;
		nodes.push({
			id: node.id,
			type: "argumentNode",
			position: { x: 0, y: 0 }, // Will be set by dagre
			data: {
				nodeType: node.type,
				text: node.text,
				isRoot,
				isEditing,
				draft: isEditing ? editDraft : node.text,
				...callbacks,
			},
		});

		for (const child of node.children) {
			edges.push({
				id: `${node.id}->${child.id}`,
				source: node.id,
				target: child.id,
				animated: true,
				markerEnd: {
					type: MarkerType.ArrowClosed,
					width: 16,
					height: 16,
				},
				style: { strokeWidth: 2 },
			});
			walk(child, false);
		}
	}

	walk(tree, true);
	return { nodes, edges };
}

// Apply dagre layout to nodes
function layoutWithDagre(
	nodes: ArgumentMapFlowNode[],
	edges: Edge[],
): ArgumentMapFlowNode[] {
	const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
	g.setGraph({ rankdir: "TB", nodesep: 50, ranksep: 80 });

	for (const node of nodes) {
		g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
	}

	for (const edge of edges) {
		g.setEdge(edge.source, edge.target);
	}

	Dagre.layout(g);

	return nodes.map((node) => {
		const dagreNode = g.node(node.id);
		return {
			...node,
			position: {
				x: dagreNode.x - NODE_WIDTH / 2,
				y: dagreNode.y - NODE_HEIGHT / 2,
			},
		};
	});
}

export function ArgumentMapEditor({
	value,
	onChange,
	className,
}: ArgumentMapEditorProps) {
	const initial = useMemo<ArgumentMapNodeType>(
		() => value ?? defaultTree(),
		[value],
	);
	const [tree, setTree] = useState<ArgumentMapNodeType>(initial);
	const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
	const [editDraft, setEditDraft] = useState("");

	// React Flow state
	const [nodes, setNodes, onNodesChange] = useNodesState<ArgumentMapFlowNode>(
		[],
	);
	const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

	// Notify parent about the initial default tree on mount
	const didNotifyRef = useRef(false);
	useEffect(() => {
		if (!didNotifyRef.current && value === null) {
			didNotifyRef.current = true;
			onChange(initial);
		}
	}, [value, onChange, initial]);

	// Callbacks for node actions
	const handleStartEdit = useCallback((nodeId: string, currentText: string) => {
		setEditingNodeId(nodeId);
		setEditDraft(currentText);
	}, []);

	const handleDraftChange = useCallback(
		(_nodeId: string, nextDraft: string) => {
			setEditDraft(nextDraft);
		},
		[],
	);

	const handleSaveEdit = useCallback(
		(nodeId: string) => {
			const nextTree = updateNodeInTree(tree, nodeId, (node) => ({
				...node,
				text: editDraft,
			}));
			setTree(nextTree);
			onChange(nextTree);
			setEditingNodeId(null);
			setEditDraft("");
		},
		[tree, editDraft, onChange],
	);

	const handleCancelEdit = useCallback(
		(_nodeId: string, _currentText: string) => {
			setEditingNodeId(null);
			setEditDraft("");
		},
		[],
	);

	const handleAddChild = useCallback(
		(parentId: string) => {
			const parent = findNodeInTree(tree, parentId);
			if (!parent) return;

			const childType: NodeType =
				parent.type === "claim" ? "support" : "evidence";

			const nextTree = updateNodeInTree(tree, parentId, (node) => ({
				...node,
				children: [...node.children, makeNode(childType, "")],
			}));
			setTree(nextTree);
			onChange(nextTree);
		},
		[tree, onChange],
	);

	const handleDelete = useCallback(
		(nodeId: string) => {
			const node = findNodeInTree(tree, nodeId);
			if (!node) return;

			if (node.children.length > 0) {
				const ok = window.confirm(
					"This node has children. Delete it and all nested nodes?",
				);
				if (!ok) return;
			}

			const nextTree = deleteNodeFromTree(tree, nodeId);
			setTree(nextTree);
			onChange(nextTree);
		},
		[tree, onChange],
	);

	const handleReset = useCallback(() => {
		const next = defaultTree();
		setTree(next);
		onChange(next);
		setEditingNodeId(null);
		setEditDraft("");
	}, [onChange]);

	const handleAddSupport = useCallback(() => {
		handleAddChild(tree.id);
	}, [handleAddChild, tree.id]);

	// Update React Flow nodes/edges when tree changes
	useEffect(() => {
		const callbacks = {
			onStartEdit: handleStartEdit,
			onDraftChange: handleDraftChange,
			onSaveEdit: handleSaveEdit,
			onCancelEdit: handleCancelEdit,
			onAddChild: handleAddChild,
			onDelete: handleDelete,
		};

		const { nodes: flowNodes, edges: flowEdges } = treeToFlowElements(
			tree,
			editingNodeId,
			editDraft,
			callbacks,
		);

		const layoutedNodes = layoutWithDagre(flowNodes, flowEdges);
		setNodes(layoutedNodes);
		setEdges(flowEdges);
	}, [
		tree,
		editingNodeId,
		editDraft,
		handleStartEdit,
		handleDraftChange,
		handleSaveEdit,
		handleCancelEdit,
		handleAddChild,
		handleDelete,
		setNodes,
		setEdges,
	]);

	return (
		<div className={cn("flex flex-col gap-3", className)}>
			{/* Toolbar */}
			<div className="flex items-center justify-between gap-3">
				<p className="text-muted-foreground text-xs">
					Start with a single <span className="text-blue-300">Claim</span>, add
					supporting arguments, then attach evidence to each supporting point.
				</p>
				<div className="flex items-center gap-2">
					<Button size="sm" variant="outline" onClick={handleReset}>
						<RefreshCw className="mr-1.5 h-3.5 w-3.5" />
						Reset
					</Button>
					<Button size="sm" variant="default" onClick={handleAddSupport}>
						<Plus className="mr-1.5 h-3.5 w-3.5" />
						Add Support
					</Button>
				</div>
			</div>

			{/* React Flow Canvas */}
			<div className="h-[500px] w-full overflow-hidden rounded-lg border border-white/10 bg-black/20">
				<ReactFlow
					nodes={nodes}
					edges={edges}
					onNodesChange={onNodesChange}
					onEdgesChange={onEdgesChange}
					nodeTypes={nodeTypes}
					fitView
					fitViewOptions={{ padding: 0.2 }}
					minZoom={0.3}
					maxZoom={1.5}
					proOptions={{ hideAttribution: true }}
				>
					<Controls className="[&>button]:!border-white/10 [&>button]:!bg-white/5 [&>button]:!text-white/70" />
					<MiniMap
						className="!border-white/10 !bg-black/40"
						nodeColor={(node: ArgumentMapFlowNode) => {
							const data = node.data;
							switch (data?.nodeType) {
								case "claim":
									return "rgba(59, 130, 246, 0.5)";
								case "support":
									return "rgba(245, 158, 11, 0.5)";
								case "evidence":
									return "rgba(16, 185, 129, 0.5)";
								default:
									return "rgba(255, 255, 255, 0.3)";
							}
						}}
					/>
					<Background color="rgba(255, 255, 255, 0.05)" gap={20} />
				</ReactFlow>
			</div>
		</div>
	);
}
