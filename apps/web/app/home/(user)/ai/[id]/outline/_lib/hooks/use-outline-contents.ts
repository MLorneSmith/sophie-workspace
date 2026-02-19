"use client";

import { useSupabase } from "@kit/supabase/hooks/use-supabase";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { JSONContent } from "@tiptap/react";

function outlineQueryKey(presentationId: string) {
	return ["outline-contents", presentationId] as const;
}

export function useOutlineContents(presentationId: string) {
	const supabase = useSupabase();

	return useQuery({
		queryKey: outlineQueryKey(presentationId),
		queryFn: async (): Promise<JSONContent | null> => {
			const { data, error } = await supabase
				.from("outline_contents")
				.select("*")
				.eq("presentation_id", presentationId)
				.maybeSingle();

			if (error) throw error;
			if (!data) return null;

			// sections JSONB stores the full TipTap document
			const doc = data.sections as unknown as JSONContent;
			if (
				doc &&
				typeof doc === "object" &&
				doc.type === "doc" &&
				Array.isArray(doc.content)
			) {
				return doc;
			}

			return null;
		},
		staleTime: 5 * 60 * 1000,
		gcTime: 30 * 60 * 1000,
	});
}

export function useSaveOutlineContent(presentationId: string) {
	const supabase = useSupabase();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (content: JSONContent) => {
			const { error } = await supabase
				.from("outline_contents")
				.update({
					sections: JSON.parse(JSON.stringify(content)),
					updated_at: new Date().toISOString(),
				})
				.eq("presentation_id", presentationId);

			if (error) throw error;
			return content;
		},
		onMutate: async (newContent) => {
			await queryClient.cancelQueries({
				queryKey: outlineQueryKey(presentationId),
			});

			const previous = queryClient.getQueryData<JSONContent | null>(
				outlineQueryKey(presentationId),
			);

			queryClient.setQueryData(outlineQueryKey(presentationId), newContent);

			return { previous };
		},
		onError: (_err, _newContent, context) => {
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
