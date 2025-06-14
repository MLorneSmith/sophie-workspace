import { getSupabaseServerAdminClient } from "@kit/supabase/server-admin-client";
import { Avatar, AvatarFallback, AvatarImage } from "@kit/ui/avatar";
import { Badge } from "@kit/ui/badge";
import { Button } from "@kit/ui/button";
import { Heading } from "@kit/ui/heading";
import { If } from "@kit/ui/if";
import { PageBody } from "@kit/ui/page";
import { ExternalLinkIcon } from "lucide-react";
import Link from "next/link";

import { createTestimonialService } from "../../server/testimonial.service";
import { DeleteTestimonialDialog } from "../components/delete-testimonial-dialog";
import { Rating } from "../components/rating";
import { TestimonialsStatus } from "../components/testimonials-status";
import { UpdateTestimonialStatusSelect } from "../components/update-testimonial-status-select";

interface TestimonialsPageParams {
	id: string;
}

export async function TestimonialPage(props: {
	params: Promise<TestimonialsPageParams>;
}) {
	const adminClient = getSupabaseServerAdminClient();
	const service = createTestimonialService(adminClient);

	const params = await props.params;
	const testimonial = await service.getTestimonial(params.id);

	return (
		<div className={"flex flex-1 flex-col space-y-4"}>
			<div className={"flex w-full justify-between p-4"}>
				<div className={"flex w-full items-center space-x-4"}>
					<Avatar>
						<AvatarImage src={testimonial.customer_avatar_url!} />
						<AvatarFallback>
							{testimonial.customer_name[0]}
							{testimonial.customer_name[1]}
						</AvatarFallback>
					</Avatar>

					<div>
						<Heading level={3}>{testimonial.customer_name}</Heading>
					</div>

					<div>
						<UpdateTestimonialStatusSelect
							status={testimonial.status}
							id={testimonial.id}
						/>
					</div>
				</div>

				<div className={"flex space-x-2"}>
					<DeleteTestimonialDialog id={testimonial.id}>
						<Button variant={"destructive"}>Delete</Button>
					</DeleteTestimonialDialog>
				</div>
			</div>

			<div className={"flex flex-wrap space-x-2.5 px-4"}>
				<TestimonialsStatus status={testimonial.status} />

				<Badge variant={"outline"} className={"flex space-x-1"}>
					<span>Rating</span>: <Rating rating={testimonial.rating} />
				</Badge>

				<Badge variant={"outline"}>
					<span>Source</span>: {testimonial.source}
				</Badge>

				<Badge variant={"outline"}>
					<span>Created At</span>:{" "}
					{new Date(testimonial.created_at).toLocaleString()}
				</Badge>

				<If condition={testimonial.link}>
					{(link) => (
						<Badge variant={"outline"} className={"flex space-x-1"}>
							<Link
								target={"_blank"}
								href={link}
								className={"flex items-center space-x-2.5"}
							>
								<span className={"underline"}>External Link</span>
								<ExternalLinkIcon className={"h-3 w-3"} />
							</Link>
						</Badge>
					)}
				</If>
			</div>

			<PageBody>
				<If condition={testimonial.content}>
					<blockquote className={"border p-4 font-sans text-sm"}>
						{testimonial.content}
					</blockquote>
				</If>

				<If condition={testimonial.video_url}>
					{(url) => (
						<video
							controls
							className={"my-4 min-h-[250px] w-full max-w-md"}
							src={url}
						/>
					)}
				</If>
			</PageBody>
		</div>
	);
}
