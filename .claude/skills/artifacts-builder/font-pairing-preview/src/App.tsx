import "./App.css";

const features = [
	{
		label: "AI-Powered",
		title: "Smart layouts that adapt",
		description:
			"Our engine analyzes your content and automatically suggests layouts, color palettes, and typography that match your brand and message. No more starting from a blank slide.",
	},
	{
		label: "Collaboration",
		title: "Real-time team editing",
		description:
			"Work together seamlessly with live cursors, inline comments, and version history. Every change is tracked, every decision is reversible.",
	},
	{
		label: "Export",
		title: "One click, every format",
		description:
			"Export to PowerPoint, PDF, Google Slides, or share a live web link. Your presentations look pixel-perfect everywhere they go.",
	},
];

const plans = [
	{
		name: "Starter",
		price: "0",
		interval: "forever",
		description: "For individuals exploring better presentations.",
		cta: "Start Free",
		features: [
			"5 presentations/month",
			"Basic AI suggestions",
			"PDF export",
			"Community templates",
		],
		highlighted: false,
	},
	{
		name: "Pro",
		price: "19",
		interval: "mo",
		description:
			"For professionals who present weekly and need every advantage.",
		cta: "Get Started",
		features: [
			"Unlimited presentations",
			"Advanced AI engine",
			"All export formats",
			"Brand kit & custom fonts",
			"Priority support",
		],
		highlighted: true,
	},
	{
		name: "Team",
		price: "49",
		interval: "mo",
		description: "For organizations that need consistency across every deck.",
		cta: "Contact Sales",
		features: [
			"Everything in Pro",
			"5 team members",
			"Shared brand library",
			"Admin controls",
			"SSO & audit logs",
		],
		highlighted: false,
	},
];

function App() {
	return (
		<div className="page">
			{/* Nav */}
			<nav className="nav">
				<div className="nav-inner">
					<span className="nav-logo">SlideHeroes</span>
					<div className="nav-links">
						<a href="#">Features</a>
						<a href="#">Pricing</a>
						<a href="#">Blog</a>
						<a className="nav-cta" href="#">
							Get Started
						</a>
					</div>
				</div>
			</nav>

			{/* Hero */}
			<section className="hero">
				<div className="hero-inner">
					<div className="pill">Now with AI-powered layouts</div>
					<h1>
						Create presentations <span className="accent-text">faster</span>
					</h1>
					<p className="hero-sub">
						SlideHeroes transforms how teams build presentations. Drop in your
						content, and our AI handles layout, design, and formatting — so you
						can focus on your story, not your slides.
					</p>
					<div className="hero-actions">
						<a href="#" className="btn-primary">
							Start for free
						</a>
						<a href="#" className="btn-outline">
							Watch demo
						</a>
					</div>
					<p className="hero-proof">
						Trusted by 2,400+ teams · No credit card required
					</p>
				</div>
			</section>

			{/* Features */}
			<section className="features">
				<div className="section-inner">
					<h2>Everything you need to present with confidence</h2>
					<p className="section-sub">
						From first draft to final delivery, SlideHeroes gives you the tools
						to create presentations that hold attention and drive decisions.
					</p>
					<div className="features-grid">
						{features.map((f) => (
							<div key={f.title} className="feature-card">
								<span className="feature-label">{f.label}</span>
								<h3>{f.title}</h3>
								<p>{f.description}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Testimonial */}
			<section className="testimonial-section">
				<div className="section-inner">
					<blockquote className="testimonial">
						<p>
							"We switched from Keynote to SlideHeroes three months ago and
							haven't looked back. The AI suggestions alone save our design team
							six hours a week. It's become the backbone of how we pitch to
							clients."
						</p>
						<footer>
							<strong>Sarah Chen</strong>
							<span>VP of Marketing, Meridian Partners</span>
						</footer>
					</blockquote>
				</div>
			</section>

			{/* Pricing */}
			<section className="pricing">
				<div className="section-inner">
					<h2>Simple, transparent pricing</h2>
					<p className="section-sub">
						Start free and scale as your team grows. No hidden fees, no
						surprises — just great presentations.
					</p>
					<div className="pricing-grid">
						{plans.map((plan) => (
							<div
								key={plan.name}
								className={`pricing-card ${plan.highlighted ? "pricing-highlighted" : ""}`}
							>
								{plan.highlighted && (
									<span className="pricing-badge">Most Popular</span>
								)}
								<h3>{plan.name}</h3>
								<p className="pricing-desc">{plan.description}</p>
								<div className="pricing-amount">
									<span className="pricing-dollar">$</span>
									<span className="pricing-number">{plan.price}</span>
									<span className="pricing-interval">/{plan.interval}</span>
								</div>
								<a
									href="#"
									className={plan.highlighted ? "btn-primary" : "btn-outline"}
									style={{ display: "block", textAlign: "center" }}
								>
									{plan.cta}
								</a>
								<ul className="pricing-features">
									{plan.features.map((feat) => (
										<li key={feat}>
											<svg
												width="16"
												height="16"
												viewBox="0 0 16 16"
												fill="none"
											>
												<path
													d="M13.3 4.3L6 11.6L2.7 8.3"
													stroke="currentColor"
													strokeWidth="1.5"
													strokeLinecap="round"
													strokeLinejoin="round"
												/>
											</svg>
											{feat}
										</li>
									))}
								</ul>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* CTA */}
			<section className="cta-section">
				<div className="section-inner cta-inner">
					<h2>
						Ready to build presentations{" "}
						<span className="accent-text">that matter?</span>
					</h2>
					<p className="cta-sub">
						Join thousands of teams already using SlideHeroes to win pitches,
						close deals, and communicate ideas that stick.
					</p>
					<div className="hero-actions">
						<a href="#" className="btn-primary">
							Get started — it's free
						</a>
					</div>
					<div className="cta-trust">
						<span>✓ Free forever plan</span>
						<span>✓ No credit card required</span>
						<span>✓ Cancel anytime</span>
					</div>
				</div>
			</section>

			{/* Font reference */}
			<footer className="font-ref">
				<div className="section-inner">
					<div className="font-ref-grid">
						<div>
							<h4>Headings</h4>
							<p className="font-sample-mono">Geist Mono 700</p>
							<p className="font-meta">Monospaced · Technical · Precise</p>
						</div>
						<div>
							<h4>Body</h4>
							<p className="font-sample-serif">Instrument Serif 400</p>
							<p className="font-meta">Serif · Editorial · Warm</p>
						</div>
						<div>
							<h4>UI Elements</h4>
							<p className="font-sample-sans">System sans-serif</p>
							<p className="font-meta">Buttons · Badges · Nav</p>
						</div>
					</div>
				</div>
			</footer>
		</div>
	);
}

export default App;
