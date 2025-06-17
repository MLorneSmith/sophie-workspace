import { Checkbox } from "@kit/ui/checkbox";
import { FormControl, FormField, FormItem, FormMessage } from "@kit/ui/form";
import { Trans } from "@kit/ui/trans";
import Link from "next/link";
import { useId } from "react";

export function TermsAndConditionsFormField(props: { name?: string } = {}) {
	const checkboxId = useId();

	return (
		<FormField
			name={props.name ?? "termsAccepted"}
			render={({ field }) => {
				return (
					<FormItem>
						<FormControl>
							<label
								htmlFor={checkboxId}
								className={"flex items-start gap-x-3 py-2"}
							>
								<Checkbox id={checkboxId} required name={field.name} />

								<div className={"text-xs"}>
									<Trans
										i18nKey={"auth:acceptTermsAndConditions"}
										components={{
											TermsOfServiceLink: (
												<Link
													target={"_blank"}
													className={"underline"}
													href={"/terms-of-service"}
												>
													<Trans i18nKey={"auth:termsOfService"} />
												</Link>
											),
											PrivacyPolicyLink: (
												<Link
													target={"_blank"}
													className={"underline"}
													href={"/privacy-policy"}
												>
													<Trans i18nKey={"auth:privacyPolicy"} />
												</Link>
											),
										}}
									/>
								</div>
							</label>
						</FormControl>

						<FormMessage />
					</FormItem>
				);
			}}
		/>
	);
}
