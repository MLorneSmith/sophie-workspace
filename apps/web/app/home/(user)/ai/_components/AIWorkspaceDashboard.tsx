"use client";

import { Button, buttonVariants } from "@kit/ui/button";
import {
	Edit,
	FileIcon as FilePresentation,
	FileText,
	Maximize2,
	Minimize2,
} from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { createPresentationAction } from "../_lib/server/create-presentation.action";
import { Combobox } from "./combobox";
import { EditPresentationCombobox } from "./edit-presentation-combobox";

export default function AIWorkspaceDashboard() {
	const router = useRouter();
	const [isFullscreen, setIsFullscreen] = useState(false);
	const [isCreating, startCreating] = useTransition();

	const toggleFullscreen = () => {
		if (!document.fullscreenElement) {
			document.documentElement.requestFullscreen();
			setIsFullscreen(true);
		} else {
			if (document.exitFullscreen) {
				document.exitFullscreen();
				setIsFullscreen(false);
			}
		}
	};

	return (
		<main className="min-h-screen bg-gradient-to-br p-8">
			<Button
				variant="outline"
				size="icon"
				className="absolute top-4 right-4"
				onClick={toggleFullscreen}
			>
				{isFullscreen ? (
					<Minimize2 className="h-4 w-4" />
				) : (
					<Maximize2 className="h-4 w-4" />
				)}
			</Button>

			<div className="mx-auto mt-16 max-w-4xl">
				<h1 className="mb-12 text-center text-4xl font-bold text-gray-800">
					What would you like to write today?
				</h1>

				<div className="grid gap-8 md:grid-cols-3">
					<div className="rounded-lg bg-gray-50 p-6 shadow-md transition-shadow hover:shadow-lg">
						<FileText className="mb-4 h-12 w-12 text-black" />
						<h2 className="mb-2 text-xl font-semibold">
							Build New Presentation
						</h2>
						<p className="mb-4 text-gray-600">
							Start by creating a new presentation outline and storyboard.
						</p>
						<Button
							disabled={isCreating}
							variant="outline"
							className="w-full"
							onClick={() => {
								startCreating(async () => {
									try {
										const result = await createPresentationAction({});

										if (result.success) {
											router.push(`/home/ai/${result.id}/profile`);
											return;
										}

										throw new Error(
											"error" in result
												? String(result.error)
												: "Failed to create presentation",
										);
									} catch {
										// optional: surface toast later
									}
								});
							}}
						>
							{isCreating ? "Creating…" : "Get Started"}
						</Button>
					</div>

					<div className="rounded-lg bg-gray-50 p-6 shadow-md transition-shadow hover:shadow-lg">
						<Edit className="mb-4 h-12 w-12 text-black" />
						<h2 className="mb-2 text-xl font-semibold">
							Edit Existing Presentation
						</h2>
						<p className="mb-4 text-gray-600">
							Use our Canvas editor to refine your outline or storyboard.
						</p>
						<EditPresentationCombobox />
					</div>

					<div className="rounded-lg bg-gray-50 p-6 shadow-md transition-shadow hover:shadow-lg">
						<FilePresentation className="mb-4 h-12 w-12 text-black" />
						<h2 className="mb-2 text-xl font-semibold">Create Storyboard</h2>
						<p className="mb-4 text-gray-600">
							Create a storyboard for your presentation
						</p>
						<Link
							href="/home/ai/storyboard"
							className={buttonVariants({
								variant: "outline",
								className: "w-full",
							})}
						>
							Create Storyboard
						</Link>
					</div>

					<div className="rounded-lg bg-gray-50 p-6 shadow-md transition-shadow hover:shadow-lg">
						<FilePresentation className="mb-4 h-12 w-12 text-black" />
						<h2 className="mb-2 text-xl font-semibold">
							Generate your PowerPoint
						</h2>
						<p className="mb-4 text-gray-600">
							Generate a PowerPoint file from your storyboard.
						</p>
						<Combobox
							options={[
								{ label: "Outline 1", value: "1" },
								{ label: "Outline 2", value: "2" },
								{ label: "Outline 3", value: "3" },
							]}
							placeholder="Select an outline"
						/>
					</div>
				</div>
			</div>
		</main>
	);
}
