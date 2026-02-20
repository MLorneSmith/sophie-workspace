"use client";

import { useParams } from "next/navigation";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

import { StoryboardEditor } from "./_components/storyboard-editor";

export default function StoryboardStepPage() {
	const params = useParams<{ id: string }>();

	return (
		<Suspense
			fallback={
				<div className="flex min-h-[300px] items-center justify-center">
					<Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
				</div>
			}
		>
			<StoryboardEditor presentationId={params.id} />
		</Suspense>
	);
}
