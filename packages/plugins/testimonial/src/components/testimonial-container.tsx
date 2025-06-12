"use client";

import { type ReactNode, useState } from "react";

import { PencilIcon, VideoIcon } from "lucide-react";

import { Button } from "@kit/ui/button";
import { If } from "@kit/ui/if";
import { Trans } from "@kit/ui/trans";
import { cn } from "@kit/ui/utils";

interface TestimonialContainerProps {
	className?: string;
	welcomeMessage: ReactNode;
	enableTextReview: boolean;
	enableVideoReview: boolean;
	textReviewComponent: ReactNode;
	videoReviewComponent: ReactNode;
	successMessage?: ReactNode;
	chooseText?: string;
	textButtonText?: string;
	videoButtonText?: string;
	backButtonText?: string;
}

export function TestimonialContainer({
	className,
	welcomeMessage,
	enableTextReview,
	enableVideoReview,
	textReviewComponent,
	videoReviewComponent,
	textButtonText = "testimonials:textButtonText",
	videoButtonText = "testimonials:videoButtonText",
	backButtonText = "testimonials:backButtonText",
}: TestimonialContainerProps) {
	const [reviewType, setReviewType] = useState<"text" | "video" | null>(null);

	return (
		<div className={cn(className, "space-y-6")}>
			{welcomeMessage}

			<If condition={!reviewType}>
				<div className="space-y-4">
					<div className="flex flex-col gap-2.5">
						<If condition={enableTextReview}>
							<Button
								className={"relative"}
								size={"lg"}
								variant={"outline"}
								onClick={() => setReviewType("text")}
							>
								<PencilIcon className={"absolute left-3 h-4"} />
								<span>
									<Trans i18nKey={textButtonText} defaults={textButtonText} />
								</span>
							</Button>
						</If>

						<If condition={enableVideoReview}>
							<Button
								className={"relative"}
								size={"lg"}
								onClick={() => setReviewType("video")}
							>
								<VideoIcon className={"absolute left-4 h-4"} />
								<span>
									<Trans i18nKey={videoButtonText} defaults={videoButtonText} />
								</span>
							</Button>
						</If>
					</div>
				</div>
			</If>

			<If condition={reviewType === "text" && enableTextReview}>
				{textReviewComponent}
			</If>

			<If condition={reviewType === "video" && enableVideoReview}>
				{videoReviewComponent}
			</If>

			<If condition={reviewType}>
				<div className={"flex flex-col justify-center space-y-4"}>
					<hr />

					<Button
						size={"sm"}
						variant="link"
						onClick={() => setReviewType(null)}
					>
						<Trans i18nKey={backButtonText} defaults={backButtonText} />
					</Button>
				</div>
			</If>
		</div>
	);
}
