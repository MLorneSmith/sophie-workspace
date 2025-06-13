"use client";

<<<<<<< HEAD
import { useUser } from "@kit/supabase/hooks/use-user";
import { Alert } from "@kit/ui/alert";
import { LoadingOverlay } from "@kit/ui/loading-overlay";
import { Trans } from "@kit/ui/trans";
=======
import { useUser } from '@kit/supabase/hooks/use-user';
import { LoadingOverlay } from '@kit/ui/loading-overlay';
>>>>>>> ab0e1c994805d9ea7eaf1f1baceb38180cf47950

import { UpdatePasswordForm } from "./update-password-form";

export function UpdatePasswordFormContainer(
	props: React.PropsWithChildren<{
		callbackPath: string;
	}>,
) {
	const { data: user, isPending } = useUser();

	if (isPending) {
		return <LoadingOverlay fullPage={false} />;
	}

<<<<<<< HEAD
	if (!user) {
		return null;
	}

	const canUpdatePassword = user.identities?.some(
		(item) => item.provider === "email",
	);

	if (!canUpdatePassword) {
		return <WarnCannotUpdatePasswordAlert />;
	}

	return <UpdatePasswordForm callbackPath={props.callbackPath} user={user} />;
}

function WarnCannotUpdatePasswordAlert() {
	return (
		<Alert variant={"warning"}>
			<Trans i18nKey={"account:cannotUpdatePassword"} />
		</Alert>
	);
}
=======
  if (!user?.email) {
    return null;
  }

  return <UpdatePasswordForm callbackPath={props.callbackPath} user={user} />;
}
>>>>>>> ab0e1c994805d9ea7eaf1f1baceb38180cf47950
