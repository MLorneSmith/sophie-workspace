type IconType = "presentation" | "chart" | "sparkles" | "book";
type BlogType = "Guide" | "Tutorial";
export type IconName =
	| "Brain"
	| "Presentation"
	| "BookOpen"
	| "LayoutDashboard"
	| "Sparkles"
	| "BarChart3"
	| "UserCircle"
	| "Target"
	| "Layers"
	| "GitBranch"
	| "LayoutPanelTop"
	| "Rocket";

interface BlogPost {
	title: string;
	description: string;
	iconType: IconType;
	blogType: BlogType;
	readTimeMinutes: number;
	categoryBadge?: string;
	thumbnailSrc?: string;
}

interface StickyContentItem {
	title: string;
	description: string[];
	imageSrc: string;
	overline: string;
	deviceFrame?: boolean;
}

export interface StatisticItem {
	value: string;
	label: string;
	suffix?: string;
	prefix?: string;
}

export interface HowItWorksStep {
	stepNumber: number;
	title: string;
	description: string;
	iconName: IconName;
}

export interface HowItWorksConfig {
	title: string;
	subtitle: string;
	steps: HowItWorksStep[];
}

export interface ComparisonItem {
	text: string;
	included: boolean;
}

export interface LogoCloudConfig {
	heading: string;
	marqueeSpeed: number;
}

export interface FinalCtaConfig {
	headline: string;
	subheadline: string;
	primaryCta: { label: string; href: string };
	secondaryCta: { label: string; href: string };
	trustBadges: string[];
}

export interface FeatureCard {
	title: string;
	description: string;
	iconName: IconName;
	size: "large" | "standard";
}

const statisticsContent: StatisticItem[] = [
	{
		value: "2,000",
		label: "Professionals trained",
		suffix: "+",
	},
	{
		value: "50,000",
		label: "Presentations created",
		suffix: "+",
	},
	{
		value: "4.9",
		label: "Average rating",
		suffix: "/5",
	},
	{
		value: "85",
		label: "Time saved on average",
		suffix: "%",
	},
];

const howItWorksSteps: HowItWorksStep[] = [
	{
		stepNumber: 1,
		title: "Profile",
		description:
			"Identify, research and consider how we ensure the needs of our audience take center stage",
		iconName: "Target",
	},
	{
		stepNumber: 2,
		title: "Assemble",
		description:
			"Gather your key messages, data points, and supporting evidence into a structured brief.",
		iconName: "Layers",
	},
	{
		stepNumber: 3,
		title: "Outline",
		description:
			"AI generates a logical narrative structure using proven frameworks like SCQ and MECE.",
		iconName: "GitBranch",
	},
	{
		stepNumber: 4,
		title: "Storyboard",
		description:
			"Transform your outline into a visual storyboard with slide-by-slide recommendations.",
		iconName: "LayoutPanelTop",
	},
	{
		stepNumber: 5,
		title: "Generate",
		description:
			"Export polished slides ready for your next high-stakes meeting or pitch.",
		iconName: "Rocket",
	},
];

export interface ComparisonConfig {
	title: string;
	subtitle: string;
	withoutItems: ComparisonItem[];
	withItems: ComparisonItem[];
}

const comparisonContent: ComparisonConfig = {
	title: "Why SlideHeroes?",
	subtitle:
		"See the difference between struggling with presentations and having the right tools",
	withoutItems: [
		{ text: "Hours spent staring at blank slides", included: false },
		{ text: "Inconsistent messaging across decks", included: false },
		{ text: "No structured methodology", included: false },
		{
			text: "Generic AI that doesn't understand presentations",
			included: false,
		},
		{ text: "Trial and error with slide design", included: false },
	],
	withItems: [
		{ text: "AI-powered first draft in minutes", included: true },
		{ text: "Consistent, compelling narrative structure", included: true },
		{ text: "Proven frameworks (SCQ, MECE, Pyramid)", included: true },
		{ text: "Fine-tuned AI built for presentations", included: true },
		{ text: "Expert coaching and video training", included: true },
	],
};

const finalCtaContent: FinalCtaConfig = {
	headline: "Ready to create presentations that win?",
	subheadline:
		"Join thousands of professionals who deliver high-impact presentations with confidence.",
	primaryCta: { label: "Get Started Free", href: "/auth/sign-up" },
	secondaryCta: { label: "See How It Works", href: "#how-it-works" },
	trustBadges: [
		"No credit card required",
		"30-day money-back guarantee",
		"Cancel anytime",
	],
};

const featureCards: FeatureCard[] = [
	{
		title: "Fine-tuned AI",
		description:
			"AI tailored to the task of creating high-quality presentation content.",
		iconName: "Brain",
		size: "large",
	},
	{
		title: "Proven Methodology",
		description: "AI is automating a proven presentation development approach.",
		iconName: "Presentation",
		size: "standard",
	},
	{
		title: "Instant Access",
		description:
			"Online video lessons available 24/7 for maximum convenience. Self-paced lessons provide complete flexibility.",
		iconName: "BookOpen",
		size: "standard",
	},
	{
		title: "Certification",
		description:
			"Earn presentation excellence Certification. Share achievements on LinkedIn.",
		iconName: "LayoutDashboard",
		size: "standard",
	},
	{
		title: "Private Coaching",
		description:
			"Our one-on-one coaching delivers high touch, custom feedback and support.",
		iconName: "Sparkles",
		size: "large",
	},
	{
		title: "30-Day Money-Back Guarantee",
		description:
			"Cancel anytime in your first 30 days and receive a full refund.",
		iconName: "BarChart3",
		size: "standard",
	},
];

export interface HeroConfig {
	title: string;
	subtitle: string;
	pillText: string;
	ctaPrimary: { label: string; href: string };
	ctaSecondary: { label: string; href: string };
	socialProof: { avatarCount: number; label: string };
}

export const homepageContentConfig = {
	statistics: statisticsContent,
	howItWorks: {
		title: "From Brief to Boardroom in 5 Steps",
		subtitle:
			"A proven workflow for creating presentations that convince the C-Suite and close the toughest deals",
		steps: howItWorksSteps,
	} satisfies HowItWorksConfig,
	comparison: comparisonContent,
	finalCta: finalCtaContent,
	logoCloud: {
		heading: "Trusted by professionals at",
		marqueeSpeed: 30,
	} satisfies LogoCloudConfig,
	productPreview: {
		src: "/images/video-hero-preview.avif",
		alt: "SlideHeroes AI-powered presentation canvas",
		title: "SlideHeroes Canvas",
	},
	hero: {
		title: "Build better presentations, faster",
		subtitle:
			"SlideHeroes is the AI presentation platform trusted by consultants and executives. Write faster with structured frameworks, expert video training, and private coaching.",
		pillText: "AI Presentation Platform",
		ctaPrimary: { label: "Start Writing Free", href: "/auth/sign-up" },
		ctaSecondary: { label: "Watch Demo", href: "#product-preview" },
		socialProof: { avatarCount: 5, label: "Join 2,000+ professionals" },
	} satisfies HeroConfig,
	sticky: {
		title: "AI Writing Tools, Expert Training & Private Coaching",
		subtitle:
			"Comprehensive tools and training to elevate your presentation skills",
		content: [
			{
				title: "AI-Powered writing canvas",
				description: [
					"AI writing canvas that helps you think faster",
					"Fine-tuned, task-specific AI for corporate, consulting and sales professionals",
					"Automates use of proven, structured methodologies favoured by McKinsey, Google and top investment banks (SCQ, MECE, abstractions)",
				],
				imageSrc: "/images/video-hero-preview.avif",
				overline: "01 / 03",
				deviceFrame: true,
			},
			{
				title: "Web's premium online training program",
				description: [
					"Learn proven techniques to convince C-Suite executives",
					"Expert training for high-stakes meetings that goes beyond public speaking, leveraging logical structure, story, data visualization, and the fundamentals of design.",
					"Develop compelling business cases",
					"Practice with real-world examples and case studies",
				],
				imageSrc: "/images/course-chapters.webp",
				overline: "02 / 03",
				deviceFrame: true,
			},
			{
				title: "One-to-One Coaching",
				description: [
					"Get personalized feedback on your presentations",
					"Build confidence through expert guidance",
					"Learn advanced presentation techniques",
					"Prepare for high-stakes meetings and pitches",
				],
				imageSrc: "/images/team-life.webp",
				overline: "03 / 03",
				deviceFrame: false,
			},
		] as StickyContentItem[],
	},
	features: {
		title: "What Makes SlideHeroes Different",
		subtitle:
			"Unique features that set us apart from traditional presentation tools",
		cards: featureCards,
	},
	testimonials: {
		title: "Trusted by Professionals Worldwide",
		subtitle:
			"Hear from the people who use SlideHeroes to deliver high-impact presentations every day",
	},
	essentialReads: {
		title: "Go Deeper, Learn Faster",
		subtitle:
			"Expert insights and practical guides to master presentation excellence",
		posts: [
			{
				title: "Advanced Guide to McKinsey-style Business Presentations",
				description:
					"The ultimate guide to writing clear concise, and convincing business presentations. Our 10,000 word manifesto.",
				iconType: "presentation" as IconType,
				blogType: "Guide" as BlogType,
				readTimeMinutes: 15,
				categoryBadge: "Strategy",
				thumbnailSrc: "/images/posts/brainstorming.webp",
			},
			{
				title: "Pitch Decks & Funding Proposals",
				description:
					"The consensus view from the world's leading venture capitalists on what you need in your funding pitch.",
				iconType: "chart" as IconType,
				blogType: "Tutorial" as BlogType,
				readTimeMinutes: 12,
				categoryBadge: "Product Launch",
				thumbnailSrc: "/images/posts/indie-hacker.webp",
			},
			{
				title: "Presentation Teardown: BCG Presentation Review",
				description:
					"A 'teardown' of a presentation from Boston Consulting Group, exploring what it does well and finding areas where there is room for improvement.",
				iconType: "sparkles" as IconType,
				blogType: "Guide" as BlogType,
				readTimeMinutes: 18,
				categoryBadge: "Technology",
				thumbnailSrc: "/images/posts/saas-starter-blog-post.webp",
			},
		] as BlogPost[],
	},
	pricing: {
		title: "Simple, transparent pricing",
		subtitle:
			"Choose the plan that fits your needs. Upgrade or downgrade anytime.",
		pill: "No credit card required to start",
	},
};
