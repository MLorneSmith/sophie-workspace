"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";
import Marquee from "react-fast-marquee";

import { cn } from "../lib/utils";

function usePrefersReducedMotion() {
	const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

	useEffect(() => {
		const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
		setPrefersReducedMotion(mql.matches);
		const handler = (e: MediaQueryListEvent) =>
			setPrefersReducedMotion(e.matches);
		mql.addEventListener("change", handler);
		return () => mql.removeEventListener("change", handler);
	}, []);

	return prefersReducedMotion;
}

interface Logo {
	name: string;
	src: string;
	grayscaleSrc?: string;
	scale?: number;
}

interface LogoCloudMarqueeProps {
	className?: string;
	title?: string;
	description?: string;
	logos?: Logo[];
	mode?: "single" | "dual";
	speed?: number;
}

const springConfig = {
	type: "spring",
	stiffness: 100,
	damping: 30,
	mass: 0.1,
	restDelta: 0.001,
} as const;

const defaultLogos = [
	{
		name: "GFT",
		src: "/images/logos/Gft_logo.svg",
		grayscaleSrc: "/images/logos/greyscale/Gft-100px.svg",
		scale: 0.7,
	},
	{
		name: "Goldman Sachs",
		src: "/images/logos/Goldman_Sachs.svg",
		grayscaleSrc: "/images/logos/greyscale/Goldman_Sachs.svg",
		scale: 0.5,
	},
	{
		name: "L.E.K. Consulting",
		src: "/images/logos/L.E.K._Consulting.svg",
		grayscaleSrc: "/images/logos/greyscale/L.E.K._Consulting.svg",
		scale: 0.6,
	},
	{
		name: "NPower",
		src: "/images/logos/npower.svg",
		grayscaleSrc: "/images/logos/greyscale/npower.svg",
		scale: 1.0,
	},
	{
		name: "Pfizer",
		src: "/images/logos/Pfizer_(2021).svg",
		grayscaleSrc: "/images/logos/greyscale/Pfizer.svg",
		scale: 0.8,
	},
	{
		name: "Seneca College",
		src: "/images/logos/Seneca_College_logo.svg",
		grayscaleSrc: "/images/logos/greyscale/Seneca-College.svg",
		scale: 0.8,
	},
	{
		name: "Siegwerk Group",
		src: "/images/logos/Siegwerk_Group_logo.svg",
		grayscaleSrc: "/images/logos/greyscale/Siegwerk_Group.svg",
		scale: 1.0,
	},
	{
		name: "Staples",
		src: "/images/logos/Staples,_Inc._logo.svg",
		grayscaleSrc: "/images/logos/greyscale/Staples.svg",
		scale: 0.9,
	},
	{
		name: "SunTrust Banks",
		src: "/images/logos/SunTrust_Banks_logo.svg",
		grayscaleSrc: "/images/logos/greyscale/SunTrust.svg",
		scale: 0.7,
	},
	{
		name: "Swiss Re",
		src: "/images/logos/Swiss_Re_2013_logo.svg",
		grayscaleSrc: "/images/logos/greyscale/Swiss_Re.svg",
		scale: 1.0,
	},
	{
		name: "Teach for America",
		src: "/images/logos/teach-for-america-vector-logo.svg",
		grayscaleSrc: "/images/logos/greyscale/teach-for-america.svg",
		scale: 1.3,
	},
	{
		name: "Travelers",
		src: "/images/logos/travelers-vector-logo.svg",
		grayscaleSrc: "/images/logos/greyscale/travelers.svg",
		scale: 0.9,
	},
	{
		name: "UnitedHealthcare",
		src: "/images/logos/unitedhealthcare-vector-logo-2021.svg",
		grayscaleSrc: "/images/logos/greyscale/unitedhealthcare.svg",
		scale: 0.9,
	},
	{
		name: "US Department of Energy",
		src: "/images/logos/us-department-of-energy-vector-logo.svg",
		grayscaleSrc: "/images/logos/greyscale/us-department-of-energy.svg",
		scale: 1.0,
	},
	{
		name: "Walmart",
		src: "/images/logos/Walmart_logo.svg",
		grayscaleSrc: "/images/logos/greyscale/Walmart.svg",
		scale: 1.0,
	},
];

const MotionDiv = motion.div;

const LogoItem = ({ logo }: { logo: Logo }) => {
	return (
		<div className="mx-8 flex min-h-[44px] min-w-[44px] items-center md:mx-14">
			<MotionDiv
				whileHover={{
					scale: 1.1,
					transition: {
						...springConfig,
						mass: 0.05,
					},
				}}
			>
				<div className="flex items-center justify-center">
					<Image
						src={logo.src}
						alt={logo.name}
						width={150}
						height={75}
						className="block opacity-90 transition-all duration-300 hover:opacity-100 dark:hidden"
						style={{
							objectFit: "contain",
							objectPosition: "center",
						}}
					/>
					<Image
						src={logo.grayscaleSrc || logo.src}
						alt=""
						aria-hidden="true"
						width={150 * (logo.scale || 1.0)}
						height={75 * (logo.scale || 1.0)}
						className="hidden opacity-90 transition-all duration-300 hover:opacity-100 dark:block"
						style={{
							objectFit: "contain",
							objectPosition: "center",
						}}
					/>
				</div>
			</MotionDiv>
		</div>
	);
};

export function LogoCloudMarquee({
	className,
	title = "Trusted by the world's best teams",
	description = "Teams from some of the world's greatest companies use our tools & training to create pursuasive presentations.",
	logos = defaultLogos,
	mode = "dual",
	speed = 30,
}: LogoCloudMarqueeProps) {
	const prefersReducedMotion = usePrefersReducedMotion();
	const midPoint = Math.ceil(logos.length / 2);
	const firstHalf = logos.slice(0, midPoint);
	const secondHalf = logos.slice(midPoint);

	return (
		<div
			className={cn("relative py-10 motion-reduce:*:animate-none", className)}
			style={{ zIndex: 0 }}
			role="region"
			aria-label={title || "Client logos"}
		>
			<MotionDiv
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={springConfig}
			>
				<h2
					className={cn(
						"text-h3 sm:text-h2 text-center",
						"text-white",
					)}
				>
					{title}
				</h2>
			</MotionDiv>

			{description && (
				<MotionDiv
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{
						...springConfig,
						delay: 0.1,
					}}
				>
					<p className="body mt-4 text-center text-muted-foreground">
						{description}
					</p>
				</MotionDiv>
			)}

			<div
				className={cn(
					"relative flex w-full flex-col items-center justify-center gap-4",
					mode === "single" ? "mt-10" : "mt-20",
				)}
			>
				{mode === "single" ? (
					<div
						className="relative w-full overflow-hidden"
						role="group"
						aria-label="Client logos"
					>
						<div
							className="pointer-events-none absolute inset-y-0 left-0 z-[2] w-16 sm:w-24 lg:w-32"
							aria-hidden="true"
							style={{
								background:
									"linear-gradient(to right, rgb(0 0 0 / 0.9), transparent)",
							}}
						/>
						<div
							className="pointer-events-none absolute inset-y-0 right-0 z-[2] w-16 sm:w-24 lg:w-32"
							aria-hidden="true"
							style={{
								background:
									"linear-gradient(to left, rgb(0 0 0 / 0.9), transparent)",
							}}
						/>
						<div className="relative z-[1]">
							<Marquee
								pauseOnHover
								play={!prefersReducedMotion}
								direction="right"
								gradient={false}
								speed={speed}
								aria-label="Logo marquee"
							>
								<div className="flex items-center justify-center gap-4">
									{logos.map((logo) => (
										<LogoItem key={logo.name} logo={logo} />
									))}
								</div>
							</Marquee>
						</div>
					</div>
				) : (
					<>
						<div
							className="relative w-full overflow-hidden"
							role="group"
							aria-label="Client logos first row"
						>
							<div
								className="pointer-events-none absolute inset-y-0 left-0 z-[2] w-16 sm:w-24 lg:w-32"
								aria-hidden="true"
								style={{
									background:
										"linear-gradient(to right, rgb(0 0 0 / 0.9), transparent)",
								}}
							/>
							<div
								className="pointer-events-none absolute inset-y-0 right-0 z-[2] w-16 sm:w-24 lg:w-32"
								aria-hidden="true"
								style={{
									background:
										"linear-gradient(to left, rgb(0 0 0 / 0.9), transparent)",
								}}
							/>
							<div className="relative z-[1]">
								<Marquee
									pauseOnHover
									play={!prefersReducedMotion}
									direction="right"
									gradient={false}
									speed={speed}
									aria-label="Logo marquee first row"
								>
									<div className="flex items-center justify-center gap-4">
										{firstHalf.map((logo) => (
											<LogoItem key={logo.name} logo={logo} />
										))}
									</div>
								</Marquee>
							</div>
						</div>

						<div
							className="relative w-full overflow-hidden"
							role="group"
							aria-label="Client logos second row"
						>
							<div
								className="pointer-events-none absolute inset-y-0 left-0 z-[2] w-16 sm:w-24 lg:w-32"
								aria-hidden="true"
								style={{
									background:
										"linear-gradient(to right, rgb(0 0 0 / 0.9), transparent)",
								}}
							/>
							<div
								className="pointer-events-none absolute inset-y-0 right-0 z-[2] w-16 sm:w-24 lg:w-32"
								aria-hidden="true"
								style={{
									background:
										"linear-gradient(to left, rgb(0 0 0 / 0.9), transparent)",
								}}
							/>
							<div className="relative z-[1]">
								<Marquee
									pauseOnHover
									play={!prefersReducedMotion}
									direction="left"
									speed={Math.round(speed * 0.83)}
									gradient={false}
									aria-label="Logo marquee second row"
								>
									<div className="flex items-center justify-center gap-4">
										{secondHalf.map((logo) => (
											<LogoItem key={`${logo.name}-second`} logo={logo} />
										))}
									</div>
								</Marquee>
							</div>
						</div>
					</>
				)}
			</div>
		</div>
	);
}
