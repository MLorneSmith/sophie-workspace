'use client';

import type { Provider, UserIdentity } from '@supabase/supabase-js';

import { CheckCircle } from 'lucide-react';

import { useLinkIdentityWithProvider } from '@kit/supabase/hooks/use-link-identity-with-provider';
import { useUnlinkUserIdentity } from '@kit/supabase/hooks/use-unlink-user-identity';
import { useUserIdentities } from '@kit/supabase/hooks/use-user-identities';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@kit/ui/alert-dialog';
import { Button } from '@kit/ui/button';
import { If } from '@kit/ui/if';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemHeader,
  ItemMedia,
  ItemTitle,
} from '@kit/ui/item';
import { OauthProviderLogoImage } from '@kit/ui/oauth-provider-logo-image';
import { Separator } from '@kit/ui/separator';
import { toast } from '@kit/ui/sonner';
import { Spinner } from '@kit/ui/spinner';
import { Trans } from '@kit/ui/trans';

export function LinkAccountsList(props: { providers: Provider[] }) {
  const unlinkMutation = useUnlinkUserIdentity();
  const linkMutation = useLinkIdentityWithProvider();

  const {
    identities,
    hasMultipleIdentities,
    isProviderConnected,
    isLoading: isLoadingIdentities,
  } = useUserIdentities();

  // Only show providers from the allowed list that aren't already connected
  const availableProviders = props.providers.filter(
    (provider) => !isProviderConnected(provider),
  );

  // Show all connected identities, even if their provider isn't in the allowed providers list
  const connectedIdentities = identities;

  const handleUnlinkAccount = (identity: UserIdentity) => {
    const promise = unlinkMutation.mutateAsync(identity);

    toast.promise(promise, {
      loading: <Trans i18nKey={'account:unlinkingAccount'} />,
      success: <Trans i18nKey={'account:accountUnlinked'} />,
      error: <Trans i18nKey={'account:unlinkAccountError'} />,
    });
  };

  const handleLinkAccount = (provider: Provider) => {
    const promise = linkMutation.mutateAsync(provider);

    toast.promise(promise, {
      loading: <Trans i18nKey={'account:linkingAccount'} />,
      success: <Trans i18nKey={'account:accountLinked'} />,
      error: <Trans i18nKey={'account:linkAccountError'} />,
    });
  };

  if (isLoadingIdentities) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Linked Accounts Section */}
      <If condition={connectedIdentities.length > 0}>
        <div className="space-y-3">
          <div>
            <h3 className="text-foreground text-sm font-medium">
              <Trans i18nKey={'account:linkedAccounts'} />
            </h3>

            <p className="text-muted-foreground text-xs">
              <Trans i18nKey={'account:alreadyLinkedAccountsDescription'} />
            </p>
          </div>

          <div className="flex flex-col space-y-2">
            {connectedIdentities.map((identity) => (
              <Item key={identity.id} variant="outline">
                <ItemMedia>
                  <OauthProviderLogoImage providerId={identity.provider} />
                </ItemMedia>

                <ItemContent>
                  <ItemHeader className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <ItemTitle className="flex items-center gap-x-2 text-sm font-medium capitalize">
                        <CheckCircle className="h-3 w-3 text-green-500" />

                        <span>{identity.provider}</span>
                      </ItemTitle>

                      <If condition={identity.identity_data?.email}>
                        <ItemDescription>
                          {identity.identity_data?.email as string}
                        </ItemDescription>
                      </If>
                    </div>
                  </ItemHeader>
                </ItemContent>

                <ItemActions>
                  <If condition={hasMultipleIdentities}>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={unlinkMutation.isPending}
                        >
                          <If condition={unlinkMutation.isPending}>
                            <Spinner className="mr-2 h-3 w-3" />
                          </If>
                          <Trans i18nKey={'account:unlinkAccount'} />
                        </Button>
                      </AlertDialogTrigger>

                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            <Trans i18nKey={'account:confirmUnlinkAccount'} />
                          </AlertDialogTitle>

                          <AlertDialogDescription>
                            <Trans
                              i18nKey={'account:unlinkAccountConfirmation'}
                              values={{ provider: identity.provider }}
                            />
                          </AlertDialogDescription>
                        </AlertDialogHeader>

                        <AlertDialogFooter>
                          <AlertDialogCancel>
                            <Trans i18nKey={'common:cancel'} />
                          </AlertDialogCancel>

                          <AlertDialogAction
                            onClick={() => handleUnlinkAccount(identity)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            <Trans i18nKey={'account:unlinkAccount'} />
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </If>
                </ItemActions>
              </Item>
            ))}
          </div>
        </div>
      </If>

      {/* Available Accounts Section */}
      <If condition={availableProviders.length > 0}>
        <Separator />

        <div className="space-y-3">
          <div>
            <h3 className="text-foreground text-sm font-medium">
              <Trans i18nKey={'account:availableAccounts'} />
            </h3>

            <p className="text-muted-foreground text-xs">
              <Trans i18nKey={'account:availableAccountsDescription'} />
            </p>
          </div>

          <div className="flex flex-col space-y-2">
            {availableProviders.map((provider) => (
              <Item
                key={provider}
                variant="outline"
                onClick={() => handleLinkAccount(provider)}
                role="button"
                className="hover:bg-muted/50"
              >
                <ItemMedia>
                  <OauthProviderLogoImage providerId={provider} />
                </ItemMedia>

                <ItemContent>
                  <ItemTitle className="capitalize">{provider}</ItemTitle>

                  <ItemDescription>
                    <Trans
                      i18nKey={'account:linkAccountDescription'}
                      values={{ provider }}
                    />
                  </ItemDescription>
                </ItemContent>
              </Item>
            ))}
          </div>
        </div>
      </If>

      <If
        condition={
          connectedIdentities.length === 0 && availableProviders.length === 0
        }
      >
        <div className="text-muted-foreground py-8 text-center">
          <Trans i18nKey={'account:noAccountsAvailable'} />
        </div>
      </If>
    </div>
  );
}
