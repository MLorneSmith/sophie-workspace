import { Button } from "@kit/ui/button";

import { OauthProviderLogoImage } from "./oauth-provider-logo-image";

export function AuthProviderButton({
	providerId,
	onClick,
	children,
}: React.PropsWithChildren<{
	providerId: string;
	onClick: () => void;
}>) {
	return (
		<Button
			className={"flex w-full gap-x-3 text-center"}
			style={{ backgroundColor: "#ffffff" }}
			data-provider={providerId}
			data-testid={"auth-provider-button"}
			variant={"outline"}
			onClick={onClick}
		>
			<OauthProviderLogoImage providerId={providerId} />

			<span className="font-medium" style={{ color: "#1a1a1a" }}>
				{children}
			</span>
		</Button>
	);
}
