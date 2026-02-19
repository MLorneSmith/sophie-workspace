"use client";

import { useSupabase } from "@kit/supabase/hooks/use-supabase";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type {
	OutlineContentsRow,
	OutlineSection,
} from "../../../_lib/types/outline.types";

function outlineQueryKey(presentationId: string) {
	return ["outline-contents", presentationId] as const;
}

export function useOutlineContents(presentationId: string) {
	const supabase = useSupabase();

	return useQuery({
		queryKey: outlineQueryKey(presentationId),
		queryFn: async (): Promise<OutlineContentsRow | null> => {
			const { data, error } = await supabase
				.from("outline_contents")
				.select("*")
				.eq("presentation_id", presentationId)
				.maybeSingle();

			if (error) throw error;
			if (!data) return null;

			return {
				...data,
				sections: (data.sections ?? []) as unknown as OutlineSection[],
			};
		},
		staleTime: 5 * 60 * 1000,
		gcTime: 30 * 60 * 1000,
	});
}

export function useSaveOutlineSections(presentationId: string) {
	const supabase = useSupabase();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (sections: OutlineSection[]) => {
			const { data, error } = await supabase
				.from("outline_contents")
				.update({
					sections: JSON.parse(JSON.stringify(sections)),
					updated_at: new Date().toISOString(),
				})
				.eq("presentation_id", presentationId)
				.select()
				.single();

			if (error) throw error;

			return {
				...data,
				sections: (data.sections ?? []) as unknown as OutlineSection[],
			};
		},
		onMutate: async (newSections) => {
			await queryClient.cancelQueries({
				queryKey: outlineQueryKey(presentationId),
			});

			const previous = queryClient.getQueryData<OutlineContentsRow | null>(
				outlineQueryKey(presentationId),
			);

			if (previous) {
				queryClient.setQueryData(outlineQueryKey(presentationId), {
					...previous,
					sections: newSections,
				});
			}

			return { previous };
		},
		onError: (_err, _newSections, context) => {
			if (context?.previous) {
				queryClient.setQueryData(
					outlineQueryKey(presentationId),
					context.previous,
				);
			}
		},
		onSettled: () => {
			queryClient.invalidateQueries({
				queryKey: outlineQueryKey(presentationId),
			});
		},
	});
}
