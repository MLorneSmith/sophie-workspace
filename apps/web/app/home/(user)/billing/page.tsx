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
import { withI18n } from "~/lib/i18n/with-i18n";
import { requireUserInServerComponent } from "~/lib/server/require-user-in-server-component";

// local imports
import { HomeLayoutPageHeader } from "../_components/home-page-header";
import { PersonalAccountCheckoutForm } from "./_components/personal-account-checkout-form";
import { loadPersonalAccountBillingPageData } from "./_lib/server/personal-account-billing-page.loader";
import { createPersonalAccountBillingPortalSession } from "./_lib/server/server-actions";

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

	return (
		<>
			<HomeLayoutPageHeader
				title={<Trans i18nKey={"common:routes.billing"} />}
				description={<AppBreadcrumbs />}
			/>

			<PageBody>
				<div className={"flex flex-col space-y-4"}>
					<If
						condition={data}
						fallback={
							<div className={"flex w-full max-w-2xl flex-col space-y-6"}>
								<PersonalAccountCheckoutForm customerId={customerId} />

								<If condition={customerId}>
									<CustomerBillingPortalForm />
								</If>
							</div>
						}
					>
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
