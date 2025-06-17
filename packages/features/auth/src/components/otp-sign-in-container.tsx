"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useVerifyOtp } from "@kit/supabase/hooks/use-verify-otp";
import { Button } from "@kit/ui/button";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormMessage,
} from "@kit/ui/form";
import { Input } from "@kit/ui/input";
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSeparator,
	InputOTPSlot,
} from "@kit/ui/input-otp";
import { Spinner } from "@kit/ui/spinner";
import { Trans } from "@kit/ui/trans";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { useLastAuthMethod } from "../hooks/use-last-auth-method";
import { AuthErrorAlert } from "./auth-error-alert";

const EmailSchema = z.object({ email: z.string().email() });
const OtpSchema = z.object({ token: z.string().min(6).max(6) });

type OtpSignInContainerProps = {
	onSignIn?: (userId?: string) => void;
	shouldCreateUser: boolean;
	inviteToken?: string;
};

export function OtpSignInContainer(props: OtpSignInContainerProps) {
	const verifyMutation = useVerifyOtp();
	const router = useRouter();
	const params = useSearchParams();
	const { recordAuthMethod } = useLastAuthMethod();

	const otpForm = useForm({
		resolver: zodResolver(OtpSchema.merge(EmailSchema)),
		defaultValues: {
			token: "",
			email: "",
		},
	});

	const email = useWatch({
		control: otpForm.control,
		name: "email",
	// });

	const isEmailStep = !email;

	const shouldCreateUser =
		'shouldCreateUser' in props && props.shouldCreateUser;

	const handleVerifyOtp = async ({
		token,
		email,
	}: {
		token: string;
		email: string;
	}) => {
		const result = await verifyMutation.mutateAsync({
			type: "email",
			email,
			token,
		});

		// Record successful OTP sign-in
		recordAuthMethod("otp", { email });

		if (props.onSignIn) {
			return props.onSignIn(result?.user?.id);
		}

		// on sign ups we redirect to the app home
		const inviteToken = props.inviteToken;
		const next = params.get("next") ?? "/home";

		if (inviteToken) {
			const params = new URLSearchParams({
				invite_token: inviteToken,
				next,
			});

			router.replace(`/join?${params.toString()}`);
		} else {
			router.replace(next);
		}
	};

	if (isEmailStep) {
		return (
			<OtpEmailForm
				shouldCreateUser={shouldCreateUser}
				onSendOtp={(email) => {
					otpForm.setValue("email", email, {
						shouldValidate: true,
					// });
				}}
			/>
		);
	}

	return (
		<>
			<Form {...otpForm}>
				<form
					onSubmit={otpForm.handleSubmit(handleVerifyOtp)}
					className="w-full"
				>
					<FormField
						control={otpForm.control}
						name="token"
						render={({ field }) => (
							<FormItem>
								<FormControl>
									<InputOTP
										maxLength={6}
										disabled={verifyMutation.isPending}
										{...field}
									>
										<InputOTPGroup>
											<InputOTPSlot index={0} />
											<InputOTPSlot index={1} />
											<InputOTPSlot index={2} />
										</InputOTPGroup>
										<InputOTPSeparator />
										<InputOTPGroup>
											<InputOTPSlot index={3} />
											<InputOTPSlot index={4} />
											<InputOTPSlot index={5} />
										</InputOTPGroup>
									</InputOTP>
								</FormControl>
								<FormDescription>
									<Trans i18nKey="auth:verificationCodeHint" />
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>

					<AuthErrorAlert error={verifyMutation.error} />

					<Button
						type="submit"
						className="mt-4 w-full"
						disabled={verifyMutation.isPending}
					>
						{verifyMutation.isPending ? (
							<Spinner className="h-4 w-4" />
						) : (
							<Trans i18nKey="auth:verificationCodeSubmitButtonLabel" />
						)}
					</Button>
				</form>
			</Form>

			<div className="text-sm">
				<button
					type="button"
					onClick={() => otpForm.setValue("email", "")}
					className="text-muted-foreground underline hover:text-foreground"
				>
					<Trans i18nKey="auth:sendEmailCode" />
				</button>
			</div>
		</>
	);
}

function OtpEmailForm({
	shouldCreateUser,
	onSendOtp,
}: {
	shouldCreateUser: boolean;
	onSendOtp: (email: string) => void;
}) {
	const getCaptchaToken = useCaptchaToken();
	const signInMutation = useSignInWithOtp();

	const emailForm = useForm<z.infer<typeof EmailSchema>>({
		resolver: zodResolver(EmailSchema),
		defaultValues: {
			email: "",
		},
	});

	const handleSendOtp = async ({ email }: { email: string }) => {
		const captchaToken = await getCaptchaToken();

		await signInMutation.mutateAsync({
			email,
			options: {
				shouldCreateUser,
				captchaToken,
			},
		});

		onSendOtp(email);
	};

	return (
		<Form {...emailForm}>
			<form
				onSubmit={emailForm.handleSubmit(handleSendOtp)}
				className="space-y-4"
			>
				<FormField
					control={emailForm.control}
					name="email"
					render={({ field }) => (
						<FormItem>
							<FormControl>
								<Input
									type="email"
									placeholder="your@email.com"
									disabled={signInMutation.isPending}
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<AuthErrorAlert error={signInMutation.error} />

				<Button
					type="submit"
					className="w-full"
					disabled={signInMutation.isPending}
				>
					{signInMutation.isPending ? (
						<Spinner className="h-4 w-4" />
					) : (
						<Trans i18nKey="auth:sendEmailCode" />
					)}
				</Button>
			</form>
		</Form>
	);
}