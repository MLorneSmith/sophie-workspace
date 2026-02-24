import { Badge } from "@kit/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@kit/ui/card";

import type { RunAgentResult } from "../../_actions/run-agent.action";

type ValidatorResult = Extract<
	RunAgentResult,
	{ agentId: "validator" }
>["result"];

interface ValidatorResultsProps {
	result: ValidatorResult;
}

function getVerdictClass(verdict: string): string {
	switch (verdict) {
		case "supported":
			return "border-green-500/30 bg-green-500/10 text-green-300";
		case "unsupported":
			return "border-red-500/30 bg-red-500/10 text-red-300";
		case "unverifiable":
			return "border-yellow-500/30 bg-yellow-500/10 text-yellow-300";
		case "outdated":
			return "border-orange-500/30 bg-orange-500/10 text-orange-300";
		default:
			return "border-white/20 bg-white/5 text-white/80";
	}
}

function getQualityClass(quality: string): string {
	switch (quality) {
		case "strong":
			return "text-green-300";
		case "adequate":
			return "text-yellow-300";
		case "weak":
			return "text-orange-300";
		case "none":
			return "text-red-300";
		default:
			return "text-white/80";
	}
}

export function ValidatorResults({ result }: ValidatorResultsProps) {
	return (
		<div className="space-y-3">
			<Card className="border-white/10 bg-white/5">
				<CardHeader className="pb-3">
					<CardTitle className="text-sm">Validation Summary</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2 text-sm">
					<p className="text-muted-foreground">{result.summary}</p>
					<p
						className={`text-xs font-medium ${getQualityClass(result.overallDataQuality)}`}
					>
						Overall data quality: {result.overallDataQuality}
					</p>
					{result.criticalFlags.length > 0 ? (
						<div className="space-y-2">
							<p className="text-xs font-medium">Critical Flags</p>
							{result.criticalFlags.map((flag) => (
								<div
									key={`${flag.slideId}-${flag.issue}`}
									className="rounded-md border border-red-500/20 bg-red-500/10 p-2"
								>
									<p className="text-xs text-red-200">
										Slide {flag.slideId}: {flag.issue}
									</p>
									<p className="text-[11px] text-red-300/80">
										Severity: {flag.severity}
									</p>
								</div>
							))}
						</div>
					) : null}
				</CardContent>
			</Card>

			{result.slides.map((slide, slideIndex) => (
				<Card key={slide.slideId} className="border-white/10 bg-white/5">
					<CardHeader className="pb-3">
						<div className="flex items-center justify-between gap-2">
							<CardTitle className="text-sm">Slide {slideIndex + 1}</CardTitle>
							<span
								className={`text-xs font-medium ${getQualityClass(slide.dataQuality)}`}
							>
								{slide.dataQuality}
							</span>
						</div>
					</CardHeader>
					<CardContent className="space-y-3 text-xs">
						{slide.claims.length > 0 ? (
							slide.claims.map((claim, claimIndex) => (
								<div
									key={`${slide.slideId}-${claim.claim}-${claimIndex}`}
									className="space-y-2 rounded-md border border-white/10 bg-black/20 p-2"
								>
									<div className="flex items-start justify-between gap-2">
										<p className="text-white/90">{claim.claim}</p>
										<Badge className={getVerdictClass(claim.verdict)}>
											{claim.verdict}
										</Badge>
									</div>
									<p className="text-muted-foreground text-[11px]">
										Confidence: {Math.round(claim.confidence * 100)}%
									</p>
									{claim.evidence ? (
										<p className="rounded-md border border-white/10 bg-white/5 p-2 text-[11px] text-white/80">
											{claim.evidence}
										</p>
									) : null}
									<p className="text-[11px] text-white/75">
										{claim.suggestion}
									</p>
								</div>
							))
						) : (
							<p className="text-muted-foreground text-xs">
								No claims detected.
							</p>
						)}
						<p className="rounded-md border border-blue-500/20 bg-blue-500/10 p-2 text-[11px] text-white/80">
							{slide.recommendation}
						</p>
					</CardContent>
				</Card>
			))}
		</div>
	);
}
