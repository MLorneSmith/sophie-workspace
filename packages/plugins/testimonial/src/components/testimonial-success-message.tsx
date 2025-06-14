import { Alert, AlertDescription, AlertTitle } from "@kit/ui/alert";
import { Trans } from "@kit/ui/trans";
import ReactConfetti from "react-confetti";
import { createPortal } from "react-dom";

export function TestimonialSuccessMessage() {
	return (
		<>
			<Alert variant={"success"}>
				<AlertTitle>
					<Trans
						i18nKey={"testimonials:successTitle"}
						defaults={"Thank you!"}
					/>
				</AlertTitle>

				<AlertDescription>
					<Trans
						i18nKey={"testimonials:successDescription"}
						defaults={
							"Your feedback helps us improve our services. We appreciate your time!"
						}
					/>
				</AlertDescription>
			</Alert>

			{createPortal(
				<ReactConfetti numberOfPieces={1000} recycle={false} />,
				document.body,
			)}
		</>
	);
}
