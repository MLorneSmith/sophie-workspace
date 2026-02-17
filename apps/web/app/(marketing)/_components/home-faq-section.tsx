"use client";

import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@kit/ui/accordion";

import { homepageContentConfig } from "~/config/homepage-content.config";

export function HomeFaqSection() {
	const { faq } = homepageContentConfig;

	return (
		<div className="w-full">
			<h2 className="text-h3 sm:text-h2 mb-10 text-center sm:mb-14">
				{faq.title}
			</h2>

			<div className="mx-auto max-w-3xl">
				<Accordion type="single" collapsible className="w-full">
					{faq.items.map((item) => (
						<AccordionItem key={item.question} value={item.question}>
							<AccordionTrigger className="text-left text-base font-medium">
								{item.question}
							</AccordionTrigger>
							<AccordionContent className="text-muted-foreground text-base leading-relaxed">
								{item.answer}
							</AccordionContent>
						</AccordionItem>
					))}
				</Accordion>
			</div>
		</div>
	);
}
