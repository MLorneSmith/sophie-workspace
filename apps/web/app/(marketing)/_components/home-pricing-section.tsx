"use client";

import { useState, useMemo } from "react";
import { CheckCircle } from "lucide-react";
import { Badge } from "@kit/ui/badge";
import { Button } from "@kit/ui/button";
import { Switch } from "@kit/ui/switch";
import { Pill, SecondaryHero } from "@kit/ui/marketing";
import { cn } from "@kit/ui/utils";

import billingConfig from "~/config/billing.config";
import { homepageContentConfig } from "~/config/homepage-content.config";

import { GlassCard } from "./glass-card";

type Interval = "month" | "year";

export function HomePricingSection() {
	const [interval, setInterval] = useState<Interval>("month");
	const { pricing } = homepageContentConfig;
	const config = billingConfig;

	const savingsPercent = useMemo(() => {
		const product = config.products.find((p) => p.highlighted);
		if (!product) return 0;

		const monthlyPlan = product.plans.find((p) => p.interval === "month");
		const yearlyPlan = product.plans.find((p) => p.interval === "year");

		if (!monthlyPlan?.lineItems[0] || !yearlyPlan?.lineItems[0]) return 0;

		const monthlyAnnualized = monthlyPlan.lineItems[0].cost * 12;
		const yearlyTotal = yearlyPlan.lineItems[0].cost;

		return Math.round(
			((monthlyAnnualized - yearlyTotal) / monthlyAnnualized) * 100,
		);
	}, [config.products]);

	return (
		<div className="w-full">
			<SecondaryHero
				pill={<Pill>{pricing.pill}</Pill>}
				heading={
					<span className="text-h3 sm:text-h2 mb-8 text-center leading-snug sm:mb-12">
						{pricing.title}
					</span>
				}
				subheading={
					<p className="text-body sm:text-body-lg max-w-4xl leading-relaxed text-muted-foreground dark:text-muted-foreground">
						{pricing.subtitle}
					</p>
				}
			/>

			{/* Monthly/Annual Toggle */}
			<div className="mt-8 mb-10 flex items-center justify-center gap-3">
				<span
					className={cn(
						"text-sm font-medium transition-colors",
						interval === "month" ? "text-foreground" : "text-muted-foreground",
					)}
				>
					Monthly
				</span>
				<Switch
					checked={interval === "year"}
					onCheckedChange={(checked) => setInterval(checked ? "year" : "month")}
					aria-label="Toggle annual pricing"
				/>
				<span
					className={cn(
						"text-sm font-medium transition-colors",
						interval === "year" ? "text-foreground" : "text-muted-foreground",
					)}
				>
					Annual
				</span>
				{savingsPercent > 0 && (
					<Badge
						variant="outline"
						className="border-[var(--homepage-accent)]/30 bg-[var(--homepage-accent)]/10 text-[var(--homepage-accent)]"
					>
						Save {savingsPercent}%
					</Badge>
				)}
			</div>

			{/* Pricing Cards Grid */}
			<div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:gap-8">
				{config.products.map((product) => {
					const plan = product.plans.find((p) => p.interval === interval);
					const lineItem = plan?.lineItems[0];
					const isHighlighted = product.highlighted === true;

					return (
						<GlassCard
							key={product.id}
							variant={isHighlighted ? "featured" : "default"}
							glow={isHighlighted}
							className={cn(
								"relative flex flex-col transition-transform duration-300",
								isHighlighted && "z-10 scale-[1.02] md:scale-105",
							)}
						>
							{/* Most Popular Badge */}
							{isHighlighted && (
								<Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--homepage-accent)] text-white hover:bg-[var(--homepage-accent)]">
									Most Popular
								</Badge>
							)}

							{/* Product Header */}
							<div className="mb-6">
								<h3 className="text-lg font-semibold text-foreground">
									{product.name}
								</h3>
								<p className="mt-1 text-sm text-muted-foreground">
									{product.description}
								</p>
							</div>

							{/* Price */}
							<div className="mb-6">
								{lineItem ? (
									<div className="flex items-baseline gap-1">
										<span className="text-4xl font-bold text-foreground">
											${lineItem.cost}
										</span>
										<span className="text-sm text-muted-foreground">
											/{interval === "month" ? "mo" : "yr"}
										</span>
									</div>
								) : (
									<span className="text-4xl font-bold text-foreground">
										Contact us
									</span>
								)}
								{interval === "year" && lineItem && (
									<p className="mt-1 text-xs text-muted-foreground">
										${(lineItem.cost / 12).toFixed(2)}/mo billed annually
									</p>
								)}
							</div>

							{/* CTA Button */}
							<Button
								className={cn(
									"mb-6 min-h-[44px] w-full",
									isHighlighted &&
										"bg-[var(--homepage-accent)] text-white hover:bg-[var(--homepage-accent)]/90 motion-safe:animate-[glowPulse_3s_ease-in-out_infinite]",
								)}
								variant={isHighlighted ? "default" : "outline"}
								asChild
							>
								<a href="/auth/sign-up">
									{isHighlighted ? "Get Started" : "Start Free"}
								</a>
							</Button>

							{/* Feature List */}
							{product.features && product.features.length > 0 && (
								<ul className="flex flex-col gap-3 border-t border-[var(--homepage-border-subtle)] pt-6">
									{product.features.map((feature) => (
										<li key={feature} className="flex items-start gap-2.5">
											<CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--homepage-accent)]" />
											<span className="text-sm text-muted-foreground">
												{feature}
											</span>
										</li>
									))}
								</ul>
							)}
						</GlassCard>
					);
				})}
			</div>
		</div>
	);
}
