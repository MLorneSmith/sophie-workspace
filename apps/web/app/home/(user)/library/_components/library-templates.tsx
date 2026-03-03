"use client";

import { Button } from "@kit/ui/button";
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
import { ExternalLink } from "lucide-react";
import Link from "next/link";

import type { Template } from "~/config/templates.config";

interface LibraryTemplatesProps {
	templates: Template[];
}

export function LibraryTemplates({ templates }: LibraryTemplatesProps) {
	return (
		<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{templates.map((template) => (
				<Sheet key={template.id}>
					<SheetTrigger asChild>
						<Card className="cursor-pointer transition-all hover:shadow-md">
							<div
								className="aspect-video w-full rounded-t-lg"
								style={{
									background: `linear-gradient(135deg, ${template.colors[0]} 0%, ${template.colors[1]} 100%)`,
								}}
							/>
							<CardHeader className="p-4">
								<CardTitle className="text-lg">{template.name}</CardTitle>
								<CardDescription className="line-clamp-2">
									{template.description}
								</CardDescription>
							</CardHeader>
							<CardContent className="p-4 pt-0">
								<div className="flex gap-1">
									{template.colors.map((color) => (
										<div
											key={color}
											className="h-6 w-6 rounded-full border border-border"
											style={{ backgroundColor: color }}
										/>
									))}
								</div>
							</CardContent>
						</Card>
					</SheetTrigger>
					<SheetContent className="w-full sm:max-w-lg">
						<SheetHeader>
							<SheetTitle>{template.name}</SheetTitle>
						</SheetHeader>
						<div className="mt-4 space-y-4">
							<div
								className="aspect-video w-full rounded-lg"
								style={{
									background: `linear-gradient(135deg, ${template.colors[0]} 0%, ${template.colors[1]} 100%)`,
								}}
							/>
							<p className="text-muted-foreground">{template.description}</p>
							<div className="flex items-center gap-2">
								<span className="text-sm font-medium">Colors:</span>
								<div className="flex gap-1">
									{template.colors.map((color) => (
										<div
											key={color}
											className="flex items-center gap-1 rounded-full border border-border px-2 py-1"
											style={{ backgroundColor: color }}
										>
											<span className="text-xs">{color}</span>
										</div>
									))}
								</div>
							</div>
							<Link href={`/home/ai?template=${template.id}`}>
								<Button className="w-full">
									<ExternalLink className="mr-2 h-4 w-4" />
									Use this template
								</Button>
							</Link>
						</div>
					</SheetContent>
				</Sheet>
			))}
		</div>
	);
}
