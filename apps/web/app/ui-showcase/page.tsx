"use client";

// UI Components
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@kit/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@kit/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@kit/ui/avatar";
import { Badge } from "@kit/ui/badge";
import { Button } from "@kit/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@kit/ui/card";
import { Checkbox } from "@kit/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@kit/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@kit/ui/dropdown-menu";
import {
	EmptyState,
	EmptyStateButton,
	EmptyStateHeading,
	EmptyStateText,
} from "@kit/ui/empty-state";
import { Input } from "@kit/ui/input";
import { Label } from "@kit/ui/label";
// Marketing Components
import {
	CtaButton,
	Header,
	Hero,
	Pill,
	PillActionButton,
} from "@kit/ui/marketing";
// Utility Components
import { ModeToggle } from "@kit/ui/mode-toggle";
import { ProfileAvatar } from "@kit/ui/profile-avatar";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@kit/ui/select";
import { Separator } from "@kit/ui/separator";
// Sidebar Provider
import { SidebarProvider } from "@kit/ui/shadcn-sidebar";
import { Spinner } from "@kit/ui/spinner";
import { Switch } from "@kit/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@kit/ui/tabs";
import { Textarea } from "@kit/ui/textarea";
import { Trans } from "@kit/ui/trans";
import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
/**
 * UI Components Showcase Page
 *
 * This page serves as a comprehensive showcase of all UI components available in the SaaS kit.
 * It's organized into tabs for different component categories to make it easier to browse and test.
 *
 * Purpose:
 * - Provides a visual reference for all available UI components
 * - Allows developers to see how components look with different props and variants
 * - Serves as documentation for how to use each component
 * - Makes it easier to test and tweak the design system
 *
 * Structure:
 * - Components: Basic UI components like buttons, cards, forms, etc.
 * - Marketing: Components used for marketing pages like hero sections, feature showcases
 * - Navigation: Header, footer, and navigation components
 * - Colors: Color palette showcase
 * - Typography: Text styles and headings
 */
import { useEffect, useId, useState } from "react";
// App Components
import { AppLogo } from "~/components/app-logo";
import { SiteFooter } from "../(marketing)/_components/site-footer";
// Site Navigation Components
import { SiteNavigation } from "../(marketing)/_components/site-navigation";
import { SitePageHeader } from "../(marketing)/_components/site-page-header";
import { BlogPagination } from "../(marketing)/blog/_components/blog-pagination";
import { PostHeader } from "../(marketing)/blog/_components/post-header";
// Blog Components
import { PostPreview } from "../(marketing)/blog/_components/post-preview";
// Docs Components
import { DocsCard } from "../(marketing)/docs/_components/docs-card";
import { DocsPageLink } from "../(marketing)/docs/_components/docs-page-link";
import { DocsTableOfContents } from "../(marketing)/docs/_components/docs-table-of-contents";
// Admin Components
import { AdminSidebar } from "../admin/_components/admin-sidebar";
import { HomeMenuNavigation } from "../home/(user)/_components/home-menu-navigation";
import { HomeLayoutPageHeader } from "../home/(user)/_components/home-page-header";
// Home Components
import { HomeSidebar } from "../home/(user)/_components/home-sidebar";
import type { UserWorkspace } from "../home/(user)/_lib/server/load-user-workspace";

/**
 * Type definitions for navigation items to ensure type safety
 */
type NavigationItem = {
	path: string;
	label: string;
};

/**
 * Sample navigation items for demonstration
 */
const _navigationItems: NavigationItem[] = [
	{ path: "/blog", label: "Blog" },
	{ path: "/docs", label: "Documentation" },
	{ path: "/pricing", label: "Pricing" },
	{ path: "/faq", label: "FAQ" },
	{ path: "/contact", label: "Contact" },
];

// Client-only wrapper component
function ClientOnly({ children }: { children: React.ReactNode }) {
	const [isMounted, setIsMounted] = useState(false);

	useEffect(() => {
		setIsMounted(true);
	}, []);

	if (!isMounted) {
		return null;
	}

	return <>{children}</>;
}

/**
 * UI Showcase Page Component
 *
 * This component renders a tabbed interface showcasing all UI components
 * available in the SaaS kit.
 */
export default function UIShowcasePage() {
	// Unique IDs for form elements
	const nameInputId = useId();
	const emailInputId = useId();
	const inputExampleId = useId();
	const textareaExampleId = useId();
	const selectExampleId = useId();
	const termsCheckboxId = useId();
	const airplaneModeId = useId();

	// State for dialog demonstration
	const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

	// State for sidebar visibility
	const [isAdminSidebarVisible, setIsAdminSidebarVisible] =
		useState<boolean>(false);
	const [isHomeSidebarVisible, setIsHomeSidebarVisible] =
		useState<boolean>(false);

	// Mock data for components that require it
	const mockPost: import("@kit/cms").Cms.ContentItem = {
		id: "1",
		title: "Sample Blog Post",
		label: "Sample Blog Post",
		url: "/blog/sample-blog-post",
		slug: "sample-blog-post",
		// Setting image to null to avoid Next.js image domain restrictions
		image: undefined,
		publishedAt: new Date().toISOString(),
		description:
			"This is a sample blog post description for demonstration purposes.",
		content: {},
		status: "published",
		categories: [],
		tags: [],
		order: 0,
		children: [],
		parentId: undefined,
	};

	const mockDocsLink = {
		url: "/docs/getting-started",
		label: "Read Documentation",
	};

	// Mock user workspace for home components
	const mockUserWorkspace: UserWorkspace = {
		workspace: {
			id: "1",
			name: "Personal Account",
			picture_url: null,
			subscription_status: "active",
		},
		user: {
			id: "123",
			email: "user@example.com",
			role: "user",
			app_metadata: {
				role: "user",
			},
			factors: [],
		} as any,
		accounts: [
			{
				label: "Personal Account",
				value: "1",
				image: null,
			},
		],
	};

	// Mock data for docs table of contents
	const mockDocsNavItems = [
		{
			text: "Introduction",
			level: 1,
			href: "#section-1",
			children: [],
		},
		{
			text: "Getting Started",
			level: 1,
			href: "#section-2",
			children: [
				{
					text: "Installation",
					level: 2,
					href: "#section-3",
					children: [],
				},
				{
					text: "Configuration",
					level: 2,
					href: "#section-4",
					children: [],
				},
			],
		},
		{
			text: "Advanced Usage",
			level: 1,
			href: "#section-5",
			children: [],
		},
	];

	return (
		<ClientOnly>
			<div className="container mx-auto space-y-10 py-10">
				<div className="flex items-center justify-between">
					<h1 className="text-3xl font-bold">UI Components Showcase</h1>
					<ModeToggle />
				</div>

				<Tabs defaultValue="components" className="w-full">
					<TabsList className="grid w-full grid-cols-5">
						<TabsTrigger value="components">Components</TabsTrigger>
						<TabsTrigger value="marketing">Marketing</TabsTrigger>
						<TabsTrigger value="navigation">Navigation</TabsTrigger>
						<TabsTrigger value="colors">Colors</TabsTrigger>
						<TabsTrigger value="typography">Typography</TabsTrigger>
					</TabsList>

					{/* Basic UI Components Tab */}
					<TabsContent value="components" className="mt-6 space-y-8">
						{/* Buttons Section */}
						<ComponentSection
							title="Buttons"
							description="Buttons allow users to trigger an action or event with a single click."
						>
							<div className="flex flex-wrap gap-4">
								<Button>Default</Button>
								<Button variant="secondary">Secondary</Button>
								<Button variant="destructive">Destructive</Button>
								<Button variant="outline">Outline</Button>
								<Button variant="ghost">Ghost</Button>
								<Button variant="link">Link</Button>
								<Button disabled>Disabled</Button>
								<Button>
									<Spinner className="mr-2 h-4 w-4" />
									Loading
								</Button>
							</div>
						</ComponentSection>

						<Separator />

						{/* Cards Section */}
						<ComponentSection
							title="Cards"
							description="Cards are used to group related content and actions."
						>
							<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
								<Card>
									<CardHeader>
										<CardTitle>Card Title</CardTitle>
										<CardDescription>Card Description</CardDescription>
									</CardHeader>
									<CardContent>
										<p>Card content goes here.</p>
									</CardContent>
									<CardFooter>
										<Button>Action</Button>
									</CardFooter>
								</Card>

								<Card>
									<CardHeader>
										<CardTitle>Interactive Card</CardTitle>
										<CardDescription>With form elements</CardDescription>
									</CardHeader>
									<CardContent className="space-y-4">
										<div className="space-y-2">
											<Label htmlFor={nameInputId}>Name</Label>
											<Input id={nameInputId} placeholder="Enter your name" />
										</div>
										<div className="space-y-2">
											<Label htmlFor={emailInputId}>Email</Label>
											<Input
												id={emailInputId}
												type="email"
												placeholder="Enter your email"
											/>
										</div>
									</CardContent>
									<CardFooter className="flex justify-between">
										<Button variant="ghost">Cancel</Button>
										<Button>Submit</Button>
									</CardFooter>
								</Card>

								<Card>
									<CardHeader>
										<CardTitle>Notification</CardTitle>
										<CardDescription>You have a new message</CardDescription>
									</CardHeader>
									<CardContent>
										<div className="flex items-center space-x-4">
											<Avatar>
												<AvatarImage src="https://github.com/shadcn.png" />
												<AvatarFallback>CN</AvatarFallback>
											</Avatar>
											<div>
												<p className="font-medium">John Doe</p>
												<p className="text-muted-foreground text-sm">
													Hey, how are you doing?
												</p>
											</div>
										</div>
									</CardContent>
									<CardFooter>
										<Button variant="outline" className="w-full">
											View Message
										</Button>
									</CardFooter>
								</Card>
							</div>
						</ComponentSection>

						{/* Continue with other component sections... */}
						<Separator />

						{/* Form Elements Section */}
						<ComponentSection
							title="Form Elements"
							description="Form elements are used to collect user input."
						>
							<div className="grid grid-cols-1 gap-8 md:grid-cols-2">
								<div className="space-y-6">
									<div className="space-y-2">
										<Label htmlFor={inputExampleId}>Input</Label>
										<Input
											id={inputExampleId}
											placeholder="Enter text here..."
										/>
									</div>

									<div className="space-y-2">
										<Label htmlFor={textareaExampleId}>Textarea</Label>
										<Textarea
											id={textareaExampleId}
											placeholder="Enter longer text here..."
										/>
									</div>

									<div className="space-y-2">
										<Label htmlFor={selectExampleId}>Select</Label>
										<Select>
											<SelectTrigger id={selectExampleId}>
												<SelectValue placeholder="Select an option" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="option1">Option 1</SelectItem>
												<SelectItem value="option2">Option 2</SelectItem>
												<SelectItem value="option3">Option 3</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</div>

								<div className="space-y-6">
									<div className="flex items-center space-x-2">
										<Checkbox id={termsCheckboxId} />
										<Label htmlFor={termsCheckboxId}>
											Accept terms and conditions
										</Label>
									</div>

									<div className="flex items-center space-x-2">
										<Switch id={airplaneModeId} />
										<Label htmlFor={airplaneModeId}>Airplane Mode</Label>
									</div>

									<div className="space-y-2">
										<Label>Profile Avatar</Label>
										<div className="flex space-x-4">
											<ProfileAvatar
												displayName="John Doe"
												pictureUrl="https://github.com/shadcn.png"
												className="h-12 w-12"
											/>
											<ProfileAvatar
												displayName="Jane Smith"
												className="h-10 w-10"
											/>
											<ProfileAvatar text="AJ" className="h-8 w-8" />
										</div>
									</div>
								</div>
							</div>
						</ComponentSection>

						<Separator />

						{/* Alerts & Notifications Section */}
						<ComponentSection
							title="Alerts & Notifications"
							description="Alerts and notifications are used to communicate important information to users."
						>
							<div className="space-y-4">
								<Alert>
									<AlertTitle>Information</AlertTitle>
									<AlertDescription>
										This is an informational alert message.
									</AlertDescription>
								</Alert>

								<Alert variant="destructive">
									<AlertTitle>Error</AlertTitle>
									<AlertDescription>
										Something went wrong. Please try again.
									</AlertDescription>
								</Alert>

								<div className="flex space-x-4">
									<Badge>Default</Badge>
									<Badge variant="secondary">Secondary</Badge>
									<Badge variant="outline">Outline</Badge>
									<Badge variant="destructive">Destructive</Badge>
								</div>

								<div>
									<Button onClick={() => setIsDialogOpen(true)}>
										Open Dialog
									</Button>
									<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
										<DialogContent>
											<DialogHeader>
												<DialogTitle>Dialog Title</DialogTitle>
												<DialogDescription>
													This is a dialog description. Dialogs are used to
													confirm actions or display important information.
												</DialogDescription>
											</DialogHeader>
											<div className="py-4">
												<p>Dialog content goes here.</p>
											</div>
											<DialogFooter>
												<Button
													variant="outline"
													onClick={() => setIsDialogOpen(false)}
												>
													Cancel
												</Button>
												<Button onClick={() => setIsDialogOpen(false)}>
													Confirm
												</Button>
											</DialogFooter>
										</DialogContent>
									</Dialog>
								</div>

								<div>
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button variant="outline">Open Dropdown</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent>
											<DropdownMenuLabel>My Account</DropdownMenuLabel>
											<DropdownMenuSeparator />
											<DropdownMenuItem>Profile</DropdownMenuItem>
											<DropdownMenuItem>Billing</DropdownMenuItem>
											<DropdownMenuItem>Team</DropdownMenuItem>
											<DropdownMenuItem>Subscription</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
							</div>
						</ComponentSection>

						<Separator />

						{/* Accordion Section */}
						<ComponentSection
							title="Accordion"
							description="Accordions are used to toggle between hiding and showing content."
						>
							<Accordion type="single" collapsible className="w-full">
								<AccordionItem value="item-1">
									<AccordionTrigger>Is it accessible?</AccordionTrigger>
									<AccordionContent>
										Yes. It adheres to the WAI-ARIA design pattern.
									</AccordionContent>
								</AccordionItem>
								<AccordionItem value="item-2">
									<AccordionTrigger>Is it styled?</AccordionTrigger>
									<AccordionContent>
										Yes. It comes with default styles that matches the other
										components' aesthetic.
									</AccordionContent>
								</AccordionItem>
								<AccordionItem value="item-3">
									<AccordionTrigger>Is it animated?</AccordionTrigger>
									<AccordionContent>
										Yes. It's animated by default, but you can disable it if you
										prefer.
									</AccordionContent>
								</AccordionItem>
							</Accordion>
						</ComponentSection>

						<Separator />

						{/* Empty State Section */}
						<ComponentSection
							title="Empty State"
							description="Empty states are used when there is no data to display."
						>
							<EmptyState className="p-8">
								<EmptyStateHeading>No items found</EmptyStateHeading>
								<EmptyStateText>
									You haven't created any items yet. Start by creating your
									first item.
								</EmptyStateText>
								<EmptyStateButton>Create Item</EmptyStateButton>
							</EmptyState>
						</ComponentSection>
					</TabsContent>

					{/* Marketing Components Tab */}
					<TabsContent value="marketing" className="mt-6 space-y-16">
						{/* Hero Section */}
						<ComponentSection
							title="Hero Section"
							description="The hero section is the first thing users see when they visit your site."
						>
							<div className="rounded-lg border p-6">
								<Hero
									pill={
										<Pill label={"New"}>
											<span>The SaaS Starter Kit for ambitious developers</span>
											<PillActionButton asChild>
												<Link href={"#"}>
													<ArrowRightIcon className={"h-4 w-4"} />
												</Link>
											</PillActionButton>
										</Pill>
									}
									title={
										<>
											<span>The ultimate SaaS Starter</span>
											<span>for your next project</span>
										</>
									}
									subtitle={
										<span>
											Build and Ship a SaaS faster than ever before with the
											next-gen SaaS Starter Kit. Ship your SaaS in days, not
											months.
										</span>
									}
									cta={
										<div className={"flex space-x-4"}>
											<CtaButton>
												<Link href={"#"}>
													<span className={"flex items-center space-x-0.5"}>
														<span>
															<Trans i18nKey={"common:getStarted"}>
																Get Started
															</Trans>
														</span>
														<ArrowRightIcon
															className={
																"animate-in fade-in slide-in-from-left-8 zoom-in fill-mode-both h-4 delay-1000 duration-1000"
															}
														/>
													</span>
												</Link>
											</CtaButton>
											<CtaButton variant={"link"}>
												<Link href={"#"}>
													<Trans i18nKey={"common:contactUs"}>Contact Us</Trans>
												</Link>
											</CtaButton>
										</div>
									}
									image={
										<div className="dark:border-primary/10 flex h-64 w-full items-center justify-center rounded-xl border border-gray-200 bg-gray-100">
											<span className="text-muted-foreground">
												Dashboard Image Placeholder
											</span>
										</div>
									}
								/>
							</div>
						</ComponentSection>

						{/* Blog Components Section */}
						<ComponentSection
							title="Blog Components"
							description="Components used for the blog section of the marketing site."
						>
							<div className="grid grid-cols-1 gap-8 md:grid-cols-2">
								<div className="space-y-4">
									<h3 className="text-xl font-semibold">Post Preview</h3>
									<div className="rounded-lg border p-4">
										<PostPreview post={mockPost} />
									</div>
								</div>

								<div className="space-y-4">
									<h3 className="text-xl font-semibold">Post Header</h3>
									<div className="rounded-lg border p-4">
										<PostHeader post={mockPost} />
									</div>
								</div>

								<div className="space-y-4">
									<h3 className="text-xl font-semibold">Cover Image</h3>
									<div className="rounded-lg border p-4">
										<div className="bg-muted flex h-40 w-full items-center justify-center rounded-md border">
											<span className="text-muted-foreground">
												Image Placeholder
											</span>
										</div>
									</div>
								</div>

								<div className="space-y-4">
									<h3 className="text-xl font-semibold">Blog Pagination</h3>
									<div className="rounded-lg border p-4">
										<BlogPagination
											currentPage={1}
											canGoToNextPage={true}
											canGoToPreviousPage={false}
										/>
									</div>
								</div>
							</div>
						</ComponentSection>

						{/* Documentation Components Section */}
						<ComponentSection
							title="Documentation Components"
							description="Components used for the documentation section of the marketing site."
						>
							<div className="grid grid-cols-1 gap-8 md:grid-cols-2">
								<div className="space-y-4">
									<h3 className="text-xl font-semibold">Docs Card</h3>
									<div className="rounded-lg border p-4">
										<DocsCard
											title="Getting Started"
											subtitle="Learn how to set up and configure the SaaS kit."
											link={mockDocsLink}
										>
											<p>Additional information about getting started.</p>
										</DocsCard>
									</div>
								</div>

								<div className="space-y-4">
									<h3 className="text-xl font-semibold">Docs Page Link</h3>
									<div className="rounded-lg border p-4">
										<DocsPageLink
											page={{
												title: "Authentication",
												url: "/docs/authentication",
											}}
										/>
									</div>
								</div>

								<div className="col-span-2 space-y-4">
									<h3 className="text-xl font-semibold">
										Docs Table of Contents
									</h3>
									<div className="rounded-lg border p-4">
										<DocsTableOfContents data={mockDocsNavItems} />
									</div>
								</div>
							</div>
						</ComponentSection>
					</TabsContent>

					{/* Navigation Components Tab */}
					<TabsContent value="navigation" className="mt-6 space-y-16">
						{/* Site Header Section */}
						<ComponentSection
							title="Site Header"
							description="The site header appears at the top of every page and contains the logo, navigation, and account actions."
						>
							<div className="rounded-lg border p-6">
								<Header
									logo={<AppLogo />}
									navigation={<SiteNavigation />}
									actions={
										<div className="flex gap-x-2.5">
											<Button
												className="hidden md:block"
												asChild
												variant="ghost"
											>
												<Link href="#">
													<Trans i18nKey="auth:signIn">Sign In</Trans>
												</Link>
											</Button>

											<Button asChild className="group" variant="default">
												<Link href="#">
													<Trans i18nKey="auth:signUp">Sign Up</Trans>
												</Link>
											</Button>
										</div>
									}
								/>
							</div>
						</ComponentSection>

						{/* Site Footer Section */}
						<ComponentSection
							title="Site Footer"
							description="The site footer appears at the bottom of every page and contains links and information."
						>
							<div className="rounded-lg border p-6">
								<SiteFooter />
							</div>
						</ComponentSection>

						{/* Site Page Header Section */}
						<ComponentSection
							title="Site Page Header"
							description="The site page header is used for section headers on marketing pages."
						>
							<div className="rounded-lg border p-6">
								<SitePageHeader
									title="Documentation"
									subtitle="Learn how to use the SaaS kit and its features."
								/>
							</div>
						</ComponentSection>

						{/* Home Navigation Section */}
						<ComponentSection
							title="Home Navigation"
							description="Navigation components used in the authenticated home area."
						>
							<div className="grid grid-cols-1 gap-8 md:grid-cols-2">
								<div className="space-y-4">
									<h3 className="text-xl font-semibold">Home Page Header</h3>
									<div className="rounded-lg border p-4">
										<HomeLayoutPageHeader
											title="Dashboard"
											description="Your personal dashboard"
										>
											Dashboard
										</HomeLayoutPageHeader>
									</div>
								</div>

								<div className="space-y-4">
									<h3 className="text-xl font-semibold">
										Home Menu Navigation
									</h3>
									<div className="h-64 overflow-auto rounded-lg border p-4">
										{/* Mocking the required workspace prop */}
										<HomeMenuNavigation workspace={mockUserWorkspace} />
									</div>
								</div>

								<div className="space-y-4">
									<h3 className="text-xl font-semibold">Home Sidebar</h3>
									<div className="rounded-lg border p-4">
										<Button
											onClick={() =>
												setIsHomeSidebarVisible(!isHomeSidebarVisible)
											}
											className="mb-4"
										>
											{isHomeSidebarVisible ? "Hide Sidebar" : "Show Sidebar"}
										</Button>

										{isHomeSidebarVisible && (
											<div className="relative h-96 w-64 overflow-hidden">
												<SidebarProvider defaultOpen={true}>
													<HomeSidebar workspace={mockUserWorkspace} />
												</SidebarProvider>
											</div>
										)}
									</div>
								</div>
							</div>
						</ComponentSection>

						{/* Admin Navigation Section */}
						<ComponentSection
							title="Admin Navigation"
							description="Navigation components used in the admin area."
						>
							<div className="space-y-4">
								<h3 className="text-xl font-semibold">Admin Sidebar</h3>
								<div className="rounded-lg border p-4">
									<Button
										onClick={() =>
											setIsAdminSidebarVisible(!isAdminSidebarVisible)
										}
										className="mb-4"
									>
										{isAdminSidebarVisible ? "Hide Sidebar" : "Show Sidebar"}
									</Button>

									{isAdminSidebarVisible && (
										<div className="relative h-96 w-64 overflow-hidden">
											<SidebarProvider defaultOpen={true}>
												<AdminSidebar />
											</SidebarProvider>
										</div>
									)}
								</div>
							</div>
						</ComponentSection>
					</TabsContent>

					{/* Colors Tab */}
					<TabsContent value="colors" className="mt-6 space-y-8">
						{/* Color Palette Section */}
						<ComponentSection
							title="Color Palette"
							description="The color palette defines the visual identity of your application."
						>
							<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
								{/* Primary Colors */}
								<div className="space-y-2">
									<div className="bg-primary flex h-20 items-end rounded-md p-2">
										<span className="text-primary-foreground font-medium">
											Primary
										</span>
									</div>
									<div className="bg-secondary flex h-20 items-end rounded-md p-2">
										<span className="text-secondary-foreground font-medium">
											Secondary
										</span>
									</div>
									<div className="bg-accent flex h-20 items-end rounded-md p-2">
										<span className="text-accent-foreground font-medium">
											Accent
										</span>
									</div>
								</div>

								{/* UI Colors */}
								<div className="space-y-2">
									<div className="bg-background flex h-20 items-end rounded-md border p-2">
										<span className="text-foreground font-medium">
											Background
										</span>
									</div>
									<div className="bg-card flex h-20 items-end rounded-md border p-2">
										<span className="text-card-foreground font-medium">
											Card
										</span>
									</div>
									<div className="bg-muted flex h-20 items-end rounded-md p-2">
										<span className="text-muted-foreground font-medium">
											Muted
										</span>
									</div>
								</div>

								{/* Semantic Colors */}
								<div className="space-y-2">
									<div className="bg-destructive flex h-20 items-end rounded-md p-2">
										<span className="text-destructive-foreground font-medium">
											Destructive
										</span>
									</div>
									<div className="border-border flex h-20 items-end rounded-md border p-2">
										<span className="font-medium">Border</span>
									</div>
									<div className="bg-popover flex h-20 items-end rounded-md p-2">
										<span className="text-popover-foreground font-medium">
											Popover
										</span>
									</div>
								</div>
							</div>
						</ComponentSection>

						{/* Continue with other color sections... */}
					</TabsContent>

					{/* Typography Tab */}
					<TabsContent value="typography" className="mt-6 space-y-8">
						{/* Headings Section */}
						<ComponentSection
							title="Headings"
							description="Headings are used to structure content and establish hierarchy."
						>
							<div className="space-y-4">
								<h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
									Heading 1
								</h1>
								<h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
									Heading 2
								</h2>
								<h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
									Heading 3
								</h3>
								<h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
									Heading 4
								</h4>
								<h5 className="scroll-m-20 text-lg font-semibold tracking-tight">
									Heading 5
								</h5>
								<h6 className="scroll-m-20 text-base font-semibold tracking-tight">
									Heading 6
								</h6>
							</div>
						</ComponentSection>

						{/* Continue with other typography sections... */}
					</TabsContent>
				</Tabs>
			</div>
		</ClientOnly>
	);
}

/**
 * Component Section
 *
 * A reusable component for displaying a section of UI components with a title and description.
 * This helps maintain consistency across the showcase and makes it easier to add new sections.
 */
function ComponentSection({
	title,
	description,
	children,
}: {
	title: string;
	description?: string;
	children: React.ReactNode;
}) {
	return (
		<section>
			<div className="mb-4">
				<h2 className="text-2xl font-semibold">{title}</h2>
				{description && (
					<p className="text-muted-foreground mt-1">{description}</p>
				)}
			</div>
			{children}
		</section>
	);
}
