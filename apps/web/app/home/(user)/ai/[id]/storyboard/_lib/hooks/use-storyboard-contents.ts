"use client";

import { useSupabase } from "@kit/supabase/hooks/use-supabase";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type {
	StoryboardContentsRow,
	StoryboardSlide,
} from "../../../_lib/types/storyboard.types";

function storyboardQueryKey(presentationId: string) {
	return ["storyboard-contents", presentationId] as const;
}

export function useStoryboardContents(presentationId: string) {
	const supabase = useSupabase();

	return useQuery({
		queryKey: storyboardQueryKey(presentationId),
		queryFn: async (): Promise<StoryboardContentsRow | null> => {
			const { data, error } = await supabase
				.from("storyboard_contents")
				.select("*")
				.eq("presentation_id", presentationId)
				.maybeSingle();

			if (error) throw error;
			if (!data) return null;

			return {
				...data,
				slides: (data.slides ?? []) as unknown as StoryboardSlide[],
			};
		},
		staleTime: 5 * 60 * 1000,
		gcTime: 30 * 60 * 1000,
	});
}

export function useSaveStoryboardSlides(presentationId: string) {
	const supabase = useSupabase();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (slides: StoryboardSlide[]) => {
			const { data, error } = await supabase
				.from("storyboard_contents")
				.update({
					slides: JSON.parse(JSON.stringify(slides)),
					updated_at: new Date().toISOString(),
				})
				.eq("presentation_id", presentationId)
				.select()
				.single();

			if (error) throw error;

			return {
				...data,
				slides: (data.slides ?? []) as unknown as StoryboardSlide[],
			};
		},
		onMutate: async (newSlides) => {
			await queryClient.cancelQueries({
				queryKey: storyboardQueryKey(presentationId),
			});

			const previous = queryClient.getQueryData<StoryboardContentsRow | null>(
				storyboardQueryKey(presentationId),
			);

			if (previous) {
				queryClient.setQueryData(storyboardQueryKey(presentationId), {
					...previous,
					slides: newSlides,
				});
			}

			return { previous };
		},
		onError: (_err, _newSlides, context) => {
			if (context?.previous) {
				queryClient.setQueryData(
					storyboardQueryKey(presentationId),
					context.previous,
				);
			}
		},
		onSettled: () => {
			queryClient.invalidateQueries({
				queryKey: storyboardQueryKey(presentationId),
			});
		},
	});
}
