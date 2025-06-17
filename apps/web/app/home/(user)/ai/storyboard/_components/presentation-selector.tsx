"use client";

import { useSupabase } from "@kit/supabase/hooks/use-supabase";
import { Button } from "@kit/ui/button";
import { Card } from "@kit/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@kit/ui/select";
import { Skeleton } from "@kit/ui/skeleton";
import { useEffect, useState } from "react";

interface Presentation {
	id: string;
	title: string;
	created_at: string | null;
}

interface PresentationSelectorProps {
	onSelect: (id: string) => void;
}

export function PresentationSelector({ onSelect }: PresentationSelectorProps) {
	const supabase = useSupabase();
	const [presentations, setPresentations] = useState<Presentation[]>([]);
	const [selectedId, setSelectedId] = useState<string>("");
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		async function fetchPresentations() {
			try {
				setIsLoading(true);
				const { data, error } = await supabase
					.from("building_blocks_submissions")
					.select("id, title, created_at")
					.order("created_at", { ascending: false });

				if (error) {
					throw error;
				}

				setPresentations(data || []);
			} catch (err) {
				// TODO: Async logger needed
				// TODO: Async logger needed
				// (await getLogger()).error(
				// 	"Error fetching presentations:",
				// 	{ data: err }
				// );
				setError("Failed to load presentations");
			} finally {
				setIsLoading(false);
			}
		}

		fetchPresentations();
	}, [supabase]);

	const handleSelect = (id: string) => {
		setSelectedId(id);
	};

	const handleContinue = () => {
		if (selectedId) {
			onSelect(selectedId);
		}
	};

	if (isLoading) {
		return (
			<Card className="p-6">
				<div className="space-y-4">
					<Skeleton className="h-8 w-full" />
					<Skeleton className="h-10 w-full" />
					<Skeleton className="h-10 w-1/3" />
				</div>
			</Card>
		);
	}

	if (error) {
		return (
			<Card className="p-6">
				<div className="text-center">
					<p className="text-destructive mb-4">{error}</p>
					<Button onClick={() => window.location.reload()} variant="secondary">
						Try Again
					</Button>
				</div>
			</Card>
		);
	}

	if (presentations.length === 0) {
		return (
			<Card className="p-6">
				<div className="text-center">
					<p className="mb-4">No presentations found.</p>
					<p className="text-muted-foreground">
						Create a presentation in the AI Outline Builder first.
					</p>
				</div>
			</Card>
		);
	}

	return (
		<Card className="p-6">
			<div className="space-y-6">
				<div>
					<h3 className="mb-2 text-lg font-medium">Select a Presentation</h3>
					<p className="text-muted-foreground">
						Choose an existing presentation to create a storyboard
					</p>
				</div>

				<Select value={selectedId} onValueChange={handleSelect}>
					<SelectTrigger className="w-full">
						<SelectValue placeholder="Select a presentation" />
					</SelectTrigger>
					<SelectContent>
						{presentations.map((presentation) => (
							<SelectItem key={presentation.id} value={presentation.id}>
								{presentation.title || "Untitled Presentation"}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<Button
					onClick={handleContinue}
					disabled={!selectedId}
					className="w-full"
				>
					Continue
				</Button>
			</div>
		</Card>
	);
}
