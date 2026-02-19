import { Badge } from "@kit/ui/badge";
import { Input } from "@kit/ui/input";

export default function ProfileStepPage() {
	return (
		<div className="flex min-h-[420px] items-center justify-center">
			<div className="mx-auto flex w-full max-w-xl flex-col items-center gap-3 text-center">
				<Input
					disabled
					placeholder="Who are you presenting to?"
					className="h-12 text-app-md"
				/>

				<p className="text-app-sm text-muted-foreground">
					Enter a name, company, or LinkedIn URL to begin audience profiling
				</p>

				<Badge variant="secondary" className="mt-2">
					Coming in Phase 2
				</Badge>
			</div>
		</div>
	);
}
