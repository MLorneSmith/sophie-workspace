"use client";

import { useId, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@kit/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@kit/ui/card";
import { Input } from "@kit/ui/input";
import { Label } from "@kit/ui/label";
import { Textarea } from "@kit/ui/textarea";

import { saveProfileStepAction } from "../_actions/save-profile-step.action";

type AudienceProfileRow = {
	id: string;
	person_name: string | null;
	company: string | null;
	title: string | null;
	linkedin_url: string | null;
	brief_text: string | null;
};

export function ProfileStepForm(props: {
	presentationId: string;
	initialProfile: AudienceProfileRow | null;
}) {
	const router = useRouter();
	const reactId = useId();
	const [isSaving, startSaving] = useTransition();
	const [error, setError] = useState<string | null>(null);

	const initial = useMemo(
		() => ({
			personName: props.initialProfile?.person_name ?? "",
			company: props.initialProfile?.company ?? "",
			title: props.initialProfile?.title ?? "",
			linkedinUrl: props.initialProfile?.linkedin_url ?? "",
			briefText: props.initialProfile?.brief_text ?? "",
		}),
		[props.initialProfile],
	);

	const [personName, setPersonName] = useState(initial.personName);
	const [company, setCompany] = useState(initial.company);
	const [title, setTitle] = useState(initial.title);
	const [linkedinUrl, setLinkedinUrl] = useState(initial.linkedinUrl);
	const [briefText, setBriefText] = useState(initial.briefText);

	async function handleSave(options?: { continue?: boolean }) {
		setError(null);

		startSaving(async () => {
			try {
				const result = await saveProfileStepAction({
					presentationId: props.presentationId,
					personName,
					company,
					title,
					linkedinUrl,
					briefText,
				});

				if (!result.success) {
					throw new Error(
						"error" in result ? String(result.error) : "Failed to save",
					);
				}

				if (options?.continue) {
					router.push(`/home/ai/${props.presentationId}/assemble`);
					return;
				}

				router.refresh();
			} catch (err) {
				setError(err instanceof Error ? err.message : "Failed to save");
			}
		});
	}

	return (
		<div className="mx-auto w-full max-w-2xl">
			<Card className="border-white/10 bg-white/5">
				<CardHeader>
					<CardTitle className="text-app-h3 font-semibold">
						Audience profile
					</CardTitle>
					<p className="text-app-sm text-muted-foreground">
						Tell us who you’re presenting to. You can add more details later.
					</p>
				</CardHeader>

				<CardContent className="space-y-6">
					<div className="grid gap-2">
						<Label htmlFor={`${reactId}-personName`}>
							Who are you presenting to?
						</Label>
						<Input
							id={`${reactId}-personName`}
							value={personName}
							onChange={(e) => setPersonName(e.target.value)}
							placeholder="e.g. Jordan Lee"
							className="h-12 text-app-md"
							required
						/>
					</div>

					<div className="grid gap-4 sm:grid-cols-2">
						<div className="grid gap-2">
							<Label htmlFor={`${reactId}-company`}>Company (optional)</Label>
							<Input
								id={`${reactId}-company`}
								value={company}
								onChange={(e) => setCompany(e.target.value)}
								placeholder="e.g. Acme Corp"
							/>
						</div>

						<div className="grid gap-2">
							<Label htmlFor={`${reactId}-title`}>
								Title / role (optional)
							</Label>
							<Input
								id={`${reactId}-title`}
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								placeholder="e.g. VP Product"
							/>
						</div>
					</div>

					<div className="grid gap-2">
						<Label htmlFor={`${reactId}-linkedinUrl`}>
							LinkedIn URL (optional)
						</Label>
						<Input
							id={`${reactId}-linkedinUrl`}
							value={linkedinUrl}
							onChange={(e) => setLinkedinUrl(e.target.value)}
							placeholder="https://www.linkedin.com/in/..."
						/>
						<p className="text-app-xs text-muted-foreground">
							If you paste a LinkedIn URL later, we’ll use it for enrichment.
						</p>
					</div>

					<div className="grid gap-2">
						<Label htmlFor={`${reactId}-briefText`}>Notes (optional)</Label>
						<Textarea
							id={`${reactId}-briefText`}
							value={briefText}
							onChange={(e) => setBriefText(e.target.value)}
							placeholder="Anything that matters about this audience — goals, objections, context…"
							className="min-h-[120px]"
						/>
					</div>

					{error ? (
						<p className="text-app-sm text-destructive">{error}</p>
					) : null}

					<div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
						<Button
							disabled={isSaving}
							variant="secondary"
							onClick={() => handleSave()}
						>
							{isSaving ? "Saving…" : "Save"}
						</Button>

						<Button
							disabled={isSaving || personName.trim().length === 0}
							onClick={() => handleSave({ continue: true })}
							className="bg-primary text-primary-foreground hover:bg-primary/90"
						>
							{isSaving ? "Saving…" : "Continue to Assemble →"}
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
