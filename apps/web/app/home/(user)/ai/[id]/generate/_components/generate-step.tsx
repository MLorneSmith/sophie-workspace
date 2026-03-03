"use client";

import { Alert, AlertDescription, AlertTitle } from "@kit/ui/alert";
import { Badge } from "@kit/ui/badge";
import { Button } from "@kit/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@kit/ui/card";
import {
	CheckCircle2,
	Download,
	FileText,
	Loader2,
	TriangleAlert,
} from "lucide-react";
import { useMemo, useState, useTransition } from "react";

import { exportPowerPointAction } from "../../storyboard/_actions/export-powerpoint.action";
import { saveGenerateAction } from "../_actions/save-generate.action";
import { saveTemplateAction } from "../_actions/save-template.action";
import { TemplatePicker } from "../../storyboard/_components/template-picker";
import { DEFAULT_TEMPLATE_ID } from "../../../_lib/config/presentation-templates.config";
import type { TemplateId } from "../../../_lib/schemas/presentation-template.schema";

interface GenerateStepProps {
	presentationId: string;
	presentationTitle: string;
	slideCount: number;
	templateId?: string | null;
}

type ExportStatus = "idle" | "success" | "error";

function sanitizeFileName(fileName: string) {
	return fileName.replace(/[\\/:*?"<>|]/g, "-");
}

function downloadPowerPoint(base64: string, fileName: string) {
	const byteCharacters = atob(base64);
	const byteNumbers = new Array(byteCharacters.length);

	for (let i = 0; i < byteCharacters.length; i++) {
		byteNumbers[i] = byteCharacters.charCodeAt(i);
	}

	const byteArray = new Uint8Array(byteNumbers);
	const blob = new Blob([byteArray], {
		type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
	});

	const url = URL.createObjectURL(blob);
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = sanitizeFileName(fileName);
	document.body.appendChild(anchor);
	anchor.click();
	document.body.removeChild(anchor);
	URL.revokeObjectURL(url);
}

export function GenerateStep({
	presentationId,
	presentationTitle,
	slideCount,
	templateId,
}: GenerateStepProps) {
	const [isExporting, startExport] = useTransition();
	const [_isSavingTemplate, startSaveTemplate] = useTransition();
	const [status, setStatus] = useState<ExportStatus>("idle");
	const [statusMessage, setStatusMessage] = useState<string>("");
	const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
		templateId ?? DEFAULT_TEMPLATE_ID,
	);

	const slideLabel = useMemo(() => {
		if (slideCount === 1) return "1 slide";
		return `${slideCount} slides`;
	}, [slideCount]);

	const handleTemplateChange = (templateId: TemplateId) => {
		setSelectedTemplateId(templateId);

		// Save template selection to database
		startSaveTemplate(async () => {
			try {
				await saveTemplateAction({
					presentationId,
					templateId,
				});
			} catch {
				// Non-blocking - template selection will be passed directly to export
			}
		});
	};

	const handleExport = () => {
		setStatus("idle");
		setStatusMessage("");

		startExport(async () => {
			try {
				const result = await exportPowerPointAction({
					presentationId,
					templateId: selectedTemplateId,
				});

				if (!(result && "data" in result && result.data?.base64)) {
					setStatus("error");
					setStatusMessage("Could not generate a PowerPoint file.");
					return;
				}

				downloadPowerPoint(result.data.base64, result.data.filename);

				// Record export metadata in generate_outputs table
				try {
					await saveGenerateAction({
						presentationId,
						templateId: selectedTemplateId,
						exportFormat: "pptx",
						generatedAt: new Date().toISOString(),
					});
				} catch {
					// Non-blocking — download succeeded even if metadata save fails
				}

				setStatus("success");
				setStatusMessage("PowerPoint exported and downloaded.");
			} catch (error) {
				setStatus("error");
				setStatusMessage(
					error instanceof Error
						? error.message
						: "Failed to export PowerPoint. Please try again.",
				);
			}
		});
	};

	return (
		<div className="mx-auto w-full max-w-3xl space-y-6">
			<Card>
				<CardHeader className="space-y-3">
					<div className="flex items-start justify-between gap-4">
						<div className="space-y-1">
							<CardTitle className="text-2xl">{presentationTitle}</CardTitle>
							<p className="text-muted-foreground text-sm">
								Generate your final deck and download it as a PowerPoint file.
							</p>
						</div>
						<Badge variant="secondary" className="gap-1.5">
							<FileText className="h-3.5 w-3.5" />
							{slideLabel}
						</Badge>
					</div>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* Template Picker */}
					<TemplatePicker
						value={selectedTemplateId}
						onChange={handleTemplateChange}
					/>

					{/* Export Button */}
					<Button
						size="lg"
						className="w-full sm:w-auto"
						onClick={handleExport}
						disabled={isExporting || slideCount === 0}
					>
						{isExporting ? (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						) : (
							<Download className="mr-2 h-4 w-4" />
						)}
						Export to PowerPoint
					</Button>

					{slideCount === 0 && (
						<p className="text-muted-foreground text-sm">
							No slides found yet. Complete the storyboard step first.
						</p>
					)}
				</CardContent>
			</Card>

			{status === "success" && (
				<Alert>
					<CheckCircle2 className="h-4 w-4" />
					<AlertTitle>Export complete</AlertTitle>
					<AlertDescription>{statusMessage}</AlertDescription>
				</Alert>
			)}

			{status === "error" && (
				<Alert variant="destructive">
					<TriangleAlert className="h-4 w-4" />
					<AlertTitle>Export failed</AlertTitle>
					<AlertDescription>{statusMessage}</AlertDescription>
				</Alert>
			)}
		</div>
	);
}
