import type { Cms } from "@kit/cms";
import { If } from "@kit/ui/if";
import { cn } from "@kit/ui/utils";

import { getBestPostImageUrl } from "~/lib/utils/image-utils";

import { CoverImage } from "./cover-image";
import { DateFormatter } from "./date-formatter";

export function PostHeader({ post }: { post: Cms.ContentItem }) {
	const { title, publishedAt, description } = post;

	// Use the enhanced utility to get the best available image URL
	const imageUrl = getBestPostImageUrl(post);

	return (
		<div className={"flex flex-1 flex-col"}>
			<div className={cn("border-b py-8")}>
				<div className={"mx-auto flex max-w-3xl flex-col space-y-4"}>
					<h1
						className={
							"font-heading text-3xl font-semibold tracking-tighter xl:text-5xl dark:text-white"
						}
					>
						{title}
					</h1>

					<div>
						<span className={"text-muted-foreground"}>
							<DateFormatter dateString={publishedAt} />
						</span>
					</div>

					<h2
						className={"text-muted-foreground text-base xl:text-lg"}
						{/* biome-ignore lint/security/noDangerouslySetInnerHtml: Rendering trusted blog post description from CMS */}
						dangerouslySetInnerHTML={{ __html: description ?? "" }}
					/>
				</div>
			</div>

			<If condition={imageUrl}>
				{(url) => (
					<div className="relative mx-auto mt-8 flex h-[378px] w-full max-w-3xl justify-center">
						<CoverImage
							preloadImage
							className="rounded-md"
							title={title}
							src={url}
						/>
					</div>
				)}
			</If>
		</div>
	);
}
