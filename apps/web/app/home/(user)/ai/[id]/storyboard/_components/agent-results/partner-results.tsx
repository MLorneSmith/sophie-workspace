import { Badge } from "@kit/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@kit/ui/card";

import type { RunAgentResult } from "../../_actions/run-agent.action";

type PartnerResult = Extract<RunAgentResult, { agentId: "partner" }>["result"];

interface PartnerResultsProps {
	result: PartnerResult;
}

function getScoreClassName(score: number): string {
	if (score <= 2) return "border-red-500/30 bg-red-500/10 text-red-300";
	if (score === 3)
		return "border-yellow-500/30 bg-yellow-500/10 text-yellow-300";
	return "border-green-500/30 bg-green-500/10 text-green-300";
}

function ScorePill({ label, value }: { label: string; value: number }) {
	return (
		<div
			className={`flex items-center justify-between rounded-md border px-2 py-1.5 text-xs ${getScoreClassName(
				value,
			)}`}
		>
			<span>{label}</span>
			<span className="font-semibold">{value}/5</span>
		</div>
	);
}

export function PartnerResults({ result }: PartnerResultsProps) {
	return (
		<div className="space-y-3">
			<Card className="border-white/10 bg-white/5">
				<CardHeader className="pb-3">
					<div className="flex items-center justify-between gap-3">
						<CardTitle className="text-sm">Executive Summary</CardTitle>
						<Badge className={getScoreClassName(result.overallScore)}>
							Overall {result.overallScore}/5
						</Badge>
					</div>
				</CardHeader>
				<CardContent className="space-y-3 text-sm">
					<p className="text-muted-foreground">{result.executiveSummary}</p>
					<p className="rounded-md border border-white/10 bg-black/20 p-2 text-xs text-white/80">
						{result.narrativeFlow}
					</p>
					<div className="space-y-2">
						<p className="text-xs font-medium">Top Issues</p>
						{result.topIssues.map((issue) => (
							<div
								key={`${issue.issue}-${issue.affectedSlides.join("-")}`}
								className="rounded-md border border-white/10 bg-white/5 p-2"
							>
								<p className="text-xs font-medium text-white/90">
									{issue.issue}
								</p>
								<p className="text-muted-foreground mt-1 text-xs">
									Slides: {issue.affectedSlides.join(", ")}
								</p>
								<p className="mt-1 text-xs text-white/80">{issue.fix}</p>
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			<div className="space-y-2">
				{result.slides.map((slide) => (
					<Card key={slide.slideId} className="border-white/10 bg-white/5">
						<CardHeader className="pb-3">
							<div className="flex items-start justify-between gap-3">
								<div>
									<CardTitle className="text-sm">
										Slide {slide.slideId}
									</CardTitle>
									<p className="text-muted-foreground mt-1 text-xs">
										{slide.headline}
									</p>
								</div>
								<Badge
									variant="outline"
									className="border-white/20 text-xs capitalize"
								>
									{slide.priority}
								</Badge>
							</div>
						</CardHeader>
						<CardContent className="space-y-3 text-xs">
							<div className="grid grid-cols-2 gap-2">
								<ScorePill label="Clarity" value={slide.scores.clarity} />
								<ScorePill label="Relevance" value={slide.scores.relevance} />
								<ScorePill label="Impact" value={slide.scores.impact} />
								<ScorePill
									label="Audience"
									value={slide.scores.audienceAlignment}
								/>
							</div>
							<div className="space-y-1">
								<p className="font-medium text-green-300">Strengths</p>
								<p className="text-white/80">{slide.strengths.join("; ")}</p>
							</div>
							<div className="space-y-1">
								<p className="font-medium text-red-300">Weaknesses</p>
								<p className="text-white/80">{slide.weaknesses.join("; ")}</p>
							</div>
							<p className="rounded-md border border-blue-500/20 bg-blue-500/10 p-2 text-white/80">
								{slide.suggestion}
							</p>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
