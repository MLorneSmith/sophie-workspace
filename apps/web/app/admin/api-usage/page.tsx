import { AdminGuard } from "@kit/admin/components/admin-guard";
import { PageBody, PageHeader } from "@kit/ui/page";

import { UsageDashboard } from "./_components/usage-dashboard";
import type { UsageStats } from "./_lib/types";

// Fallback sample data to show when no real data is available
const sampleData: UsageStats = {
	totalCost: 0.0,
	totalTokens: 0,
	averageCost: 0.0,
	averageTokens: 0,
	usageByDay: [],
	usageByModel: [],
	usageByFeature: [],
	mostActiveUsers: [],
};

export const metadata = {
	title: "API Usage Dashboard",
	description: "Monitor API usage and costs across your organization",
};

function ApiUsagePage() {
	return (
		<>
			<PageHeader description="API Usage Monitoring" />

			<PageBody>
				<UsageDashboard initialData={sampleData} />
			</PageBody>
		</>
	);
}

export default AdminGuard(ApiUsagePage);
