"use client";

import { Badge } from "@kit/ui/badge";
import { Button } from "@kit/ui/button";
import { Card, CardContent } from "@kit/ui/card";
import { Textarea } from "@kit/ui/textarea";
import { cn } from "@kit/ui/utils";
import { Handle, type Node, type NodeProps, Position } from "@xyflow/react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";

import type { ArgumentMapNodeType } from "../../_lib/schemas/presentation-artifacts";

const TYPE_LABEL: Record<ArgumentMapNodeType, string> = {
	claim: "Claim",
	support: "Support",
	evidence: "Evidence",
};

type NodeStyle = {
	badgeClassName: string;
	cardClassName: string;
	handleClassName: string;
};

function nodeStyles(type: ArgumentMapNodeType): NodeStyle {
	switch (type) {
		case "claim":
			return {
				badgeClassName:
					"border border-blue-500/25 bg-blue-500/15 text-blue-300",
				cardClassName: "border-blue-500/30 bg-blue-500/10",
				handleClassName: "!bg-blue-400 !border-blue-300/80",
			};
		case "support":
			return {
				badgeClassName:
					"border border-amber-500/25 bg-amber-500/15 text-amber-300",
				cardClassName: "border-amber-500/30 bg-amber-500/10",
				handleClassName: "!bg-amber-400 !border-amber-300/80",
			};
		case "evidence":
			return {
				badgeClassName:
					"border border-emerald-500/25 bg-emerald-500/15 text-emerald-300",
				cardClassName: "border-emerald-500/30 bg-emerald-500/10",
				handleClassName: "!bg-emerald-400 !border-emerald-300/80",
			};
	}
}

function truncateText(text: string, maxLength = 150): string {
	const compact = text.replace(/\s+/g, " ").trim();
	if (compact.length <= maxLength) return compact;
	return `${compact.slice(0, maxLength - 1)}…`;
}

export type ArgumentMapFlowNodeData = {
	nodeType: ArgumentMapNodeType;
	text: string;
	isRoot: boolean;
	isEditing: boolean;
	draft: string;
	onStartEdit: (nodeId: string, currentText: string) => void;
	onDraftChange: (nodeId: string, nextDraft: string) => void;
	onSaveEdit: (nodeId: string) => void;
	onCancelEdit: (nodeId: string, currentText: string) => void;
	onAddChild: (parentId: string) => void;
	onDelete: (nodeId: string) => void;
};

export type ArgumentMapFlowNode = Node<ArgumentMapFlowNodeData, "argumentNode">;

export function ArgumentMapNode({
	id,
	data,
	selected,
}: NodeProps<ArgumentMapFlowNode>) {
	const styles = nodeStyles(data.nodeType);
	const canAddChild = data.nodeType === "claim" || data.nodeType === "support";
	const displayText = truncateText(data.text);

	return (
		<>
			<Handle
				type="target"
				position={Position.Top}
				className={cn("!h-2 !w-2 !border-2", styles.handleClassName)}
			/>

			<Card
				className={cn(
					"w-[300px] shadow-sm transition-shadow",
					styles.cardClassName,
					selected && "ring-1 ring-primary/60",
				)}
			>
				<CardContent className="space-y-3 p-3">
					<div className="flex items-start justify-between gap-2">
						<Badge
							variant="secondary"
							className={cn("text-[11px]", styles.badgeClassName)}
						>
							{TYPE_LABEL[data.nodeType]}
						</Badge>

						<div className="flex items-center gap-1">
							<Button
								type="button"
								size="icon"
								variant="ghost"
								className="nodrag nowheel h-7 w-7"
								onClick={() => data.onStartEdit(id, data.text)}
								aria-label="Edit node text"
							>
								<Pencil className="h-3.5 w-3.5" />
							</Button>

							{canAddChild && (
								<Button
									type="button"
									size="icon"
									variant="ghost"
									className="nodrag nowheel h-7 w-7"
									onClick={() => data.onAddChild(id)}
									aria-label="Add child node"
								>
									<Plus className="h-3.5 w-3.5" />
								</Button>
							)}

							{!data.isRoot && (
								<Button
									type="button"
									size="icon"
									variant="ghost"
									className="nodrag nowheel h-7 w-7"
									onClick={() => data.onDelete(id)}
									aria-label="Delete node"
								>
									<Trash2 className="h-3.5 w-3.5" />
								</Button>
							)}
						</div>
					</div>

					{data.isEditing ? (
						<div className="space-y-2">
							<Textarea
								value={data.draft}
								onChange={(event) => data.onDraftChange(id, event.target.value)}
								placeholder={
									data.nodeType === "claim"
										? "Write the main claim..."
										: data.nodeType === "support"
											? "Write a supporting point..."
											: "Write supporting evidence..."
								}
								className="nodrag nowheel min-h-[82px] resize-y"
							/>

							<div className="flex items-center gap-2">
								<Button
									type="button"
									size="sm"
									className="nodrag nowheel h-7 px-2"
									onClick={() => data.onSaveEdit(id)}
									disabled={data.draft.trim().length === 0}
								>
									<Check className="mr-1 h-3.5 w-3.5" />
									Save
								</Button>
								<Button
									type="button"
									size="sm"
									variant="outline"
									className="nodrag nowheel h-7 px-2"
									onClick={() => data.onCancelEdit(id, data.text)}
								>
									<X className="mr-1 h-3.5 w-3.5" />
									Cancel
								</Button>
							</div>
						</div>
					) : (
						<button
							type="button"
							className="nodrag nowheel w-full rounded-sm text-left text-sm leading-relaxed text-foreground/90 transition-colors hover:text-foreground"
							onClick={() => data.onStartEdit(id, data.text)}
						>
							{displayText || "Click to add text"}
						</button>
					)}
				</CardContent>
			</Card>

			{canAddChild && (
				<Handle
					type="source"
					position={Position.Bottom}
					className={cn("!h-2 !w-2 !border-2", styles.handleClassName)}
				/>
			)}
		</>
	);
}
