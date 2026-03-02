import { Button } from "@kit/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@kit/ui/card";
import {
	ClipboardList,
	FileText,
	type LucideIcon,
	PlayCircle,
	Plus,
} from "lucide-react";
import Link from "next/link";

interface QuickActionsPanelProps {
	courseInProgress?: boolean;
	assessmentCompleted?: boolean;
	hasPresentationDrafts?: boolean;
}

function ActionButton({
	icon: Icon,
	label,
	href,
	variant = "outline",
}: {
	icon: LucideIcon;
	label: string;
	href: string;
	variant?: "default" | "outline";
}) {
	return (
		<Button asChild variant={variant} className="w-full justify-start gap-2">
			<Link href={href}>
				<Icon className="h-4 w-4" aria-hidden="true" />
				{label}
			</Link>
		</Button>
	);
}

export default function QuickActionsPanel({
	courseInProgress = false,
	assessmentCompleted = false,
	hasPresentationDrafts = false,
}: QuickActionsPanelProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Quick Actions</CardTitle>
			</CardHeader>
			<CardContent
				className="flex flex-col gap-2"
				role="navigation"
				aria-label="Quick actions"
			>
				{courseInProgress && (
					<ActionButton
						icon={PlayCircle}
						label="Continue Course"
						href="/home/course"
						variant="default"
					/>
				)}

				{!assessmentCompleted && (
					<ActionButton
						icon={ClipboardList}
						label="Take Assessment"
						href="/home/assessment"
						variant="outline"
					/>
				)}

				<ActionButton
					icon={Plus}
					label="New Presentation"
					href="/home/ai/blocks"
					variant="outline"
				/>

				{hasPresentationDrafts && (
					<ActionButton
						icon={FileText}
						label="Review Storyboard"
						href="/home/ai/storyboard"
						variant="outline"
					/>
				)}
			</CardContent>
		</Card>
	);
}
