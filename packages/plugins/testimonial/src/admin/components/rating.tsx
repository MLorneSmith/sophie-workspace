"use client";

export function Rating(props: { rating: number }) {
	const stars = `<span class="text-yellow-400">★</span>`.repeat(
		props.rating ?? 0,
	);

	// biome-ignore lint/security/noDangerouslySetInnerHtml: Rendering trusted star rating HTML
	return <div dangerouslySetInnerHTML={{ __html: stars }} />;
}
