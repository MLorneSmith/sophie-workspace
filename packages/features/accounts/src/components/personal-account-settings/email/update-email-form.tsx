'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CheckIcon } from '@radix-ui/react-icons';
import { Mail } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useUpdateUser } from '@kit/supabase/hooks/use-update-user-mutation';
import { Alert, AlertDescription, AlertTitle } from '@kit/ui/alert';
import { Button } from '@kit/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@kit/ui/form';
import { If } from '@kit/ui/if';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@kit/ui/input-group';
import { toast } from '@kit/ui/sonner';
import { Trans } from '@kit/ui/trans';

import { UpdateEmailSchema } from '../../../schema/update-email.schema';

function createEmailResolver(currentEmail: string, errorMessage: string) {
  return zodResolver(
    UpdateEmailSchema.withTranslation(errorMessage).refine((schema) => {
      return schema.email !== currentEmail;
    }),
  );
}

export function UpdateEmailForm({
  email,
  callbackPath,
}: {
  email: string;
  callbackPath: string;
}) {
  const { t } = useTranslation('account');
  const updateUserMutation = useUpdateUser();

  const updateEmail = ({ email }: { email: string }) => {
    // then, we update the user's email address
    const promise = async () => {
      const redirectTo = new URL(
        callbackPath,
        window.location.origin,
      ).toString();

      await updateUserMutation.mutateAsync({ email, redirectTo });
    };

    toast.promise(promise, {
      success: t(`updateEmailSuccess`),
      loading: t(`updateEmailLoading`),
      error: t(`updateEmailError`),
    });
  };

  const form = useForm({
    resolver: createEmailResolver(email, t('emailNotMatching')),
    defaultValues: {
      email: '',
      repeatEmail: '',
    },
  });

  return (
    <Form {...form}>
      <form
        className={'flex flex-col space-y-4'}
        data-test={'account-email-form'}
        onSubmit={form.handleSubmit(updateEmail)}
      >
        <If condition={updateUserMutation.data}>
          <Alert variant={'success'}>
            <CheckIcon className={'h-4'} />

            <AlertTitle>
              <Trans i18nKey={'account:updateEmailSuccess'} />
            </AlertTitle>

            <AlertDescription>
              <Trans i18nKey={'account:updateEmailSuccessMessage'} />
            </AlertDescription>
          </Alert>
        </If>

        <div className={'flex flex-col space-y-4'}>
          <div className="flex flex-col space-y-2">
            <FormField
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <InputGroup className="dark:bg-background">
                      <InputGroupAddon align="inline-start">
                        <Mail className="h-4 w-4" />
                      </InputGroupAddon>

                      <InputGroupInput
                        data-test={'account-email-form-email-input'}
                        required
                        type={'email'}
                        placeholder={t('account:newEmail')}
                        {...field}
                      />
                    </InputGroup>
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
              name={'email'}
            />

            <FormField
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <InputGroup className="dark:bg-background">
                      <InputGroupAddon align="inline-start">
                        <Mail className="h-4 w-4" />
                      </InputGroupAddon>

                      <InputGroupInput
                        {...field}
                        data-test={'account-email-form-repeat-email-input'}
                        required
                        type={'email'}
                        placeholder={t('account:repeatEmail')}
                      />
                    </InputGroup>
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
              name={'repeatEmail'}
            />
          </div>

          <div>
            <Button disabled={updateUserMutation.isPending}>
              <Trans i18nKey={'account:updateEmailSubmitLabel'} />
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
