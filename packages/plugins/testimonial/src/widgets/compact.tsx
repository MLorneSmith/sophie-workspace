"use client";

import React from "react";

import type { Tables } from "@kit/supabase/database";
import { Avatar, AvatarFallback, AvatarImage } from "@kit/ui/avatar";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@kit/ui/tooltip";
import { Trans } from "@kit/ui/trans";

import { TestimonialsDataProvider } from "./data-provider";

type Testimonial = Tables<"testimonials">;

interface CompactTestimonialWidgetProps {
	testimonials: Testimonial[];
	count: number;
}

export function CompactTestimonialWidget() {
	return (
		<TestimonialsDataProvider limit={5}>
			{({ data, count }) => <CompactWidget testimonials={data} count={count} />}
		</TestimonialsDataProvider>
	);
}

function CompactWidget({ testimonials, count }: CompactTestimonialWidgetProps) {
	const displayedTestimonials = testimonials.slice(0, 5);
	const remainingCount = count - displayedTestimonials.length;

	return (
		<TooltipProvider>
			<div className="flex items-center space-x-1">
				{displayedTestimonials.map((testimonial, index) => (
					<Tooltip key={testimonial.id}>
						<TooltipTrigger>
							<Avatar
								className={`h-8 w-8 ${index !== 0 ? "-ml-3" : ""} border-2 border-white`}
							>
								<AvatarImage
									src={testimonial.customer_avatar_url ?? ""}
									alt={testimonial.customer_name}
								/>

								<AvatarFallback>
									{testimonial.customer_name.slice(0, 2).toUpperCase()}
								</AvatarFallback>
							</Avatar>
						</TooltipTrigger>

						<TooltipContent>
							<p>{testimonial.customer_name}</p>
						</TooltipContent>
					</Tooltip>
				))}

				{remainingCount > 0 && (
					<Tooltip>
						<TooltipTrigger>
							<div className="bg-primary text-primary-foreground -ml-3 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-xs font-medium">
								+{remainingCount}
							</div>
						</TooltipTrigger>

						<TooltipContent>
							<p>
								<Trans
									i18nKey={"testimonials:moreTestimonials"}
									defaults={"more testimonials"}
									values={{ count: remainingCount }}
								/>
							</p>
						</TooltipContent>
					</Tooltip>
				)}
			</div>
		</TooltipProvider>
	);
}
