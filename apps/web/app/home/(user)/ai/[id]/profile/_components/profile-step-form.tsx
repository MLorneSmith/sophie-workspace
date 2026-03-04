"use client";

import { Badge } from "@kit/ui/badge";
import { Button } from "@kit/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@kit/ui/card";
import { Input } from "@kit/ui/input";
import { Label } from "@kit/ui/label";
import { Textarea } from "@kit/ui/textarea";
import {
	Building2,
	LayoutTemplate,
	Lightbulb,
	MessageCircle,
	Target,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useId, useMemo, useState, useTransition } from "react";

import {
	type AdaptiveQuestion,
	generateAdaptiveQuestionsAction,
} from "../_actions/generate-adaptive-questions.action";
import {
	researchAudienceAction,
	searchAudienceAction,
} from "../_actions/research-audience.action";
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

interface CompanyBriefStructured {
	companySnapshot?: {
		name?: string;
		industry?: string;
		size?: string;
		marketPosition?: string;
	};
	currentSituation?: {
		summary?: string;
		recentNews?: string[];
		strategicFocus?: string;
		challenges?: string[];
		archetype?: string;
	};
	industryContext?: {
		trends?: string[];
		regulatory?: string;
		competitors?: string[];
	};
	presentationImplications?: {
		framingAdvice?: string;
		topicsToAcknowledge?: string[];
		relevantBenchmarks?: string[];
		avoidTopics?: string[];
	};
}

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

type FormState =
	| "input"
	| "searching"
	| "selecting"
	| "researching"
	| "brief"
	| "editing";

interface PersonSearchResult {
	fullName: string;
	headline: string;
	summary: string | null;
	profilePicture: string | null;
	location: string | null;
	profileURL: string;
	username: string;
}

const RESEARCH_STEPS = [
	"Building profile…",
	"Analyzing career background…",
	"Researching company…",
	"Analyzing company news & strategy…",
	"Generating audience brief…",
] as const;

/** Returns true when the brief has at least one populated section. */
function hasBriefContent(b: BriefStructured | null): boolean {
	if (!b) return false;
	const cp = b.communicationProfile;
	const sr = b.strategicRecommendations;
	const pf = b.presentationFormat;
	return !!(
		cp?.decisionMakingStyle ||
		cp?.attentionSpan ||
		cp?.whatTheyTrust ||
		cp?.careerContext ||
		sr?.leadWith ||
		sr?.frameAs ||
		sr?.avoid ||
		sr?.include ||
		pf?.structure ||
		pf?.dataDensity ||
		pf?.tone ||
		pf?.lengthRecommendation ||
		b.briefSummary
	);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractDomainFromUrl(url: string): string {
	try {
		return new URL(url).hostname.replace(/^www\./, "");
	} catch {
		return (
			url
				.replace(/^https?:\/\//, "")
				.replace(/^www\./, "")
				.split("/")[0] ?? ""
		);
	}
}

function getCompanyLogoUrl(domain: string | null): string | null {
	const clientId = process.env.NEXT_PUBLIC_BRANDFETCH_CLIENT_ID;
	if (!clientId || !domain) return null;
	return `https://cdn.brandfetch.io/domain/${domain}?c=${clientId}`;
}

function extractCompanyDomain(
	enrichmentData: Record<string, unknown> | null,
): string | null {
	if (!enrichmentData) return null;
	const netrows = enrichmentData.netrows as {
		companyDetails?: { website?: string };
	} | null;
	const website = netrows?.companyDetails?.website;
	return website ? extractDomainFromUrl(website) : null;
}

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
	const hasBrief = hasBriefContent(
		props.initialProfile?.brief_structured as BriefStructured | null,
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
	const [hasCompanyBrief, setHasCompanyBrief] = useState(false);
	const [companyBrief, setCompanyBrief] =
		useState<CompanyBriefStructured | null>(
			(
				props.initialProfile?.enrichment_data as {
					companyBrief?: CompanyBriefStructured;
				} | null
			)?.companyBrief ?? null,
		);
	const [companyDomain, setCompanyDomain] = useState<string | null>(
		extractCompanyDomain(props.initialProfile?.enrichment_data ?? null),
	);
	const [searchResults, setSearchResults] = useState<PersonSearchResult[]>([]);
	const [adaptiveQuestions, setAdaptiveQuestions] = useState<
		AdaptiveQuestion[]
	>([]);
	const [adaptiveAnswers, setAdaptiveAnswers] = useState<
		Record<string, string>
	>({});
	const [showAdaptive, setShowAdaptive] = useState(false);
	const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);

	// -----------------------------------------------------------------------
	// Research handler
	// -----------------------------------------------------------------------

	// Step 1b: Research with selected person (or without)
	const handleResearchWithSelection = useCallback(
		async (selectedLinkedinUrl: string | undefined) => {
			setError(null);
			setFormState("researching");
			setResearchStep(0);

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
					selectedLinkedinUrl,
				});

				clearInterval(stepTimer);

				if (!result.success) {
					throw new Error(
						"error" in result ? String(result.error) : "Research failed",
					);
				}

				const profile = result.profile as AudienceProfileRow;
				const structured =
					(profile.brief_structured as BriefStructured) ?? null;

				setBrief(structured);
				setBriefText(profile.brief_text ?? "");
				setHasPersonData(!!result.hasPersonData);
				setHasCompanyData(!!result.hasCompanyData);
				setHasCompanyBrief(
					!!(result as { hasCompanyBrief?: boolean }).hasCompanyBrief,
				);

				// Extract company brief and domain from enrichment data
				const enrichment = profile.enrichment_data as Record<
					string,
					unknown
				> | null;
				setCompanyBrief(
					(enrichment?.companyBrief as CompanyBriefStructured) ?? null,
				);
				setCompanyDomain(extractCompanyDomain(enrichment));
				setFormState("brief");
			} catch (err) {
				clearInterval(stepTimer);
				setError(err instanceof Error ? err.message : "Research failed");
				setFormState("input");
			}
		},
		[props.presentationId, personName, company, context],
	);

	// Step 1a: Search for candidates
	const handleSearch = useCallback(async () => {
		setError(null);
		setFormState("searching");

		try {
			const result = await searchAudienceAction({
				personName,
				company,
				context: context || undefined,
			});

			if (!result.success) {
				throw new Error(
					"error" in result ? String(result.error) : "Search failed",
				);
			}

			const persons = (result.personResults ?? []) as PersonSearchResult[];
			setSearchResults(persons);

			if (persons.length === 0) {
				// No results — go straight to research without LinkedIn data
				handleResearchWithSelection(undefined);
			} else {
				setFormState("selecting");
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Search failed");
			setFormState("input");
		}
	}, [personName, company, context, handleResearchWithSelection]);

	// -----------------------------------------------------------------------
	// Adaptive questions handler
	// -----------------------------------------------------------------------

	const handleGenerateQuestions = useCallback(async () => {
		if (!brief) return;
		setIsLoadingQuestions(true);

		try {
			const result = await generateAdaptiveQuestionsAction({
				briefStructured: brief as Record<string, unknown>,
				companyBrief: companyBrief as Record<string, unknown> | null,
				personName,
				company,
			});

			if (result.success && result.questions.length > 0) {
				setAdaptiveQuestions(result.questions);
				setShowAdaptive(true);
			}
		} catch {
			// Non-blocking — user can continue without adaptive questions
		} finally {
			setIsLoadingQuestions(false);
		}
	}, [brief, companyBrief, personName, company]);

	// -----------------------------------------------------------------------
	// Save & continue handler
	// -----------------------------------------------------------------------

	const handleContinue = useCallback(() => {
		setError(null);

		// Collect adaptive answers (if any) for saving
		const answersToSave = adaptiveQuestions
			.filter((q) => adaptiveAnswers[q.id]?.trim())
			.map((q) => ({
				questionId: q.id,
				question: q.question,
				answer: adaptiveAnswers[q.id]?.trim() ?? "",
			}));

		startSaving(async () => {
			try {
				const result = await saveProfileStepAction({
					presentationId: props.presentationId,
					personName,
					company,
					title: "",
					linkedinUrl: "",
					briefText,
					adaptiveAnswers: answersToSave.length > 0 ? answersToSave : undefined,
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
	}, [
		props.presentationId,
		personName,
		company,
		briefText,
		router,
		adaptiveQuestions,
		adaptiveAnswers,
	]);

	// -----------------------------------------------------------------------
	// Render: Searching for candidates
	// -----------------------------------------------------------------------

	if (formState === "searching") {
		return (
			<div className="mx-auto w-full max-w-5xl space-y-8">
				<div className="text-center">
					<h2 className="text-app-h3 font-semibold">
						Searching for your audience…
					</h2>
					<p className="mt-2 text-app-sm text-muted-foreground">
						Looking up{" "}
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
				<div className="flex justify-center">
					<div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
				</div>
			</div>
		);
	}

	// -----------------------------------------------------------------------
	// Render: Select from search results
	// -----------------------------------------------------------------------

	if (formState === "selecting") {
		return (
			<div className="mx-auto w-full max-w-5xl space-y-6">
				<div>
					<h2 className="text-app-h3 font-semibold">Select the right person</h2>
					<p className="mt-2 text-app-sm text-muted-foreground">
						We found {searchResults.length} result
						{searchResults.length !== 1 ? "s" : ""} for{" "}
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

				{(() => {
					const topResults = searchResults.slice(0, 3);
					const moreResults = searchResults.slice(3);

					const renderPersonCard = (
						person: PersonSearchResult,
						index: number,
					) => {
						const linkedinUrl =
							person.profileURL ??
							(person.username
								? `https://www.linkedin.com/in/${person.username}/`
								: undefined);
						const displayName = person.fullName || person.username || "Unknown";
						const initials = displayName
							.split(/\s+/)
							.slice(0, 2)
							.map((w) => w[0])
							.join("")
							.toUpperCase();

						return (
							<button
								key={person.username || `search-result-${index}`}
								type="button"
								className="flex items-center gap-3 overflow-hidden rounded-lg border border-white/10 bg-white/5 p-3 text-left transition-colors hover:border-primary/50 hover:bg-white/10"
								onClick={() => handleResearchWithSelection(linkedinUrl)}
							>
								{person.profilePicture ? (
									<img
										src={person.profilePicture}
										alt=""
										className="size-10 shrink-0 rounded-full object-cover"
									/>
								) : (
									<div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-medium text-primary">
										{initials}
									</div>
								)}
								<div className="min-w-0 flex-1">
									<p className="truncate font-medium text-foreground">
										{displayName}
									</p>
									<p className="truncate text-sm text-muted-foreground">
										{person.headline}
									</p>
								</div>
								<Badge variant="secondary" className="shrink-0">
									Select
								</Badge>
							</button>
						);
					};

					return (
						<div className="space-y-3">
							<div className="grid gap-3">
								{topResults.map((person, index) =>
									renderPersonCard(person, index),
								)}
							</div>

							{moreResults.length > 0 ? (
								<details className="rounded-lg border border-white/10 bg-white/5 p-3">
									<summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
										Show {moreResults.length} more result
										{moreResults.length !== 1 ? "s" : ""}
									</summary>
									<div className="mt-3 grid gap-3">
										{moreResults.map((person, index) =>
											renderPersonCard(person, index + 3),
										)}
									</div>
								</details>
							) : null}
						</div>
					);
				})()}

				<details className="rounded-lg border border-white/10 bg-white/5 p-3">
					<summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
						Don&apos;t see who you&apos;re looking for?
					</summary>
					<div className="mt-4 space-y-4">
						<div className="space-y-2">
							<p className="text-app-xs font-medium text-muted-foreground">
								Know their LinkedIn URL?
							</p>
							<div className="flex gap-2">
								<input
									type="url"
									placeholder="https://www.linkedin.com/in/..."
									className="flex-1 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
									onKeyDown={(e) => {
										if (e.key === "Enter") {
											const url = (e.target as HTMLInputElement).value.trim();
											if (url) handleResearchWithSelection(url);
										}
									}}
									id={`${reactId}-manual-linkedin-url`}
								/>
								<Button
									variant="secondary"
									size="sm"
									onClick={() => {
										const input = document.getElementById(
											`${reactId}-manual-linkedin-url`,
										) as HTMLInputElement;
										const url = input?.value?.trim();
										if (url) handleResearchWithSelection(url);
									}}
								>
									Use this profile
								</Button>
							</div>
						</div>

						<div className="flex flex-col gap-2 border-t border-white/5 pt-4 sm:flex-row">
							<Button
								variant="secondary"
								onClick={() => handleResearchWithSelection(undefined)}
							>
								Continue without LinkedIn
							</Button>
							<Button
								variant="ghost"
								onClick={() => {
									setSearchResults([]);
									setFormState("input");
								}}
							>
								Refine your search
							</Button>
						</div>
					</div>
				</details>
			</div>
		);
	}

	// -----------------------------------------------------------------------
	// Render: Research in progress
	// -----------------------------------------------------------------------

	if (formState === "researching") {
		return (
			<div className="mx-auto w-full max-w-5xl space-y-8">
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

	if (formState === "brief") {
		const briefEmpty = !hasBriefContent(brief);
		const logoUrl = getCompanyLogoUrl(companyDomain);

		return (
			<div className="mx-auto w-full max-w-5xl space-y-8">
				{/* Identity block */}
				<div className="flex items-start gap-4">
					{logoUrl ? (
						<div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/5 p-2">
							<Image
								src={logoUrl}
								alt={`${company} logo`}
								width={40}
								height={40}
								className="object-contain"
								unoptimized
							/>
						</div>
					) : (
						<div className="flex size-14 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5">
							<Building2 className="size-6 text-muted-foreground" />
						</div>
					)}
					<div className="min-w-0 flex-1">
						<h2 className="text-app-h3 font-semibold">{personName}</h2>
						<p className="text-app-body text-muted-foreground">
							{company ? `${company} ` : ""}
							<span className="text-muted-foreground/50">
								— review and edit before continuing
							</span>
						</p>
						<div className="mt-2 flex gap-1.5">
							{hasPersonData ? (
								<Badge variant="secondary" className="text-xs">
									LinkedIn
								</Badge>
							) : null}
							{hasCompanyData ? (
								<Badge variant="secondary" className="text-xs">
									Company
								</Badge>
							) : null}
							{hasCompanyBrief ? (
								<Badge variant="secondary" className="text-xs">
									Deep Research
								</Badge>
							) : null}
						</div>
					</div>
				</div>

				{briefEmpty ? (
					<div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-6 text-center">
						<p className="text-app-body font-medium text-foreground">
							Brief generation failed
						</p>
						<p className="mt-1 text-app-sm text-muted-foreground">
							We collected research data but couldn&apos;t generate the audience
							brief. Click <strong>Re-research</strong> to try again.
						</p>
					</div>
				) : null}

				{/* Brief summary — hero callout */}
				{brief?.briefSummary ? (
					<div className="rounded-lg border-l-4 border-l-primary bg-primary/5 px-5 py-4">
						<p className="text-app-body leading-relaxed text-foreground">
							{brief.briefSummary}
						</p>
					</div>
				) : null}

				{brief && !briefEmpty ? (
					<div className="grid gap-5 md:grid-cols-3">
						{/* Communication Profile */}
						<Card className="border-l-4 border-l-blue-400">
							<CardHeader className="pb-3">
								<CardTitle className="flex items-center gap-2 text-app-body font-semibold">
									<MessageCircle className="size-4 text-blue-400" />
									Communication Profile
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3 text-app-sm">
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
						<Card className="border-l-4 border-l-amber-400">
							<CardHeader className="pb-3">
								<CardTitle className="flex items-center gap-2 text-app-body font-semibold">
									<Lightbulb className="size-4 text-amber-400" />
									Strategic Recommendations
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3 text-app-sm">
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
						<Card className="border-l-4 border-l-emerald-400">
							<CardHeader className="pb-3">
								<CardTitle className="flex items-center gap-2 text-app-body font-semibold">
									<LayoutTemplate className="size-4 text-emerald-400" />
									Presentation Format
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3 text-app-sm">
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
				) : null}

				{/* Company Context Section */}
				{companyBrief ? (
					<Card className="border-l-4 border-l-violet-400">
						<CardHeader className="pb-3">
							<div className="flex items-center gap-2">
								<CardTitle className="flex items-center gap-2 text-app-body font-semibold">
									<Building2 className="size-4 text-violet-400" />
									Company Context
								</CardTitle>
								{companyBrief.currentSituation?.archetype ? (
									<Badge variant="outline" className="text-xs capitalize">
										{companyBrief.currentSituation.archetype.replace(/-/g, " ")}
									</Badge>
								) : null}
							</div>
						</CardHeader>
						<CardContent className="space-y-4">
							{companyBrief.currentSituation?.summary ? (
								<p className="text-app-sm text-muted-foreground">
									{companyBrief.currentSituation.summary}
								</p>
							) : null}

							<div className="grid gap-4 md:grid-cols-2">
								{/* Strategic Focus & Challenges */}
								<div className="space-y-3 text-app-sm">
									{companyBrief.currentSituation?.strategicFocus ? (
										<div>
											<span className="font-medium text-muted-foreground">
												Strategic focus:{" "}
											</span>
											{companyBrief.currentSituation.strategicFocus}
										</div>
									) : null}
									{companyBrief.currentSituation?.challenges &&
									companyBrief.currentSituation.challenges.length > 0 ? (
										<div>
											<span className="font-medium text-muted-foreground">
												Challenges:{" "}
											</span>
											{companyBrief.currentSituation.challenges.join("; ")}
										</div>
									) : null}
									{companyBrief.industryContext?.competitors &&
									companyBrief.industryContext.competitors.length > 0 ? (
										<div>
											<span className="font-medium text-muted-foreground">
												Key competitors:{" "}
											</span>
											{companyBrief.industryContext.competitors.join(", ")}
										</div>
									) : null}
								</div>

								{/* Presentation Implications */}
								<div className="space-y-3 text-app-sm">
									{companyBrief.presentationImplications?.framingAdvice ? (
										<div>
											<span className="font-medium text-muted-foreground">
												Framing advice:{" "}
											</span>
											{companyBrief.presentationImplications.framingAdvice}
										</div>
									) : null}
									{companyBrief.presentationImplications?.avoidTopics &&
									companyBrief.presentationImplications.avoidTopics.length >
										0 ? (
										<div>
											<span className="font-medium text-muted-foreground">
												Avoid:{" "}
											</span>
											{companyBrief.presentationImplications.avoidTopics.join(
												"; ",
											)}
										</div>
									) : null}
								</div>
							</div>

							{/* Recent News */}
							{companyBrief.currentSituation?.recentNews &&
							companyBrief.currentSituation.recentNews.length > 0 ? (
								<div className="space-y-1.5 text-app-sm">
									<span className="font-medium text-muted-foreground">
										Recent developments:
									</span>
									<ul className="list-inside list-disc space-y-1 text-muted-foreground">
										{companyBrief.currentSituation.recentNews
											.slice(0, 3)
											.map((news) => (
												<li key={news}>{news}</li>
											))}
									</ul>
								</div>
							) : null}
						</CardContent>
					</Card>
				) : null}

				{/* Adaptive Follow-up Questions */}
				{showAdaptive && adaptiveQuestions.length > 0 ? (
					<Card className="border-l-4 border-l-primary">
						<CardHeader className="pb-3">
							<CardTitle className="flex items-center gap-2 text-app-body font-semibold">
								<Target className="size-4 text-primary" />
								Refine Your Brief
							</CardTitle>
							<p className="text-app-sm text-muted-foreground">
								Answer these questions to sharpen the recommendations. Skip any
								you don&apos;t know.
							</p>
						</CardHeader>
						<CardContent className="space-y-4">
							{adaptiveQuestions.map((q) => (
								<div key={q.id} className="space-y-1.5">
									<Label
										htmlFor={`adaptive-${q.id}`}
										className="text-app-sm font-medium"
									>
										{q.question}
									</Label>
									<p className="text-app-xs text-muted-foreground/70">
										{q.why}
									</p>
									<Textarea
										id={`adaptive-${q.id}`}
										value={adaptiveAnswers[q.id] ?? ""}
										onChange={(e) =>
											setAdaptiveAnswers((prev) => ({
												...prev,
												[q.id]: e.target.value,
											}))
										}
										placeholder="Optional — skip if unsure"
										className="min-h-[60px] text-app-sm"
									/>
								</div>
							))}
						</CardContent>
					</Card>
				) : null}

				{error ? <p className="text-app-sm text-destructive">{error}</p> : null}

				<div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
					<Button
						variant="ghost"
						onClick={() => {
							setBrief(null);
							setShowAdaptive(false);
							setAdaptiveQuestions([]);
							setAdaptiveAnswers({});
							setFormState("input");
						}}
					>
						← Start over
					</Button>

					<div className="flex gap-2">
						{!showAdaptive && !briefEmpty ? (
							<Button
								variant="secondary"
								disabled={isSaving || isLoadingQuestions}
								onClick={handleGenerateQuestions}
							>
								{isLoadingQuestions ? "Loading…" : "Refine brief"}
							</Button>
						) : null}

						<Button
							variant="secondary"
							disabled={isSaving}
							onClick={() => handleSearch()}
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
		<div className="mx-auto w-full max-w-5xl space-y-6">
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

				<details className="group rounded-lg border border-white/10 bg-white/5 p-3">
					<summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
						Add search hints{" "}
						<span className="text-xs text-muted-foreground/70">
							(help us find the right person)
						</span>
					</summary>
					<div className="mt-3 grid gap-2">
						<Label htmlFor={`${reactId}-context`}>
							What else do you know about them?
						</Label>
						<Textarea
							id={`${reactId}-context`}
							value={context}
							onChange={(e) => setContext(e.target.value)}
							placeholder="e.g. She's the VP of Engineering, based in Toronto, previously at McKinsey…"
							className="min-h-[80px]"
						/>
					</div>
				</details>

				{error ? <p className="text-app-sm text-destructive">{error}</p> : null}
			</div>

			<div className="mt-10 flex flex-col items-end gap-2 border-t border-white/5 pt-6">
				<div className="flex gap-2">
					<Button
						variant="secondary"
						disabled={
							isSaving ||
							personName.trim().length === 0 ||
							company.trim().length === 0
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
						onClick={handleSearch}
						className="bg-primary text-primary-foreground hover:bg-primary/90"
					>
						✨ Research &amp; build profile
					</Button>
				</div>
			</div>
		</div>
	);
}
