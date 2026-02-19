import { Badge } from "@kit/ui/badge";
import { FileText } from "lucide-react";

export default function OutlineStepPage() {
	return (
		<div className="flex min-h-[420px] items-center justify-center">
			<div className="mx-auto flex w-full max-w-xl flex-col items-center gap-3 text-center">
				<FileText className="text-muted-foreground size-10" />

				<h2 className="text-lg font-medium">Outline Editor</h2>

				<p className="text-app-sm text-muted-foreground">
					Structure your presentation into sections with key talking points
				</p>

				<Badge variant="secondary" className="mt-2">
					Coming in Phase 2
				</Badge>
			</div>
		</div>
	);
}
