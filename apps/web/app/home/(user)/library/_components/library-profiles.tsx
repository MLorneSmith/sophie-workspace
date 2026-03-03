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
import { Calendar } from "lucide-react";

interface Profile {
	id: string;
	person_name: string;
	company: string | null;
	title: string | null;
	created_at: string;
}

interface LibraryProfilesProps {
	profiles: Profile[];
}

function formatDate(dateString: string) {
	return new Date(dateString).toLocaleDateString("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
}

export function LibraryProfiles({ profiles }: LibraryProfilesProps) {
	return (
		<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{profiles.map((profile) => (
				<Sheet key={profile.id}>
					<SheetTrigger asChild>
						<Card className="cursor-pointer transition-all hover:shadow-md">
							<CardHeader className="pb-2">
								<CardTitle className="text-lg">{profile.person_name}</CardTitle>
								{profile.title && (
									<CardDescription>{profile.title}</CardDescription>
								)}
							</CardHeader>
							<CardContent>
								{profile.company && (
									<p className="text-sm text-muted-foreground">
										{profile.company}
									</p>
								)}
								<div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
									<Calendar className="h-3 w-3" />
									{formatDate(profile.created_at)}
								</div>
							</CardContent>
						</Card>
					</SheetTrigger>
					<SheetContent className="w-full sm:max-w-lg">
						<SheetHeader>
							<SheetTitle>{profile.person_name}</SheetTitle>
						</SheetHeader>
						<div className="mt-4 space-y-4">
							{profile.title && (
								<div>
									<h4 className="text-sm font-medium">Title</h4>
									<p className="text-muted-foreground">{profile.title}</p>
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
						</div>
					</SheetContent>
				</Sheet>
			))}
		</div>
	);
}
