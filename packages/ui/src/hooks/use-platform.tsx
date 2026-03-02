import * as React from "react";

export function usePlatform() {
	const [isMac, setIsMac] = React.useState<boolean | undefined>(undefined);

	React.useEffect(() => {
		const userAgent = navigator.userAgent;
		setIsMac(/Mac|iPhone|iPad|iPod/.test(userAgent));
	}, []);

	const formatShortcut = React.useCallback(
		(shortcut: string): string => {
			if (!isMac) {
				return shortcut;
			}

			// Replace Ctrl with ⌘, Shift with ⇧, and remove + separators
			return shortcut
				.replace(/Ctrl\+/g, "⌘")
				.replace(/Shift\+/g, "⇧")
				.replace(/\+/g, "");
		},
		[isMac],
	);

	return { isMac: !!isMac, formatShortcut };
}
