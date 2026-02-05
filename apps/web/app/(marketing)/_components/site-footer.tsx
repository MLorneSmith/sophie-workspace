import { cn } from "@kit/ui/utils";

import featureFlagsConfig from "~/config/feature-flags.config";

import { FooterLinkList } from "./site-footer-link-list";
import { FooterLogoSection } from "./site-footer-logo-section";

const PRODUCT_BASE = [
	{
		title: "Features",
		href: "/#features",
	},
	{
		title: "Pricing",
		href: "/#pricing",
	},
	{
		title: "AI Presentation Builder",
		href: "/#ai",
	},
	featureFlagsConfig.enableCourses
		? {
				title: "Course",
				href: "/#course",
			}
		: null,
	{
		title: "Coaching",
		href: "/#coaching",
	},
	{
		title: "FAQ",
		href: "/faq",
	},
	{
		title: "Documentation",
		href: "/documentation",
	},
	{
		title: "Support",
		href: "/support",
	},
] as const;

const PRODUCT = PRODUCT_BASE.filter(
	(item): item is NonNullable<typeof item> => item !== null,
);

const COMPANY = [
	{
		title: "About Us",
		href: "/about-us",
	},
	{
		title: "Terms of Service",
		href: "/tos",
	},
	{
		title: "Privacy Policy",
		href: "/privacy-policy",
	},
	{
		title: "Cookie Policy",
		href: "/cookie-policy",
	},
	{
		title: "Data Security Policy",
		href: "/data-security-policy",
	},
	{
		title: "Sitemap",
		href: "/sitemap",
	},
	{
		title: "Twitter / X",
		href: "/twitter",
	},
	{
		title: "LinkedIn",
		href: "/linkedin",
	},
	{
		title: "Discord",
		href: "/discord",
	},
	{
		title: "Newsletter",
		href: "/newsletter",
	},
	{
		title: "Contact",
		href: "/contact",
	},
] as const;

const RESOURCES = [
	{
		title: "Blog",
		href: "/blog",
	},
	{
		title: "Advanced Guide to McKinsey Presentations",
		href: "/resources/mckinsey-guide",
	},
	{
		title: "Pitch Decks & Funding Proposals",
		href: "/resources/pitch-decks",
	},
	{
		title: "Complete Guide to Business Charts",
		href: "/resources/business-charts",
	},
	{
		title: "Conquering Public Speaking Anxiety",
		href: "/resources/public-speaking",
	},
	{
		title: "The Best Presentation Tools",
		href: "/resources/presentation-tools",
	},
] as const;

const PROGRAMMATIC_SEO_PAGES = [
	{
		title: "Presentation Training in New York",
		href: "/training/new-york",
	},
	{
		title: "Presentation Training in Chicago",
		href: "/training/chicago",
	},
	{
		title: "Presentation Training in London",
		href: "/training/london",
	},
	{
		title: "Presentation Training in San Francisco",
		href: "/training/san-francisco",
	},
	{
		title: "Presentation Training in Los Angeles",
		href: "/training/los-angeles",
	},
	{
		title: "Presentation Training in Boston",
		href: "/training/boston",
	},
	{
		title: "Presentation Training in Toronto",
		href: "/training/toronto",
	},
	{
		title: "Presentation Training in Washington",
		href: "/training/washington",
	},
] as const;

export function SiteFooter() {
	return (
		<footer
			className={cn(
				"dark:bg-background border-t border-gray-200 bg-gray-50 dark:border-gray-800",
			)}
		>
			<div className="container py-8">
				<div
					className={cn("border-b border-gray-200 pb-6 dark:border-gray-800")}
				>
					<FooterLogoSection />
				</div>
				<div
					className={cn(
						"grid grid-cols-2 gap-8 border-b border-gray-200 py-8 md:grid-cols-4 dark:border-gray-800",
					)}
				>
					<FooterLinkList title="Product" items={PRODUCT} />
					<FooterLinkList title="Company" items={COMPANY} />
					<FooterLinkList title="Resources" items={RESOURCES} />
					<FooterLinkList
						title="Local Presentation Training"
						items={PROGRAMMATIC_SEO_PAGES}
					/>
				</div>

				<p className={cn("pt-6 text-sm text-gray-600 dark:text-gray-400")}>
					&copy; 2025 SlideHeroes Incorporated. All Rights Reserved.
				</p>
			</div>
		</footer>
	);
}
