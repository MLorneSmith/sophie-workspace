"use client";

import { useId, useState } from "react";

import { Button } from "@kit/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@kit/ui/card";
import { FileText, Upload, X } from "lucide-react";

import { uploadDeckAction } from "../_actions/upload-deck.action";
import { deleteMaterialAction } from "../_actions/delete-material.action";

interface DeckUploadProps {
	presentationId: string;
	onUploadComplete?: (materialId: string, fileName: string) => void;
}

export function DeckUpload({
	presentationId,
	onUploadComplete,
}: DeckUploadProps) {
	const id = useId();
	const [isUploading, setIsUploading] = useState(false);
	const [isRemoving, setIsRemoving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [uploadedFile, setUploadedFile] = useState<{
		name: string;
		materialId: string;
	} | null>(null);

	const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		setError(null);
		setIsUploading(true);

		try {
			const result = await uploadDeckAction({
				file,
				presentationId,
			});

			setUploadedFile({
				name: result.fileName,
				materialId: result.materialId,
			});
			onUploadComplete?.(result.materialId, result.fileName);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Upload failed");
		} finally {
			setIsUploading(false);
		}
	};

	const handleRemove = async () => {
		if (!uploadedFile?.materialId) return;

		setIsRemoving(true);
		try {
			await deleteMaterialAction({
				materialId: uploadedFile.materialId,
			});
			setUploadedFile(null);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to remove file");
		} finally {
			setIsRemoving(false);
		}
	};

	if (uploadedFile) {
		return (
			<Card className="border-green-500/20 bg-green-500/5">
				<CardHeader className="pb-2">
					<CardTitle className="flex items-center gap-2 text-sm">
						<FileText className="h-4 w-4 text-green-500" />
						Uploaded
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-between">
						<span className="text-sm text-muted-foreground">
							{uploadedFile.name}
						</span>
						<Button
							variant="ghost"
							size="sm"
							onClick={handleRemove}
							disabled={isRemoving}
							className="text-red-500 hover:text-red-600"
						>
							<X className={`h-4 w-4 ${isRemoving ? "animate-pulse" : ""}`} />
						</Button>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Upload className="h-5 w-5" />
					Upload a Deck
				</CardTitle>
				<CardDescription>
					Optionally upload a PPTX or PDF deck to provide context for your
					presentation outline. The AI will use this as a reference.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					<div>
						<input
							type="file"
							id={id}
							accept=".pptx,.pdf"
							onChange={handleFileSelect}
							disabled={isUploading}
							className="hidden"
						/>
						<label htmlFor={id}>
							<Button
								type="button"
								variant="outline"
								disabled={isUploading}
								className="cursor-pointer"
								asChild
							>
								<span>{isUploading ? "Uploading..." : "Select File"}</span>
							</Button>
						</label>
					</div>
					{error && <p className="text-sm text-red-500">{error}</p>}
					<p className="text-xs text-muted-foreground">
						Supported formats: .pptx, .pdf (max 50MB)
					</p>
				</div>
			</CardContent>
		</Card>
	);
}
