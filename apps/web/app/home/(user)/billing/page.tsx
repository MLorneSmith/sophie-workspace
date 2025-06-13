
import { resolveProductPlan } from '@kit/billing-gateway';
import {
	BillingPortalCard,
	CurrentLifetimeOrderCard,
	CurrentSubscriptionCard,
} from "@kit/billing-gateway/components";
import { AppBreadcrumbs } from "@kit/ui/app-breadcrumbs";
import { If } from "@kit/ui/if";
import { PageBody } from "@kit/ui/page";
import { Trans } from "@kit/ui/trans";

import billingConfig from "~/config/billing.config";
import { createI18nServerInstance } from "~/lib/i18n/i18n.server";
import { requireUserInServerComponent } from "~/lib/server/require-user-in-server-component";

// local imports
import { HomeLayoutPageHeader } from "../_components/home-page-header";
import { createPersonalAccountBillingPortalSession } from "../billing/_lib/server/server-actions";
import { PersonalAccountCheckoutForm } from "./_components/personal-account-checkout-form";
import { loadPersonalAccountBillingPageData } from "./_lib/server/personal-account-billing-page.loader";

export const generateMetadata = async () => {
	const i18n = await createI18nServerInstance();
	const title = i18n.t("account:billingTab");

	return {
		title,
	};
};

async function PersonalAccountBillingPage() {
	const user = await requireUserInServerComponent();

	const [data, customerId] = await loadPersonalAccountBillingPageData(user.id);

<<<<<<< HEAD
	return (
		<>
			<HomeLayoutPageHeader
				title={<Trans i18nKey={"common:routes.billing"} />}
				description={<AppBreadcrumbs />}
			/>
=======
  let productPlan: {
    product: ProductSchema;
    plan: z.infer<typeof PlanSchema>;
  } | null = null;

  if (data) {
    const firstLineItem = data.items[0];

    if (firstLineItem) {
      productPlan = await resolveProductPlan(
        billingConfig,
        firstLineItem.variant_id,
        data.currency,
      );
    }
  }

  return (
    <>
      <HomeLayoutPageHeader
        title={<Trans i18nKey={'common:routes.billing'} />}
        description={<AppBreadcrumbs />}
      />
>>>>>>> ab0e1c994805d9ea7eaf1f1baceb38180cf47950

			<PageBody>
				<div className={"flex flex-col space-y-4"}>
					<If condition={!data}>
						<PersonalAccountCheckoutForm customerId={customerId} />

						<If condition={customerId}>
							<CustomerBillingPortalForm />
						</If>
					</If>

<<<<<<< HEAD
					<If condition={data}>
						{(data) => (
							<div className={"flex w-full max-w-2xl flex-col space-y-6"}>
								{"active" in data ? (
									<CurrentSubscriptionCard
										subscription={data}
										config={billingConfig}
									/>
								) : (
									<CurrentLifetimeOrderCard
										order={data}
										config={billingConfig}
									/>
								)}
=======
          <If condition={data}>
            {(data) => (
              <div className={'flex w-full max-w-2xl flex-col space-y-6'}>
                {'active' in data ? (
                  <CurrentSubscriptionCard
                    subscription={data}
                    product={productPlan!.product}
                    plan={productPlan!.plan}
                  />
                ) : (
                  <CurrentLifetimeOrderCard
                    order={data}
                    product={productPlan!.product}
                    plan={productPlan!.plan}
                  />
                )}
>>>>>>> ab0e1c994805d9ea7eaf1f1baceb38180cf47950

								<If condition={!data}>
									<PersonalAccountCheckoutForm customerId={customerId} />
								</If>

								<If condition={customerId}>
									<CustomerBillingPortalForm />
								</If>
							</div>
						)}
					</If>
				</div>
			</PageBody>
		</>
	);
}

export default withI18n(PersonalAccountBillingPage);

function CustomerBillingPortalForm() {
	return (
		<form action={createPersonalAccountBillingPortalSession}>
			<BillingPortalCard />
		</form>
	);
}
