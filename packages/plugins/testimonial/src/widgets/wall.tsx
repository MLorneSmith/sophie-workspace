"use client";

import type { Tables } from "@kit/supabase/database";
import { Avatar, AvatarFallback, AvatarImage } from "@kit/ui/avatar";
import { Button } from "@kit/ui/button";
import { Card, CardContent, CardHeader } from "@kit/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@kit/ui/dialog";
import { If } from "@kit/ui/if";
import { Trans } from "@kit/ui/trans";
import { cn } from "@kit/ui/utils";
import { ExternalLinkIcon, PlayIcon, StarIcon } from "lucide-react";
import Link from "next/link";
import type React from "react";

import { TestimonialsDataProvider } from "./data-provider";

type Testimonial = Tables<"testimonials">;

interface TestimonialWallProps {
	testimonials: Testimonial[];
	header: string | React.ReactNode;
	layout?: "grid" | "masonry";
}

export function TestimonialWallWidget(props: {
	header?: string | React.ReactNode;
	layout?: "grid" | "masonry";
}) {
	return (
		<TestimonialsDataProvider>
			{({ data }) => (
				<WallWidget
					header={props.header}
					layout={props.layout}
					testimonials={data}
				/>
			)}
		</TestimonialsDataProvider>
	);
}

function WallWidget({
	testimonials,
	header,
	layout = "grid",
}: TestimonialWallProps) {
	return (
		<div className="container mx-auto flex flex-col space-y-12">
			<If
				condition={header}
				fallback={
					<Header>
						<Trans
							i18nKey={"testimonials:wallOfLove"}
							defaults={"Wall of Love"}
						/>
					</Header>
				}
			>
				<If condition={typeof header === "string"} fallback={header}>
					<Header>{header}</Header>
				</If>
			</If>

			<If condition={layout === "masonry"}>
				<MasonryWallWidget testimonials={testimonials} />
			</If>

			<If condition={layout === "grid"}>
				<GridWallWidget testimonials={testimonials} />
			</If>
		</div>
	);
}

function GridWallWidget({
	testimonials,
}: Pick<TestimonialWallProps, "testimonials">) {
	return (
		<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
			{testimonials.map((testimonial) => (
				<TestimonialCard key={testimonial.id} testimonial={testimonial} />
			))}
		</div>
	);
}

function MasonryWallWidget({
	testimonials,
}: Pick<TestimonialWallProps, "testimonials">) {
	const groups = testimonials.reduce<Testimonial[][]>((acc, testimonial) => {
		if (acc.length === 0) {
			return [[testimonial]];
		}

		const lastGroup = acc[acc.length - 1] ?? [];

		if (lastGroup.length < 4) {
			lastGroup.push(testimonial);
		} else {
			acc.push([testimonial]);
		}

		return acc;
	}, []);

	return (
		<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
			{groups.map((group, index) => (
				<div
					key={`testimonial-group-${index}-${group[0]?.id || index}`}
					className={"grid gap-4"}
				>
					{group.map((testimonial) => (
						<TestimonialCard key={testimonial.id} testimonial={testimonial} />
					))}
				</div>
			))}
		</div>
	);
}

function TestimonialCard({
	testimonial,
	maxLength,
}: {
	testimonial: Testimonial;
	maxLength?: number;
}) {
	return (
		<Card className="relative mb-4 flex h-full flex-col transition-shadow duration-300 hover:shadow-lg">
			<CardHeader className="flex flex-row items-center gap-4 space-y-0">
				<Avatar>
					<AvatarImage
						src={testimonial.customer_avatar_url ?? ""}
						alt={testimonial.customer_name}
					/>

					<AvatarFallback>
						{testimonial.customer_name.slice(0, 2).toUpperCase()}
					</AvatarFallback>
				</Avatar>

				<div className={"flex flex-col"}>
					<h3 className="text-lg font-semibold leading-tight">
						{testimonial.customer_name}
					</h3>

					{testimonial.customer_company_name && (
						<p className="text-muted-foreground text-sm leading-tight">
							{testimonial.customer_company_name}
						</p>
					)}
				</div>

				<If condition={testimonial.link}>
					<Button asChild variant={"link"}>
						<ExternalLink
							className={"absolute right-0 top-4 hover:underline"}
							link={testimonial.link || ""}
						>
							<ExternalLinkIcon className={"h-4"} />
						</ExternalLink>
					</Button>
				</If>
			</CardHeader>

			<CardContent className="flex flex-grow flex-col justify-between">
				{testimonial.video_url ? (
					<VideoTestimonial
						videoUrl={testimonial.video_url}
						customerName={testimonial.customer_name}
					/>
				) : (
					<TextTestimonial
						content={testimonial.content}
						externalLink={testimonial.link}
						maxLength={maxLength}
					/>
				)}
				<If condition={testimonial.rating}>
					<div className="mt-4 flex items-center">
						{Array.from({ length: 5 }).map((_, index) => (
							<StarIcon
								key={`star-${testimonial.id}-${index}`}
								className={`h-5 w-5 ${
									index < testimonial.rating
										? "text-yellow-400"
										: "text-gray-300"
								}`}
								fill="currentColor"
							/>
						))}
					</div>
				</If>
			</CardContent>
		</Card>
	);
}

function TextTestimonial({
	content,
	externalLink,
	maxLength = 200,
}: {
	content: string;
	externalLink?: string | null;
	maxLength?: number;
}) {
	if (content.length <= maxLength) {
		return (
			<p className="text-muted-foreground mb-4 italic">&quot;{content}&quot;</p>
		);
	}

	const Text = (
		<p className="text-muted-foreground mb-4 italic">
			&quot;{`${content.slice(0, maxLength)}...`}&quot;
		</p>
	);

	return (
		<>
			<If condition={externalLink} fallback={Text}>
				{(link) => <ExternalLink link={link}>{Text}</ExternalLink>}
			</If>
		</>
	);
}

function VideoTestimonial({
	videoUrl,
	customerName,
}: {
	videoUrl: string;
	customerName: string;
}) {
	return (
		<Dialog>
			<DialogTrigger asChild>
				<button
					type="button"
					className="group relative aspect-video w-full overflow-hidden rounded-md bg-gray-100"
				>
					<div className="absolute inset-0 flex items-center justify-center">
						<PlayIcon className="text-primary h-6 w-6 opacity-50 transition-opacity group-hover:opacity-100" />
					</div>

					<p className="absolute bottom-2 left-2 right-2 rounded bg-black bg-opacity-50 p-1 text-sm text-white">
						<Trans
							i18nKey={"testimonials:clickToPlay"}
							defaults={"Click to play video testimonial"}
						/>
					</p>
				</button>
			</DialogTrigger>

			<DialogContent className="w-full min-w-[650px] space-y-4 px-8 py-10 sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>
						<Trans
							i18nKey={"testimonials:videoTestimonialBy"}
							defaults={`Video testimonial by ${customerName}`}
							values={{ customerName }}
						/>
					</DialogTitle>
				</DialogHeader>

				<video
					src={videoUrl}
					controls
					className="min-h-[350px] w-full rounded-md"
				>
					<track kind="captions" />
					<Trans
						i18nKey={"testimonials:videoTagNotSupported"}
						defaults={"Your browser does not support the video tag."}
					/>
				</video>
			</DialogContent>
		</Dialog>
	);
}

function Header({ children }: { children: React.ReactNode }) {
	return (
		<h2 className="font-heading text-center text-5xl font-bold">{children}</h2>
	);
}

function ExternalLink(props: {
	link: string;
	className?: string;
	children: React.ReactNode;
}) {
	return (
		<Link
			className={cn(props.className, "hover:underline")}
			target={"_blank"}
			href={props.link}
		>
			{props.children}
		</Link>
	);
}
