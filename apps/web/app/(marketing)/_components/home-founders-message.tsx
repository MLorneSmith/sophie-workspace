import Link from "next/link";

export function HomeFoundersMessage() {
	return (
		<section
			aria-label="A message from our founder"
			className="relative w-full bg-black py-16 sm:py-20 md:py-28 lg:py-36"
		>
			{/* Subtle top accent line */}
			<div
				aria-hidden="true"
				className="absolute inset-x-0 top-0 mx-auto h-px max-w-3xl"
				style={{
					background:
						"radial-gradient(ellipse at center, var(--homepage-border, #2a2a3a) 0%, transparent 70%)",
				}}
			/>

			<div className="mx-auto max-w-2xl px-6 sm:px-8">
				{/* Opening hook — large, weighted */}
				<p className="mb-8 text-2xl leading-snug font-medium tracking-tight text-foreground sm:mb-10 sm:text-3xl md:text-4xl md:leading-snug">
					The best presentation you ever saw probably wasn&apos;t the prettiest
					one.
				</p>

				{/* Letter body */}
				<div className="space-y-6 text-base leading-relaxed text-muted-foreground sm:text-lg sm:leading-relaxed">
					<p>
						It was the one where someone laid out the problem in a way that made
						everyone nod, then built an argument so clear the decision felt
						obvious. No fancy animations, stock photos. Just sharp thinking,
						structured right.
					</p>

					<p className="text-foreground/80">
						That&apos;s the craft. And it&apos;s disappearing.
					</p>

					<p>
						AI has made it trivially easy to generate
						slides&nbsp;&mdash;&nbsp;type a sentence, get a deck. It looks
						professional, uses the right buzzwords, and lands with a thud.
						Because there&apos;s no thinking behind it. No structure. No
						understanding of who&apos;s in the room.
					</p>

					<p className="text-foreground/80">
						We think that&apos;s a problem worth solving properly.
					</p>

					<p>
						SlideHeroes doesn&apos;t generate presentations for you. It helps
						you build them&nbsp;&mdash;&nbsp;automating the same methodology the
						best consulting firms have used for decades. Structured
						storytelling. Logical flow. Audience-aware persuasion.
					</p>

					<p>
						Our AI handles the research, the drafts, the heavy lifting. You
						handle the judgment&nbsp;&mdash;&nbsp;what matters, what
						doesn&apos;t, and what your audience needs to walk away believing.
					</p>

					<p className="text-foreground/80">
						It&apos;s not magic. It&apos;s a better workflow. And better process
						beats better templates every time.
					</p>

					<p>
						<Link
							href="/auth/sign-up"
							className="text-[var(--homepage-accent,#24a9e0)] underline decoration-[var(--homepage-accent,#24a9e0)]/30 underline-offset-4 transition-colors hover:text-[var(--homepage-accent,#24a9e0)]/80"
						>
							Come see what we&apos;re building.
						</Link>
					</p>
				</div>

				{/* Signature */}
				<div className="mt-10 sm:mt-12">
					<p
						className="text-5xl text-foreground sm:text-6xl"
						style={{ fontFamily: "var(--font-script), cursive" }}
					>
						Michael
					</p>
					<div className="mt-2 flex items-center gap-3">
						<div
							aria-hidden="true"
							className="h-px w-8 bg-[var(--homepage-border,#2a2a3a)]"
						/>
						<p className="text-sm tracking-wide text-muted-foreground">
							Michael<span className="mx-1.5 text-muted-foreground/50">/</span>
							Founder
						</p>
					</div>
				</div>
			</div>

			{/* Subtle bottom accent line */}
			<div
				aria-hidden="true"
				className="absolute inset-x-0 bottom-0 mx-auto h-px max-w-3xl"
				style={{
					background:
						"radial-gradient(ellipse at center, var(--homepage-border, #2a2a3a) 0%, transparent 70%)",
				}}
			/>
		</section>
	);
}
