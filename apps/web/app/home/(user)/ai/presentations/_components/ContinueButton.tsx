"use client";

import { Button } from "@kit/ui/button";

export function ContinueButton(props: {
	enabled: boolean;
	onContinue: () => void;
	hint?: string;
	label?: string;
}) {
	const { enabled, onContinue, hint, label } = props;

	return (
		<div className="mt-10 flex flex-col items-end gap-2 border-t border-white/5 pt-6">
			{!enabled && hint ? (
				<p className="text-sm text-muted-foreground">{hint}</p>
			) : null}

			<Button
				type="button"
				onClick={onContinue}
				disabled={!enabled}
				className={
					enabled
						? "bg-[#24a9e0] text-black hover:bg-[#24a9e0]/90"
						: "bg-muted text-muted-foreground"
				}
			>
				{label ?? "Continue"}
			</Button>
		</div>
	);
}
