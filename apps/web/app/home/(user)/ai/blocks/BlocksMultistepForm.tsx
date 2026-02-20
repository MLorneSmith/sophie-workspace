"use client";

import { PageBody } from "@kit/ui/page";

import { SetupForm } from "./_components/BlocksForm";
import { SetupFormProvider } from "./_components/BlocksFormContext";
import { SetupFormErrorBoundary } from "./_components/BlocksFormErrorBoundary";
import { ErrorProvider } from "./error/ErrorContext";

interface SetupMultistepFormProps {
	userId: string;
	mode?: "blocks" | "assemble";
	presentationId?: string;
	initialFormData?: import("./_components/BlocksFormContext").FormData;
}

export default function SetupMultistepForm({
	userId,
	mode = "blocks",
	presentationId,
	initialFormData,
}: SetupMultistepFormProps) {
	return (
		<PageBody>
			<ErrorProvider>
				<SetupFormErrorBoundary _componentName="setup-multistep-form">
					<SetupFormProvider initialFormData={initialFormData}>
						<SetupForm
							userId={userId}
							mode={mode}
							presentationId={presentationId}
						/>
					</SetupFormProvider>
				</SetupFormErrorBoundary>
			</ErrorProvider>
		</PageBody>
	);
}
