export default function TestColorsPage() {
	return (
		<div className="p-8 bg-white">
			<h1 className="text-2xl mb-4">Color Test Page</h1>

			<div className="space-y-4">
				<div>
					<p className="text-foreground">Text with text-foreground class</p>
					<p className="text-sm text-gray-500">
						Expected: #262626 (hsl(0 0% 15%))
					</p>
				</div>

				<div>
					<p className="text-muted-foreground">
						Text with text-muted-foreground class
					</p>
					<p className="text-sm text-gray-500">
						Expected: #525252 (hsl(0 0% 32%))
					</p>
				</div>

				<div>
					<p style={{ color: "hsl(0 0% 15%)" }}>Text with inline HSL color</p>
					<p className="text-sm text-gray-500">Inline style: hsl(0 0% 15%)</p>
				</div>

				<div>
					<p style={{ color: "#262626" }}>Text with inline hex color</p>
					<p className="text-sm text-gray-500">Inline style: #262626</p>
				</div>

				<div>
					<p style={{ color: "hsl(var(--foreground))" }}>
						Text with CSS variable
					</p>
					<p className="text-sm text-gray-500">
						Inline style: hsl(var(--foreground))
					</p>
				</div>
			</div>
		</div>
	);
}
