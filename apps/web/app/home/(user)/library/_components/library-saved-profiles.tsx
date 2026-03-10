"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@kit/ui/card";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@kit/ui/sheet";
import { Button } from "@kit/ui/button";
import { toast } from "@kit/ui/sonner";
import { Calendar, Trash2, RefreshCw, Library } from "lucide-react";
import { useTransition } from "react";

import { deleteSavedProfileAction } from "../_lib/server/saved-profiles-actions";

interface SavedProfile {
	id: string;
	name: string;
	person_name: string;
	company: string | null;
	last_used_at: string | null;
	last_refreshed_at: string | null;
	created_at: string;
}

interface LibrarySavedProfilesProps {
	profiles: SavedProfile[];
}

function formatDate(dateString: string) {
	return new Date(dateString).toLocaleDateString("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
}

function getDataFreshness(lastRefreshedAt: string | null): {
	label: string;
	color: string;
} {
	if (!lastRefreshedAt) {
		return { label: "Unknown", color: "text-muted-foreground" };
	}

	const days = Math.floor(
		(Date.now() - new Date(lastRefreshedAt).getTime()) / (1000 * 60 * 60 * 24),
	);

	if (days < 7) {
		return { label: "Fresh", color: "text-green-500" };
	} else if (days < 30) {
		return { label: `${days} days ago`, color: "text-yellow-500" };
	} else {
		return { label: `${days} days ago`, color: "text-red-500" };
	}
}

export function LibrarySavedProfiles({ profiles }: LibrarySavedProfilesProps) {
	return (
		<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{profiles.map((profile) => (
				<SavedProfileCard key={profile.id} profile={profile} />
			))}
		</div>
	);
}

function SavedProfileCard({ profile }: { profile: SavedProfile }) {
	const [isDeleting, startDeleting] = useTransition();
	const freshness = getDataFreshness(profile.last_refreshed_at);

	const handleDelete = () => {
		if (confirm("Are you sure you want to delete this saved profile?")) {
			startDeleting(async () => {
				try {
					await deleteSavedProfileAction({ profileId: profile.id });
					toast.success("Profile deleted");
					// Reload the page to refresh the list
					window.location.reload();
				} catch (error) {
					toast.error("Failed to delete profile", {
						description:
							error instanceof Error ? error.message : "Unknown error",
					});
				}
			});
		}
	};

	return (
		<Sheet>
			<SheetTrigger asChild>
				<Card className="cursor-pointer transition-all hover:shadow-md">
					<CardHeader className="pb-2">
						<div className="flex items-start justify-between">
							<CardTitle className="text-lg">{profile.name}</CardTitle>
							<Library className="size-4 text-muted-foreground" />
						</div>
						{profile.person_name && (
							<CardDescription>{profile.person_name}</CardDescription>
						)}
					</CardHeader>
					<CardContent>
						{profile.company && (
							<p className="text-sm text-muted-foreground">{profile.company}</p>
						)}
						<div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
							<div className="flex items-center gap-1">
								<Calendar className="h-3 w-3" />
								{formatDate(profile.created_at)}
							</div>
							<span className={freshness.color}>{freshness.label}</span>
						</div>
					</CardContent>
				</Card>
			</SheetTrigger>
			<SheetContent className="w-full sm:max-w-lg">
				<SheetHeader>
					<SheetTitle>{profile.name}</SheetTitle>
				</SheetHeader>
				<div className="mt-4 space-y-4">
					{profile.person_name && (
						<div>
							<h4 className="text-sm font-medium">Person</h4>
							<p className="text-muted-foreground">{profile.person_name}</p>
						</div>
					)}
					{profile.company && (
						<div>
							<h4 className="text-sm font-medium">Company</h4>
							<p className="text-muted-foreground">{profile.company}</p>
						</div>
					)}
					<div>
						<h4 className="text-sm font-medium">Created</h4>
						<p className="text-muted-foreground">
							{formatDate(profile.created_at)}
						</p>
					</div>
					{profile.last_used_at && (
						<div>
							<h4 className="text-sm font-medium">Last Used</h4>
							<p className="text-muted-foreground">
								{formatDate(profile.last_used_at)}
							</p>
						</div>
					)}
					<div>
						<h4 className="text-sm font-medium">Data Freshness</h4>
						<p className={freshness.color}>{freshness.label}</p>
					</div>

					<div className="flex gap-2 pt-4">
						<Button
							variant="outline"
							size="sm"
							className="flex-1"
							disabled
							title="Coming soon"
						>
							<RefreshCw className="mr-2 h-4 w-4" />
							Refresh Data
						</Button>
						<Button
							variant="outline"
							size="sm"
							className="text-destructive hover:text-destructive"
							onClick={handleDelete}
							disabled={isDeleting}
						>
							<Trash2 className="mr-2 h-4 w-4" />
							{isDeleting ? "Deleting..." : "Delete"}
						</Button>
					</div>
				</div>
			</SheetContent>
		</Sheet>
	);
}
