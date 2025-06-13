"use client";

<<<<<<< HEAD
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckIcon, ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";
=======
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckIcon, ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
>>>>>>> ab0e1c994805d9ea7eaf1f1baceb38180cf47950

import { useAppEvents } from "@kit/shared/events";
import { useSignInWithOtp } from "@kit/supabase/hooks/use-sign-in-with-otp";
import { Alert, AlertDescription, AlertTitle } from "@kit/ui/alert";
import { Button } from "@kit/ui/button";
import {
<<<<<<< HEAD
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@kit/ui/form";
import { If } from "@kit/ui/if";
import { Input } from "@kit/ui/input";
import { Trans } from "@kit/ui/trans";

import { useCaptchaToken } from "../captcha/client";
import { TermsAndConditionsFormField } from "./terms-and-conditions-form-field";
=======
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@kit/ui/form';
import { If } from '@kit/ui/if';
import { Input } from '@kit/ui/input';
import { toast } from '@kit/ui/sonner';
import { Trans } from '@kit/ui/trans';

import { useCaptchaToken } from '../captcha/client';
import { useLastAuthMethod } from '../hooks/use-last-auth-method';
import { TermsAndConditionsFormField } from './terms-and-conditions-form-field';
>>>>>>> ab0e1c994805d9ea7eaf1f1baceb38180cf47950

export function MagicLinkAuthContainer({
	inviteToken,
	redirectUrl,
	shouldCreateUser,
	defaultValues,
	displayTermsCheckbox,
}: {
	inviteToken?: string;
	redirectUrl: string;
	shouldCreateUser: boolean;
	displayTermsCheckbox?: boolean;

	defaultValues?: {
		email: string;
	};
}) {
<<<<<<< HEAD
	const { captchaToken, resetCaptchaToken } = useCaptchaToken();
	const { t } = useTranslation();
	const signInWithOtpMutation = useSignInWithOtp();
	const appEvents = useAppEvents();
=======
  const { captchaToken, resetCaptchaToken } = useCaptchaToken();
  const { t } = useTranslation();
  const signInWithOtpMutation = useSignInWithOtp();
  const appEvents = useAppEvents();
  const { recordAuthMethod } = useLastAuthMethod();
>>>>>>> ab0e1c994805d9ea7eaf1f1baceb38180cf47950

	const form = useForm({
		resolver: zodResolver(
			z.object({
				email: z.string().email(),
			}),
		),
		defaultValues: {
			email: defaultValues?.email ?? "",
		},
	});

	const onSubmit = ({ email }: { email: string }) => {
		const url = new URL(redirectUrl);

		if (inviteToken) {
			url.searchParams.set("invite_token", inviteToken);
		}

		const emailRedirectTo = url.href;

		const promise = async () => {
			await signInWithOtpMutation.mutateAsync({
				email,
				options: {
					emailRedirectTo,
					captchaToken,
					shouldCreateUser,
				},
			});

<<<<<<< HEAD
			if (shouldCreateUser) {
				appEvents.emit({
					type: "user.signedUp",
					payload: {
						method: "magiclink",
					},
				});
			}
		};

		toast.promise(promise, {
			loading: t("auth:sendingEmailLink"),
			success: t("auth:sendLinkSuccessToast"),
			error: t("auth:errors.link"),
		});
=======
      recordAuthMethod('magic_link', { email });

      if (shouldCreateUser) {
        appEvents.emit({
          type: 'user.signedUp',
          payload: {
            method: 'magiclink',
          },
        });
      }
    };

    toast.promise(promise, {
      loading: t('auth:sendingEmailLink'),
      success: t(`auth:sendLinkSuccessToast`),
      error: t(`auth:errors.linkTitle`),
    });
>>>>>>> ab0e1c994805d9ea7eaf1f1baceb38180cf47950

		resetCaptchaToken();
	};

	if (signInWithOtpMutation.data) {
		return <SuccessAlert />;
	}

<<<<<<< HEAD
	return (
		<Form {...form}>
			<form className={"w-full"} onSubmit={form.handleSubmit(onSubmit)}>
				<If condition={signInWithOtpMutation.error}>
					<ErrorAlert />
				</If>

				<div className={"flex flex-col space-y-4"}>
					<FormField
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									<Trans i18nKey={"common:emailAddress"} />
								</FormLabel>
=======
  return (
    <Form {...form}>
      <form className={'w-full'} onSubmit={form.handleSubmit(onSubmit)}>
        <div className={'flex flex-col space-y-4'}>
          <If condition={signInWithOtpMutation.error}>
            <ErrorAlert />
          </If>

          <FormField
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <Trans i18nKey={'common:emailAddress'} />
                </FormLabel>
>>>>>>> ab0e1c994805d9ea7eaf1f1baceb38180cf47950

								<FormControl>
									<Input
										data-test={"email-input"}
										required
										type="email"
										placeholder={t("auth:emailPlaceholder")}
										{...field}
									/>
								</FormControl>

								<FormMessage />
							</FormItem>
						)}
						name={"email"}
					/>

					<If condition={displayTermsCheckbox}>
						<TermsAndConditionsFormField />
					</If>

					<Button disabled={signInWithOtpMutation.isPending}>
						<If
							condition={signInWithOtpMutation.isPending}
							fallback={<Trans i18nKey={"auth:sendEmailLink"} />}
						>
							<Trans i18nKey={"auth:sendingEmailLink"} />
						</If>
					</Button>
				</div>
			</form>
		</Form>
	);
}

function SuccessAlert() {
	return (
		<Alert variant={"success"}>
			<CheckIcon className={"h-4"} />

			<AlertTitle>
				<Trans i18nKey={"auth:sendLinkSuccess"} />
			</AlertTitle>

			<AlertDescription>
				<Trans i18nKey={"auth:sendLinkSuccessDescription"} />
			</AlertDescription>
		</Alert>
	);
}

function ErrorAlert() {
	return (
		<Alert variant={"destructive"}>
			<ExclamationTriangleIcon className={"h-4"} />

<<<<<<< HEAD
			<AlertTitle>
				<Trans i18nKey={"auth:errors.generic"} />
			</AlertTitle>

			<AlertDescription>
				<Trans i18nKey={"auth:errors.link"} />
			</AlertDescription>
		</Alert>
	);
=======
      <AlertTitle>
        <Trans i18nKey={'auth:errors.linkTitle'} />
      </AlertTitle>

      <AlertDescription>
        <Trans i18nKey={'auth:errors.linkDescription'} />
      </AlertDescription>
    </Alert>
  );
>>>>>>> ab0e1c994805d9ea7eaf1f1baceb38180cf47950
}
