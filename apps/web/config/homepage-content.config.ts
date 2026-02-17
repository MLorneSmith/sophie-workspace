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
	| "Rocket"
	| "Award"
	| "ShieldCheck";

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
		iconName: "Sparkles",
		size: "large",
	},
	{
		title: "Proven Methodology",
		description: "AI is automating a proven presentation development approach.",
		iconName: "Target",
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
		iconName: "Award",
		size: "large",
	},
	{
		title: "Private Coaching",
		description:
			"Our one-on-one coaching delivers high touch, custom feedback and support.",
		iconName: "UserCircle",
		size: "large",
	},
	{
		title: "30-Day Money-Back Guarantee",
		description:
			"Cancel anytime in your first 30 days and receive a full refund.",
		iconName: "ShieldCheck",
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
		title: "What Makes SlideHeroes Different?",
		subtitle:
			"Unique features that set us apart from traditional presentation tools",
		cards: featureCards,
	},
	testimonials: {
		title: "What our users",
		titleMuted: "are saying",
		subtitle:
			"Hear from consultants, strategists, and freelancers who transformed how they build presentations",
		categories: [
			{
				label: "Boutique Consultancies",
				value: "boutique",
				testimonials: [
					{
						name: "Rachel Wei",
						role: "Managing Partner",
						company: "Apex Strategy Group",
						logo: "/images/logos/testimonials/apex-strategy-group.svg",
						content:
							"We went from spending two full days on a pitch deck to having a polished first draft in under an hour. The AI understands consulting frameworks natively.",
						highlights: [
							"polished first draft in under an hour",
							"understands consulting frameworks natively",
						],
					},
					{
						name: "James Okafor",
						role: "Senior Consultant",
						company: "Northbridge Advisory",
						logo: "/images/logos/testimonials/northbridge-advisory.svg",
						content:
							"Our four-person team now produces client-ready decks that rival what Big Four firms deliver. SlideHeroes leveled the playing field for us.",
						highlights: [
							"client-ready decks that rival what Big Four firms deliver",
						],
					},
					{
						name: "Anna Lindström",
						role: "Founder",
						company: "Clarion Consulting",
						logo: "/images/logos/testimonials/clarion-consulting.svg",
						content:
							"The structured methodology is what sold me. SCQ frameworks, MECE logic trees — it is all built in. My clients notice the difference immediately.",
						highlights: [
							"SCQ frameworks, MECE logic trees",
							"notice the difference immediately",
						],
					},
				],
			},
			{
				label: "Corporate Strategy Teams",
				value: "corporate",
				testimonials: [
					{
						name: "David Park",
						role: "VP of Strategy",
						company: "Meridian Financial",
						logo: "/images/logos/testimonials/meridian-financial.svg",
						content:
							"We rolled this out to 40 strategists and saw a 60% reduction in deck prep time. Brand consistency across the team improved overnight.",
						highlights: [
							"60% reduction in deck prep time",
							"Brand consistency across the team improved overnight",
						],
					},
					{
						name: "Isabelle Moreau",
						role: "Director of Corporate Development",
						company: "Vantage Industries",
						logo: "/images/logos/testimonials/vantage-industries.svg",
						content:
							"Board presentations used to take a week of back-and-forth. Now our executive team self-serves with confidence. The time savings are enormous.",
						highlights: ["executive team self-serves with confidence"],
					},
					{
						name: "Marcus Chen",
						role: "Chief of Staff",
						company: "Atlas Health Group",
						logo: "/images/logos/testimonials/atlas-health-group.svg",
						content:
							"SlideHeroes became the standard tool for our quarterly business reviews. The collaboration features keep everyone aligned without endless email chains.",
						highlights: [
							"standard tool for our quarterly business reviews",
							"everyone aligned",
						],
					},
				],
			},
			{
				label: "Freelancers",
				value: "freelancers",
				testimonials: [
					{
						name: "Sophie Tanaka",
						role: "Independent Brand Strategist",
						company: "Self-employed",
						logo: "/images/logos/testimonials/independent.svg",
						content:
							"As a solo freelancer, I need to look like a full agency. SlideHeroes gives me that polish without the overhead. It paid for itself on the first project.",
						highlights: [
							"look like a full agency",
							"paid for itself on the first project",
						],
					},
					{
						name: "Liam Gallagher",
						role: "Freelance Pitch Consultant",
						company: "Self-employed",
						logo: "/images/logos/testimonials/independent.svg",
						content:
							"I juggle five to six clients a week across wildly different industries. The AI adapts to each brief instantly — startup pitch decks, nonprofit annual reports, you name it.",
						highlights: ["adapts to each brief instantly"],
					},
					{
						name: "Priya Sharma",
						role: "Freelance Management Consultant",
						company: "Self-employed",
						logo: "/images/logos/testimonials/independent.svg",
						content:
							"I used to outsource slide design and wait days for revisions. Now I handle everything in-house and deliver faster than agencies twice my size.",
						highlights: [
							"handle everything in-house",
							"deliver faster than agencies twice my size",
						],
					},
				],
			},
		],
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
	faq: {
		title: "Frequently Asked Questions",
		items: [
			{
				question: "How does the AI know how to structure my presentation?",
				answer:
					"SlideHeroes is fine-tuned on proven consulting frameworks like SCQ, MECE, and the Pyramid Principle. When you provide your brief, the AI applies the most appropriate framework to create a logical narrative structure — the same methodologies used by McKinsey, BCG, and top investment banks.",
			},
			{
				question: "Can I use SlideHeroes for different types of presentations?",
				answer:
					"Absolutely. SlideHeroes works for board presentations, pitch decks, quarterly business reviews, sales proposals, funding rounds, and more. The AI adapts its approach based on your audience, objective, and industry context.",
			},
			{
				question: "Do I need design skills to create professional slides?",
				answer:
					"Not at all. SlideHeroes handles the visual design for you with professionally designed templates and layouts. You focus on your message and content — the platform ensures it looks polished and client-ready.",
			},
			{
				question:
					"How is SlideHeroes different from generic AI tools like ChatGPT?",
				answer:
					"Generic AI tools produce generic output. SlideHeroes is purpose-built for presentations with a fine-tuned model that understands slide structure, visual hierarchy, data visualization, and narrative flow. It also includes expert video training and private coaching that no general-purpose tool offers.",
			},
			{
				question: "Is my data secure?",
				answer:
					"Yes. All data is encrypted in transit and at rest. We never use your content to train our models. Enterprise customers can opt for dedicated infrastructure with additional compliance certifications including SOC 2 and GDPR.",
			},
			{
				question: "Can my team collaborate on presentations?",
				answer:
					"Yes. Team plans include shared workspaces, brand template libraries, and real-time collaboration. Admins can manage permissions, enforce brand consistency, and track usage across the organization.",
			},
			{
				question: "What if I'm not satisfied?",
				answer:
					"We offer a 30-day money-back guarantee on all plans. If SlideHeroes doesn't meet your expectations, contact us within 30 days for a full refund — no questions asked.",
			},
		],
	},
	pricing: {
		title: "Simple, transparent pricing",
		subtitle:
			"Choose the plan that fits your needs. Upgrade or downgrade anytime.",
		pill: "No credit card required to start",
	},
};
