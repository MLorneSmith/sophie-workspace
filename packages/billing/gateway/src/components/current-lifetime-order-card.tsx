import { BadgeCheck } from "lucide-react";

<<<<<<< HEAD
=======
import { PlanSchema, type ProductSchema } from '@kit/billing';
import { Tables } from '@kit/supabase/database';
>>>>>>> ab0e1c994805d9ea7eaf1f1baceb38180cf47950
import {
	type BillingConfig,
	getProductPlanPairByVariantId,
} from "@kit/billing";
import type { Tables } from "@kit/supabase/database";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@kit/ui/card";
import { Trans } from "@kit/ui/trans";

import { CurrentPlanBadge } from "./current-plan-badge";
import { LineItemDetails } from "./line-item-details";

type Order = Tables<"orders">;
type LineItem = Tables<"order_items">;

interface Props {
	order: Order & {
		items: LineItem[];
	};

<<<<<<< HEAD
	config: BillingConfig;
}

export function CurrentLifetimeOrderCard({
	order,
	config,
=======
  product: ProductSchema;
  plan: ReturnType<(typeof PlanSchema)['parse']>;
}

export function CurrentLifetimeOrderCard({
  order,
  product,
  plan,
>>>>>>> ab0e1c994805d9ea7eaf1f1baceb38180cf47950
}: React.PropsWithChildren<Props>) {
	const lineItems = order.items;
	const firstLineItem = lineItems[0];

	if (!firstLineItem) {
		throw new Error("No line items found in subscription");
	}

<<<<<<< HEAD
	const { product, plan } = getProductPlanPairByVariantId(
		config,
		firstLineItem.variant_id,
	);

	if (!product || !plan) {
		throw new Error(
			"Product or plan not found. Did you forget to add it to the billing config?",
		);
	}

	const productLineItems = plan.lineItems;
=======
  const productLineItems = plan.lineItems;
>>>>>>> ab0e1c994805d9ea7eaf1f1baceb38180cf47950

	return (
		<Card>
			<CardHeader>
				<CardTitle>
					<Trans i18nKey="billing:planCardTitle" />
				</CardTitle>

				<CardDescription>
					<Trans i18nKey="billing:planCardDescription" />
				</CardDescription>
			</CardHeader>

			<CardContent className={"gap-y-4 text-sm"}>
				<div className={"flex flex-col space-y-1"}>
					<div className={"flex items-center gap-x-3 text-lg font-semibold"}>
						<BadgeCheck
							className={
								"s-6 fill-green-500 text-white dark:fill-white dark:text-black"
							}
						/>

						<span>{product.name}</span>

						<CurrentPlanBadge status={order.status} />
					</div>
				</div>

				<div>
					<div className="flex flex-col gap-y-1">
						<span className="font-semibold">
							<Trans i18nKey="billing:detailsLabel" />
						</span>

						<LineItemDetails
							lineItems={productLineItems}
							currency={order.currency}
						/>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
