"use client";

import { Sparkles } from "lucide-react";
import Link from "next/link";

import { Button } from "@kit/ui/button";

export function ActivityEmptyState() {
	return (
		<div className="flex flex-col items-center justify-center py-8 text-center">
			<div className="bg-muted mb-4 rounded-full p-3">
				<Sparkles className="text-muted-foreground h-6 w-6" />
			</div>

			<h3 className="text-foreground mb-1 text-sm font-medium">
				No activity yet
			</h3>

			<p className="text-muted-foreground mb-4 max-w-[200px] text-xs">
				Complete a lesson or quiz to see your progress here
			</p>

			<Button asChild size="sm" variant="outline">
				<Link href="/home/courses">Start Learning</Link>
			</Button>
		</div>
	);
}
