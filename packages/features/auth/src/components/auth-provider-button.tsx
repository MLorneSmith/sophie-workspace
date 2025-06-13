<<<<<<< HEAD
import { Button } from "@kit/ui/button";

import { OauthProviderLogoImage } from "./oauth-provider-logo-image";
=======
import { Button } from '@kit/ui/button';
import { OauthProviderLogoImage } from '@kit/ui/oauth-provider-logo-image';
>>>>>>> ab0e1c994805d9ea7eaf1f1baceb38180cf47950

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
			data-provider={providerId}
			data-test={"auth-provider-button"}
			variant={"outline"}
			onClick={onClick}
		>
			<OauthProviderLogoImage providerId={providerId} />

			<span>{children}</span>
		</Button>
	);
}
