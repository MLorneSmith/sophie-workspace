"use client";

import { useCallback, useId, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@kit/ui/badge";
import { Button } from "@kit/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@kit/ui/card";
import { Input } from "@kit/ui/input";
import { Label } from "@kit/ui/label";
import { Textarea } from "@kit/ui/textarea";

import { researchAudienceAction } from "../_actions/research-audience.action";
import { saveProfileStepAction } from "../_actions/save-profile-step.action";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AudienceProfileRow = {
	id: string;
	person_name: string | null;
	company: string | null;
	title: string | null;
	linkedin_url: string | null;
	brief_text: string | null;
	brief_structured: Record<string, unknown> | null;
	enrichment_data: Record<string, unknown> | null;
};

interface BriefStructured {
	communicationProfile?: {
		decisionMakingStyle?: string;
		attentionSpan?: string;
		whatTheyTrust?: string;
		careerContext?: string;
	};
	strategicRecommendations?: {
		leadWith?: string;
		frameAs?: string;
		avoid?: string;
		include?: string;
	};
	presentationFormat?: {
		structure?: string;
		executiveSummary?: string;
		dataDensity?: string;
		tone?: string;
		frameworksTheyRecognize?: string;
		lengthRecommendation?: string;
	};
	briefSummary?: string;
}

type FormState = "input" | "researching" | "brief" | "editing";

const RESEARCH_STEPS = [
	"Finding LinkedIn profile…",
	"Analyzing career background…",
	"Researching company…",
	"Generating audience brief…",
] as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProfileStepForm(props: {
	presentationId: string;
	initialProfile: AudienceProfileRow | null;
}) {
	const router = useRouter();
	const reactId = useId();
	const [isSaving, startSaving] = useTransition();

	// Determine initial form state based on existing profile data
	const hasBrief = !!(
		props.initialProfile?.brief_structured &&
		Object.keys(props.initialProfile.brief_structured).length > 0
	);

	const initial = useMemo(
		() => ({
			personName: props.initialProfile?.person_name ?? "",
			company: props.initialProfile?.company ?? "",
			context: "",
		}),
		[props.initialProfile],
	);

	const [personName, setPersonName] = useState(initial.personName);
	const [company, setCompany] = useState(initial.company);
	const [context, setContext] = useState(initial.context);
	const [error, setError] = useState<string | null>(null);

	const [formState, setFormState] = useState<FormState>(
		hasBrief ? "brief" : "input",
	);
	const [researchStep, setResearchStep] = useState(0);
	const [brief, setBrief] = useState<BriefStructured | null>(
		(props.initialProfile?.brief_structured as BriefStructured) ?? null,
	);
	const [briefText, setBriefText] = useState(
		props.initialProfile?.brief_text ?? "",
	);
	const [hasPersonData, setHasPersonData] = useState(false);
	const [hasCompanyData, setHasCompanyData] = useState(false);

	// -----------------------------------------------------------------------
	// Research handler
	// -----------------------------------------------------------------------

	const handleResearch = useCallback(async () => {
		setError(null);
		setFormState("researching");
		setResearchStep(0);

		// Animate through research steps
		const stepTimer = setInterval(() => {
			setResearchStep((prev) =>
				prev < RESEARCH_STEPS.length - 1 ? prev + 1 : prev,
			);
		}, 2500);

		try {
			const result = await researchAudienceAction({
				presentationId: props.presentationId,
				personName,
				company,
				context: context || undefined,
			});

			clearInterval(stepTimer);

			if (!result.success) {
				throw new Error(
					"error" in result ? String(result.error) : "Research failed",
				);
			}

			const profile = result.profile as AudienceProfileRow;
			const structured = (profile.brief_structured as BriefStructured) ?? null;

			setBrief(structured);
			setBriefText(profile.brief_text ?? "");
			setHasPersonData(!!result.hasPersonData);
			setHasCompanyData(!!result.hasCompanyData);
			setFormState("brief");
		} catch (err) {
			clearInterval(stepTimer);
			setError(err instanceof Error ? err.message : "Research failed");
			setFormState("input");
		}
	}, [props.presentationId, personName, company, context]);

	// -----------------------------------------------------------------------
	// Save & continue handler
	// -----------------------------------------------------------------------

	const handleContinue = useCallback(() => {
		setError(null);

		startSaving(async () => {
			try {
				const result = await saveProfileStepAction({
					presentationId: props.presentationId,
					personName,
					company,
					title: "",
					linkedinUrl: "",
					briefText,
				});

				if (!result.success) {
					throw new Error(
						"error" in result ? String(result.error) : "Failed to save",
					);
				}

				router.push(`/home/ai/${props.presentationId}/assemble`);
			} catch (err) {
				setError(err instanceof Error ? err.message : "Failed to save");
			}
		});
	}, [props.presentationId, personName, company, briefText, router]);

	// -----------------------------------------------------------------------
	// Render: Research in progress
	// -----------------------------------------------------------------------

	if (formState === "researching") {
		return (
			<div className="mx-auto w-full max-w-3xl space-y-8">
				<div className="text-center">
					<h2 className="text-app-h3 font-semibold">
						Researching your audience
					</h2>
					<p className="mt-2 text-app-sm text-muted-foreground">
						Building an audience profile for{" "}
						<span className="font-medium text-foreground">{personName}</span>
						{company ? (
							<>
								{" "}
								at{" "}
								<span className="font-medium text-foreground">{company}</span>
							</>
						) : null}
					</p>
				</div>

				<div className="space-y-3">
					{RESEARCH_STEPS.map((step, idx) => (
						<div
							key={step}
							className={`flex items-center gap-3 rounded-lg border p-4 transition-all duration-500 ${
								idx < researchStep
									? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950"
									: idx === researchStep
										? "border-primary/30 bg-primary/5"
										: "border-transparent bg-muted/30 opacity-40"
							}`}
						>
							<div className="flex h-6 w-6 items-center justify-center">
								{idx < researchStep ? (
									<svg
										aria-hidden="true"
										className="h-5 w-5 text-green-600 dark:text-green-400"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										strokeWidth={2}
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											d="M5 13l4 4L19 7"
										/>
									</svg>
								) : idx === researchStep ? (
									<div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
								) : (
									<div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
								)}
							</div>
							<span
								className={`text-app-sm ${
									idx <= researchStep
										? "text-foreground"
										: "text-muted-foreground"
								}`}
							>
								{step}
							</span>
						</div>
					))}
				</div>
			</div>
		);
	}

	// -----------------------------------------------------------------------
	// Render: Audience Brief
	// -----------------------------------------------------------------------

	if (formState === "brief" && brief) {
		return (
			<div className="mx-auto w-full max-w-3xl space-y-6">
				<div>
					<div className="flex items-center gap-3">
						<h2 className="text-app-h3 font-semibold">Audience Brief</h2>
						<div className="flex gap-1.5">
							{hasPersonData ? (
								<Badge variant="secondary" className="text-xs">
									LinkedIn ✓
								</Badge>
							) : (
								<Badge
									variant="outline"
									className="text-xs text-muted-foreground"
								>
									No LinkedIn data
								</Badge>
							)}
							{hasCompanyData ? (
								<Badge variant="secondary" className="text-xs">
									Company ✓
								</Badge>
							) : (
								<Badge
									variant="outline"
									className="text-xs text-muted-foreground"
								>
									No company data
								</Badge>
							)}
						</div>
					</div>
					<p className="mt-1 text-app-sm text-muted-foreground">
						{personName}
						{company ? ` at ${company}` : ""} — review and edit before
						continuing.
					</p>
				</div>

				{brief.briefSummary ? (
					<p className="rounded-lg border bg-muted/30 p-4 text-app-sm italic text-muted-foreground">
						{brief.briefSummary}
					</p>
				) : null}

				<div className="grid gap-4 md:grid-cols-3">
					{/* Communication Profile */}
					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="text-app-sm font-semibold">
								🎯 Communication Profile
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2 text-app-xs">
							{brief.communicationProfile?.decisionMakingStyle ? (
								<div>
									<span className="font-medium text-muted-foreground">
										Decisions:{" "}
									</span>
									{brief.communicationProfile.decisionMakingStyle}
								</div>
							) : null}
							{brief.communicationProfile?.attentionSpan ? (
								<div>
									<span className="font-medium text-muted-foreground">
										Attention:{" "}
									</span>
									{brief.communicationProfile.attentionSpan}
								</div>
							) : null}
							{brief.communicationProfile?.whatTheyTrust ? (
								<div>
									<span className="font-medium text-muted-foreground">
										Trusts:{" "}
									</span>
									{brief.communicationProfile.whatTheyTrust}
								</div>
							) : null}
							{brief.communicationProfile?.careerContext ? (
								<div>
									<span className="font-medium text-muted-foreground">
										Background:{" "}
									</span>
									{brief.communicationProfile.careerContext}
								</div>
							) : null}
						</CardContent>
					</Card>

					{/* Strategic Recommendations */}
					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="text-app-sm font-semibold">
								💡 Strategic Recommendations
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2 text-app-xs">
							{brief.strategicRecommendations?.leadWith ? (
								<div>
									<span className="font-medium text-muted-foreground">
										Lead with:{" "}
									</span>
									{brief.strategicRecommendations.leadWith}
								</div>
							) : null}
							{brief.strategicRecommendations?.frameAs ? (
								<div>
									<span className="font-medium text-muted-foreground">
										Frame as:{" "}
									</span>
									{brief.strategicRecommendations.frameAs}
								</div>
							) : null}
							{brief.strategicRecommendations?.avoid ? (
								<div>
									<span className="font-medium text-muted-foreground">
										Avoid:{" "}
									</span>
									{brief.strategicRecommendations.avoid}
								</div>
							) : null}
							{brief.strategicRecommendations?.include ? (
								<div>
									<span className="font-medium text-muted-foreground">
										Include:{" "}
									</span>
									{brief.strategicRecommendations.include}
								</div>
							) : null}
						</CardContent>
					</Card>

					{/* Presentation Format */}
					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="text-app-sm font-semibold">
								📊 Presentation Format
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2 text-app-xs">
							{brief.presentationFormat?.structure ? (
								<div>
									<span className="font-medium text-muted-foreground">
										Structure:{" "}
									</span>
									{brief.presentationFormat.structure}
								</div>
							) : null}
							{brief.presentationFormat?.dataDensity ? (
								<div>
									<span className="font-medium text-muted-foreground">
										Data density:{" "}
									</span>
									{brief.presentationFormat.dataDensity}
								</div>
							) : null}
							{brief.presentationFormat?.tone ? (
								<div>
									<span className="font-medium text-muted-foreground">
										Tone:{" "}
									</span>
									{brief.presentationFormat.tone}
								</div>
							) : null}
							{brief.presentationFormat?.lengthRecommendation ? (
								<div>
									<span className="font-medium text-muted-foreground">
										Length:{" "}
									</span>
									{brief.presentationFormat.lengthRecommendation}
								</div>
							) : null}
							{brief.presentationFormat?.frameworksTheyRecognize ? (
								<div>
									<span className="font-medium text-muted-foreground">
										Frameworks:{" "}
									</span>
									{brief.presentationFormat.frameworksTheyRecognize}
								</div>
							) : null}
						</CardContent>
					</Card>
				</div>

				{error ? <p className="text-app-sm text-destructive">{error}</p> : null}

				<div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
					<Button
						variant="ghost"
						onClick={() => {
							setBrief(null);
							setFormState("input");
						}}
					>
						← Start over
					</Button>

					<div className="flex gap-2">
						<Button
							variant="secondary"
							disabled={isSaving}
							onClick={() => handleResearch()}
						>
							Re-research
						</Button>

						<Button
							disabled={isSaving}
							onClick={handleContinue}
							className="bg-primary text-primary-foreground hover:bg-primary/90"
						>
							{isSaving ? "Saving…" : "Continue to Assemble →"}
						</Button>
					</div>
				</div>
			</div>
		);
	}

	// -----------------------------------------------------------------------
	// Render: Input form (simplified)
	// -----------------------------------------------------------------------

	return (
		<div className="mx-auto w-full max-w-3xl space-y-6">
			<div>
				<h2 className="text-app-h3 font-semibold">
					Who are you presenting to?
				</h2>
				<p className="mt-1 text-app-sm text-muted-foreground">
					Enter a name and company — we&apos;ll research them and build a
					tailored audience profile.
				</p>
			</div>

			<div className="space-y-4">
				<div className="grid gap-4 sm:grid-cols-2">
					<div className="grid gap-2">
						<Label htmlFor={`${reactId}-personName`}>Name</Label>
						<Input
							id={`${reactId}-personName`}
							value={personName}
							onChange={(e) => setPersonName(e.target.value)}
							placeholder="e.g. Sarah Chen"
							className="h-12 text-app-md"
							required
						/>
					</div>

					<div className="grid gap-2">
						<Label htmlFor={`${reactId}-company`}>Company</Label>
						<Input
							id={`${reactId}-company`}
							value={company}
							onChange={(e) => setCompany(e.target.value)}
							placeholder="e.g. TD Bank"
							className="h-12 text-app-md"
							required
						/>
					</div>
				</div>

				<div className="grid gap-2">
					<Label htmlFor={`${reactId}-context`}>
						Additional context{" "}
						<span className="text-muted-foreground">(optional)</span>
					</Label>
					<Textarea
						id={`${reactId}-context`}
						value={context}
						onChange={(e) => setContext(e.target.value)}
						placeholder="e.g. Quarterly board review, she's skeptical about our cloud migration costs…"
						className="min-h-[80px]"
					/>
				</div>

				{error ? <p className="text-app-sm text-destructive">{error}</p> : null}

				<div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
					<Button
						variant="secondary"
						disabled={
							personName.trim().length === 0 || company.trim().length === 0
						}
						onClick={() => {
							// Skip research, just save and continue
							startSaving(async () => {
								setError(null);
								try {
									const result = await saveProfileStepAction({
										presentationId: props.presentationId,
										personName,
										company,
										title: "",
										linkedinUrl: "",
										briefText: "",
									});

									if (!result.success) {
										throw new Error(
											"error" in result
												? String(result.error)
												: "Failed to save",
										);
									}

									router.push(`/home/ai/${props.presentationId}/assemble`);
								} catch (err) {
									setError(
										err instanceof Error ? err.message : "Failed to save",
									);
								}
							});
						}}
					>
						{isSaving ? "Saving…" : "Skip research →"}
					</Button>

					<Button
						disabled={
							personName.trim().length === 0 || company.trim().length === 0
						}
						onClick={handleResearch}
						className="bg-primary text-primary-foreground hover:bg-primary/90"
					>
						✨ Research &amp; build profile
					</Button>
				</div>
			</div>
		</div>
	);
}
