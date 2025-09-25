export default function DebugColorsPage() {
	return (
		<div className="p-8 space-y-4">
			<h1 className="text-2xl font-bold">Color Debug Page</h1>

			<div className="space-y-2">
				<h2 className="text-lg font-semibold">Text Color Classes</h2>
				<div className="space-y-1">
					<p className="text-foreground">
						text-foreground: This should be #262626
					</p>
					<p className="text-primary">text-primary: This should be #262626</p>
					<p className="text-muted-foreground">
						text-muted-foreground: This should be #525252
					</p>
				</div>
			</div>

			<div className="space-y-2">
				<h2 className="text-lg font-semibold">CSS Variables</h2>
				<div className="space-y-1">
					<p style={{ color: "var(--foreground)" }}>
						var(--foreground): This should be #262626
					</p>
					<p style={{ color: "var(--primary)" }}>
						var(--primary): This should be #262626
					</p>
					<p style={{ color: "var(--muted-foreground)" }}>
						var(--muted-foreground): This should be #525252
					</p>
				</div>
			</div>

			<div className="space-y-2">
				<h2 className="text-lg font-semibold">Direct Hex Colors</h2>
				<div className="space-y-1">
					<p style={{ color: "#262626" }}>
						#262626: Direct hex (expected color)
					</p>
					<p style={{ color: "#525252" }}>
						#525252: Direct hex (expected muted)
					</p>
					<p style={{ color: "#979797" }}>
						#979797: What browser computes (wrong)
					</p>
				</div>
			</div>

			<div className="space-y-2">
				<h2 className="text-lg font-semibold">
					Button Element (Like Auth Page)
				</h2>
				<button
					type="button"
					className="focus-visible:ring-ring items-center justify-center rounded-md text-sm font-medium whitespace-nowrap transition-colors focus-visible:ring-1 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50 border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground border shadow-xs h-9 px-4 py-2 flex w-full gap-x-3 text-center"
				>
					<span className="text-foreground">Sign in with Google</span>
				</button>
			</div>
		</div>
	);
}
