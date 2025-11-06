"use client";

import { Button } from "@kit/ui/button";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@kit/ui/input-group";
import { Eye, EyeOff, Lock } from "lucide-react";
import { useState } from "react";

export function PasswordInput(
	props: React.ComponentProps<"input"> & { "data-testid"?: string },
) {
	const [showPassword, setShowPassword] = useState(false);
	const { "data-testid": dataTestId, ...inputProps } = props;

	return (
		<InputGroup className="dark:bg-background">
			<InputGroupAddon>
				<Lock className="h-4 w-4" />
			</InputGroupAddon>

			<InputGroupInput
				data-test="password-input"
				data-testid={dataTestId}
				type={showPassword ? "text" : "password"}
				placeholder={"************"}
				aria-label="Password"
				{...inputProps}
			/>

			<InputGroupAddon align="inline-end">
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={() => setShowPassword(!showPassword)}
					aria-label={showPassword ? "Hide password" : "Show password"}
				>
					{showPassword ? (
						<EyeOff className="h-4 w-4" />
					) : (
						<Eye className="h-4 w-4" />
					)}
				</Button>
			</InputGroupAddon>
		</InputGroup>
	);
}
