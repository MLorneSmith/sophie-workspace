import { Card, CardContent, CardHeader, CardTitle } from "@kit/ui/card";

import type { RunAgentResult } from "../../_actions/run-agent.action";

type WhispererResult = Extract<
	RunAgentResult,
	{ agentId: "whisperer" }
>["result"];

interface WhispererResultsProps {
	result: WhispererResult;
}

export function WhispererResults({ result }: WhispererResultsProps) {
	return (
		<div className="space-y-3">
			<Card className="border-white/10 bg-white/5">
				<CardHeader className="pb-3">
					<CardTitle className="text-sm">Presentation Coaching</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3 text-sm">
					<div className="grid gap-2 sm:grid-cols-2">
						<div className="rounded-md border border-white/10 bg-black/20 p-2">
							<p className="text-muted-foreground text-xs">
								Estimated Duration
							</p>
							<p className="text-sm font-medium">
								{result.totalTimeMinutes} min
							</p>
						</div>
						<div className="rounded-md border border-white/10 bg-black/20 p-2">
							<p className="text-muted-foreground text-xs">Pace Notes</p>
							<p className="text-xs text-white/80">{result.paceNotes}</p>
						</div>
					</div>
					<div className="space-y-2 rounded-md border border-white/10 bg-black/20 p-2">
						<p className="text-xs font-medium">Opening Hook</p>
						<p className="text-xs text-white/85">{result.openingHook}</p>
					</div>
					<div className="space-y-2 rounded-md border border-white/10 bg-black/20 p-2">
						<p className="text-xs font-medium">Closing Statement</p>
						<p className="text-xs text-white/85">{result.closingStatement}</p>
					</div>
				</CardContent>
			</Card>

			{result.slides.map((slide, index) => (
				<Card key={slide.slideId} className="border-white/10 bg-white/5">
					<CardHeader className="pb-3">
						<div className="flex items-center justify-between gap-2">
							<CardTitle className="text-sm">Slide {index + 1}</CardTitle>
							<span className="text-muted-foreground text-xs">
								{slide.timingSeconds}s
							</span>
						</div>
					</CardHeader>
					<CardContent className="space-y-3 text-xs">
						<div className="space-y-1">
							<p className="font-medium text-white/90">Opening Line</p>
							<p className="text-white/80">{slide.openingLine}</p>
						</div>
						<div className="space-y-1">
							<p className="font-medium text-white/90">Key Messages</p>
							<p className="text-white/80">{slide.keyMessages.join("; ")}</p>
						</div>
						<div className="space-y-1">
							<p className="font-medium text-white/90">Transition</p>
							<p className="text-white/80">{slide.transitionTo}</p>
						</div>
						<div className="space-y-1">
							<p className="font-medium text-red-300">Do Not</p>
							<p className="text-white/80">{slide.doNot.join("; ")}</p>
						</div>
						{slide.audienceTip ? (
							<div className="rounded-md border border-blue-500/20 bg-blue-500/10 p-2">
								<p className="text-[11px] text-blue-100">{slide.audienceTip}</p>
							</div>
						) : null}
					</CardContent>
				</Card>
			))}
		</div>
	);
}
