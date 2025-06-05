"use client";

import { PageBody } from "@kit/ui/page";

import { SetupForm } from "./_components/BlocksForm";
import { SetupFormProvider } from "./_components/BlocksFormContext";
import { SetupFormErrorBoundary } from "./_components/BlocksFormErrorBoundary";
import { ErrorProvider } from "./error/ErrorContext";

interface SetupMultistepFormProps {
	userId: string;
}

export default function SetupMultistepForm({
	userId: _userId,
}: SetupMultistepFormProps) {
	return (
		<PageBody>
			<ErrorProvider>
				<SetupFormErrorBoundary _componentName="setup-multistep-form">
					<SetupFormProvider>
						<SetupForm _userId={_userId} />
					</SetupFormProvider>
				</SetupFormErrorBoundary>
			</ErrorProvider>
		</PageBody>
	);
}
