"use client";

import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@kit/ui/input-group";
import { Mail } from "lucide-react";
import { useTranslation } from "react-i18next";

export function EmailInput(
	props: React.ComponentProps<"input"> & { "data-testid"?: string },
) {
	const { t } = useTranslation("auth");
	const { "data-testid": dataTestId, ...inputProps } = props;

	return (
		<InputGroup className="dark:bg-background">
			<InputGroupAddon>
				<Mail className="h-4 w-4" />
			</InputGroupAddon>

			<InputGroupInput
				data-test={"email-input"}
				data-testid={dataTestId}
				required
				type="email"
				placeholder={t("emailPlaceholder")}
				{...inputProps}
			/>
		</InputGroup>
	);
}
