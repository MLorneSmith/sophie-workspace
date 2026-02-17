import Link from "next/link";

export function HomeFoundersMessage() {
	return (
		<section
			aria-label="A message from our founder"
			className="relative w-full bg-black py-16 sm:py-20 md:py-28 lg:py-32"
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
				<p className="mb-8 text-2xl leading-snug font-medium tracking-tight text-[#f5f5f7] sm:mb-10 sm:text-3xl md:text-4xl md:leading-snug">
					The best presentation you ever saw probably wasn&apos;t the prettiest
					one.
				</p>

				{/* Letter body */}
				<div className="space-y-6 text-base leading-relaxed text-[#a0a0b0] sm:text-lg sm:leading-relaxed">
					<p>
						It was the one where someone walked into the room, laid out the
						problem in a way that made everyone nod, and then built an argument
						so clear that the decision felt obvious. No fancy animations. No
						stock photos. Just sharp thinking, structured right.
					</p>

					<p className="text-[#c8c8d4]">
						That&apos;s the craft. And it&apos;s disappearing.
					</p>

					<p>
						AI has made it trivially easy to generate slides. Type a sentence,
						get a deck. It looks professional. It says all the right buzzwords.
						And it lands with a thud&nbsp;&mdash; because there&apos;s no
						thinking behind it. No structure. No understanding of who&apos;s in
						the room and what they actually need to hear.
					</p>

					<p className="text-[#c8c8d4]">
						We think that&apos;s a problem worth solving properly.
					</p>

					<p>
						SlideHeroes doesn&apos;t generate presentations for you. It helps
						you build them&nbsp;&mdash; with the same methodology that the best
						consulting firms have used for decades. Structured storytelling.
						Logical flow. Audience-aware persuasion. The stuff that separates a
						deck that gets forwarded from one that gets forgotten.
					</p>

					<p>
						The AI handles the research, the drafts, the heavy lifting. You
						handle the judgment&nbsp;&mdash; what matters, what doesn&apos;t,
						and what this particular audience needs to walk away believing.
					</p>

					<p className="text-[#c8c8d4]">
						It&apos;s not magic. It&apos;s a better process. And better process
						beats better templates every single time.
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
						className="text-5xl text-[#f5f5f7] sm:text-6xl"
						style={{ fontFamily: "var(--font-script), cursive" }}
					>
						Michael
					</p>
					<div className="mt-2 flex items-center gap-3">
						<div
							aria-hidden="true"
							className="h-px w-8 bg-[var(--homepage-border,#2a2a3a)]"
						/>
						<p className="text-sm tracking-wide text-[#a0a0b0]">
							Michael<span className="mx-1.5 text-[#555]">/</span>
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
