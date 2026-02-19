"use client";

import { Badge } from "@kit/ui/badge";
import { Button } from "@kit/ui/button";
import { Card, CardContent } from "@kit/ui/card";
import { Textarea } from "@kit/ui/textarea";
import { cn } from "@kit/ui/utils";
import {
	ArrowDown,
	ArrowUp,
	Check,
	Pencil,
	Plus,
	Trash2,
	X,
} from "lucide-react";
import { useMemo, useState } from "react";

import type {
	ArgumentMapNode as ArgumentMapNodeType,
	ArgumentMapNodeType as ArgumentMapNodeTypeEnum,
} from "../../../_lib/schemas/presentation-artifacts";

const TYPE_LABEL: Record<ArgumentMapNodeTypeEnum, string> = {
	claim: "Claim",
	support: "Support",
	evidence: "Evidence",
};

function typeStyles(type: ArgumentMapNodeTypeEnum): {
	badgeVariant: "default" | "secondary" | "destructive" | "outline";
	badgeClassName: string;
	cardClassName: string;
	connectorClassName: string;
} {
	switch (type) {
		case "claim":
			return {
				badgeVariant: "secondary",
				badgeClassName: "bg-blue-500/15 text-blue-300 border border-blue-500/25",
				cardClassName: "border-blue-500/20 bg-blue-500/5",
				connectorClassName: "bg-blue-400/35",
			};
		case "support":
			return {
				badgeVariant: "secondary",
				badgeClassName:
					"bg-amber-500/15 text-amber-300 border border-amber-500/25",
				cardClassName: "border-amber-500/20 bg-amber-500/5",
				connectorClassName: "bg-amber-400/35",
			};
		case "evidence":
			return {
				badgeVariant: "secondary",
				badgeClassName:
					"bg-emerald-500/15 text-emerald-300 border border-emerald-500/25",
				cardClassName: "border-emerald-500/20 bg-emerald-500/5",
				connectorClassName: "bg-emerald-400/35",
			};
	}
}

export interface ArgumentMapNodeProps {
	node: ArgumentMapNodeType;
	depth: number;
	isRoot: boolean;
	canMoveUp: boolean;
	canMoveDown: boolean;
	onEditText: (nodeId: string, nextText: string) => void;
	onAddChild: (parentId: string) => void;
	onDelete: (nodeId: string) => void;
	onMove: (nodeId: string, direction: "up" | "down") => void;
}

export function ArgumentMapNode({
	node,
	depth,
	isRoot,
	canMoveUp,
	canMoveDown,
	onEditText,
	onAddChild,
	onDelete,
	onMove,
}: ArgumentMapNodeProps) {
	const styles = useMemo(() => typeStyles(node.type), [node.type]);
	const [isEditing, setIsEditing] = useState(false);
	const [draft, setDraft] = useState(node.text);

	const canAddChild = node.type === "claim" || node.type === "support";

	return (
		<div className="relative">
			{/* Horizontal connector into this node (for non-root) */}
			{!isRoot && (
				<div
					className={cn(
						"absolute left-0 top-7 h-px w-4",
						styles.connectorClassName,
					)}
				/>
			)}

			<Card className={cn("relative", styles.cardClassName)}>
				<CardContent className="p-4">
					<div className="flex items-start justify-between gap-3">
						<div className="min-w-0 flex-1">
							<div className="mb-2 flex items-center gap-2">
								<Badge
									variant={styles.badgeVariant}
									className={cn("text-[11px]", styles.badgeClassName)}
								>
									{TYPE_LABEL[node.type]}
								</Badge>
								<span className="text-muted-foreground text-xs">Depth {depth}</span>
							</div>

							{isEditing ? (
								<div className="space-y-2">
									<Textarea
										value={draft}
										onChange={(e) => setDraft(e.target.value)}
										className="min-h-[72px] resize-y"
										placeholder={
											node.type === "claim"
												? "Write the main claim / recommendation..."
												: node.type === "support"
													? "Write a supporting argument..."
													: "Add evidence (facts, data, examples)..."
										}
									/>

									<div className="flex items-center gap-2">
										<Button
											size="sm"
											onClick={() => {
												const next = draft.trim();
												if (next.length === 0) return;
												onEditText(node.id, next);
												setIsEditing(false);
											}}
											disabled={draft.trim().length === 0}
										>
											<Check className="mr-1.5 h-3.5 w-3.5" />
											Save
										</Button>
										<Button
											size="sm"
											variant="outline"
											onClick={() => {
												setDraft(node.text);
												setIsEditing(false);
											}}
										>
											<X className="mr-1.5 h-3.5 w-3.5" />
											Cancel
										</Button>
									</div>
								</div>
							) : (
								<p className="whitespace-pre-wrap text-sm leading-relaxed">
									{node.text}
								</p>
							)}
						</div>

						<div className="flex flex-col items-end gap-2">
							<div className="flex items-center gap-1">
								<Button
									size="icon"
									variant="ghost"
									onClick={() => {
										setDraft(node.text);
										setIsEditing(true);
									}}
									aria-label="Edit"
								>
									<Pencil className="h-4 w-4" />
								</Button>

								{canAddChild && (
									<Button
										size="icon"
										variant="ghost"
										onClick={() => onAddChild(node.id)}
										aria-label="Add child"
									>
										<Plus className="h-4 w-4" />
									</Button>
								)}

								{!isRoot && (
									<Button
										size="icon"
										variant="ghost"
										onClick={() => onDelete(node.id)}
										aria-label="Delete"
									>
										<Trash2 className="h-4 w-4" />
									</Button>
								)}
							</div>

							{!isRoot && (
								<div className="flex items-center gap-1">
									<Button
										size="icon"
										variant="ghost"
										onClick={() => onMove(node.id, "up")}
										disabled={!canMoveUp}
										aria-label="Move up"
									>
										<ArrowUp className="h-4 w-4" />
									</Button>
									<Button
										size="icon"
										variant="ghost"
										onClick={() => onMove(node.id, "down")}
										disabled={!canMoveDown}
										aria-label="Move down"
									>
										<ArrowDown className="h-4 w-4" />
									</Button>
								</div>
							)}
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Children */}
			{node.children.length > 0 && (
				<div className="relative mt-3 pl-6">
					{/* Vertical connector line */}
					<div
						className={cn(
							"absolute left-[7px] top-0 h-full w-px",
							styles.connectorClassName,
						)}
					/>

					<div className="space-y-3">
						{node.children.map((child, idx) => (
							<ArgumentMapNode
								key={child.id}
								node={child}
								depth={depth + 1}
								isRoot={false}
								canMoveUp={idx > 0}
								canMoveDown={idx < node.children.length - 1}
								onEditText={onEditText}
								onAddChild={onAddChild}
								onDelete={onDelete}
								onMove={onMove}
							/>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
