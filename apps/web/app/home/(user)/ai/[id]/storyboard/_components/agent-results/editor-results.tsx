import { Badge } from "@kit/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@kit/ui/card";

import type { RunAgentResult } from "../../_actions/run-agent.action";

type EditorResult = Extract<RunAgentResult, { agentId: "editor" }>["result"];

interface EditorResultsProps {
	result: EditorResult;
}

function getActionClass(action: string): string {
	switch (action) {
		case "keep":
			return "border-green-500/30 bg-green-500/10 text-green-300";
		case "cut":
			return "border-red-500/30 bg-red-500/10 text-red-300";
		case "merge":
			return "border-blue-500/30 bg-blue-500/10 text-blue-300";
		case "move-to-appendix":
			return "border-white/20 bg-white/10 text-white/80";
		case "rewrite":
			return "border-yellow-500/30 bg-yellow-500/10 text-yellow-300";
		default:
			return "border-white/20 bg-white/5 text-white/80";
	}
}

export function EditorResults({ result }: EditorResultsProps) {
	return (
		<div className="space-y-3">
			<Card className="border-white/10 bg-white/5">
				<CardHeader className="pb-3">
					<CardTitle className="text-sm">Editing Summary</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3 text-sm">
					<div className="grid gap-2 sm:grid-cols-2">
						<div className="rounded-md border border-white/10 bg-black/20 p-2">
							<p className="text-muted-foreground text-xs">Current Slides</p>
							<p className="text-sm font-medium">{result.currentSlideCount}</p>
						</div>
						<div className="rounded-md border border-white/10 bg-black/20 p-2">
							<p className="text-muted-foreground text-xs">
								Recommended Slides
							</p>
							<p className="text-sm font-medium">
								{result.recommendedSlideCount}
							</p>
						</div>
					</div>
					<p className="text-muted-foreground text-sm">{result.summary}</p>
					<p className="rounded-md border border-white/10 bg-black/20 p-2 text-xs text-white/80">
						{result.narrativeImpact}
					</p>
					{result.redundancyPairs.length > 0 ? (
						<div className="space-y-2">
							<p className="text-xs font-medium">Redundancy Pairs</p>
							{result.redundancyPairs.map((pair) => (
								<div
									key={`${pair.slideA}-${pair.slideB}`}
									className="rounded-md border border-white/10 bg-white/5 p-2"
								>
									<p className="text-xs text-white/90">
										{pair.slideA} + {pair.slideB}
									</p>
									<p className="text-muted-foreground mt-1 text-[11px]">
										{pair.overlap}
									</p>
								</div>
							))}
						</div>
					) : null}
				</CardContent>
			</Card>

			{result.slides.map((slide, index) => (
				<Card key={slide.slideId} className="border-white/10 bg-white/5">
					<CardHeader className="pb-3">
						<div className="flex items-center justify-between gap-2">
							<CardTitle className="text-sm">Slide {index + 1}</CardTitle>
							<Badge className={getActionClass(slide.action)}>
								{slide.action}
							</Badge>
						</div>
					</CardHeader>
					<CardContent className="space-y-2 text-xs">
						<p className="text-white/85">{slide.reason}</p>
						{slide.mergeWith ? (
							<p className="text-muted-foreground">
								Merge with: {slide.mergeWith}
							</p>
						) : null}
						{slide.rewriteSuggestion ? (
							<p className="rounded-md border border-blue-500/20 bg-blue-500/10 p-2 text-white/80">
								{slide.rewriteSuggestion}
							</p>
						) : null}
					</CardContent>
				</Card>
			))}
		</div>
	);
}
