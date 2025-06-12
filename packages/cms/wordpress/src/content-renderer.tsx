

export function WordpressContentRenderer(props: { content: unknown }) {
	// biome-ignore lint/security/noDangerouslySetInnerHtml: Rendering trusted WordPress CMS content
	return <div dangerouslySetInnerHTML={{ __html: props.content as string }} />;
}
