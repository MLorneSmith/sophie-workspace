import { Badge } from "@kit/ui/badge";
import { Layers } from "lucide-react";

export default function StoryboardStepPage() {
	return (
		<div className="flex min-h-[420px] items-center justify-center">
			<div className="mx-auto flex w-full max-w-xl flex-col items-center gap-3 text-center">
				<Layers className="text-muted-foreground size-10" />

				<h2 className="text-lg font-medium">Storyboard Designer</h2>

				<p className="text-app-sm text-muted-foreground">
					Arrange your outline into slides with layouts and visual cues
				</p>

				<Badge variant="secondary" className="mt-2">
					Coming in Phase 2
				</Badge>
			</div>
		</div>
	);
}
