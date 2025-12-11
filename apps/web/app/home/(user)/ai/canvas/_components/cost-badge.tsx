"use client";

import { Badge, type BadgeProps } from "@kit/ui/badge";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@kit/ui/tooltip";
import { Coins } from "lucide-react";

import { useCostTracking } from "../_lib/contexts/cost-tracking-context";

interface CostBadgeProps extends Omit<BadgeProps, "children"> {
	showIcon?: boolean;
}

export function CostBadge({ showIcon = true, ...props }: CostBadgeProps) {
	const { sessionCost, isLoading } = useCostTracking();

	// Format cost to display with appropriate precision
	const formattedCost = isLoading
		? "..."
		: `$${sessionCost.toFixed(sessionCost < 0.01 ? 4 : 2)}`;

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<Badge
						variant="outline"
						className="bg-muted/50 hover:bg-muted flex items-center gap-1 py-1 font-mono"
						{...props}
					>
						{showIcon && <Coins className="text-muted-foreground h-3 w-3" />}
						<span>{formattedCost}</span>
					</Badge>
				</TooltipTrigger>
				<TooltipContent>API usage cost for this session</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}
