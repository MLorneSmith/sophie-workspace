import { UsageDashboard } from './_components/usage-dashboard';
import type { UsageStats } from './_lib/types';

// Default sample data to show before actual data is loaded
const sampleData: UsageStats = {
  totalCost: 42.85,
  totalTokens: 3589420,
  averageCost: 0.085,
  averageTokens: 7178,
  usageByDay: [
    { date: '2025-04-09', cost: 3.42, tokens: 285000 },
    { date: '2025-04-10', cost: 5.18, tokens: 432500 },
    { date: '2025-04-11', cost: 4.75, tokens: 395800 },
    { date: '2025-04-12', cost: 6.21, tokens: 517500 },
    { date: '2025-04-13', cost: 7.48, tokens: 623300 },
    { date: '2025-04-14', cost: 8.25, tokens: 687600 },
    { date: '2025-04-15', cost: 7.56, tokens: 630000 },
  ],
  usageByModel: [
    { model: 'gpt-4', cost: 25.72, tokens: 857350 },
    { model: 'gpt-3.5-turbo', cost: 5.23, tokens: 1742850 },
    { model: 'claude-3-opus', cost: 8.65, tokens: 576250 },
    { model: 'claude-3-sonnet', cost: 3.25, tokens: 412970 },
  ],
  usageByFeature: [
    { feature: 'outline-suggestions', cost: 18.35, tokens: 1527900 },
    { feature: 'canvas-editor', cost: 12.45, tokens: 1037700 },
    { feature: 'powerpoint-export', cost: 8.75, tokens: 729200 },
    { feature: 'other', cost: 3.3, tokens: 274620 },
  ],
  mostActiveUsers: [
    { user: 'user_123', cost: 8.45, tokens: 704150 },
    { user: 'user_456', cost: 7.32, tokens: 610000 },
    { user: 'user_789', cost: 6.78, tokens: 565000 },
    { user: 'user_321', cost: 5.65, tokens: 470800 },
    { user: 'user_654', cost: 4.85, tokens: 404150 },
  ],
};

export const metadata = {
  title: 'AI Usage Dashboard',
  description: 'Monitor AI API usage and costs across your organization',
};

export default function AiUsageDashboardPage() {
  // Use sample data until the DB schema is fully applied and real data can be fetched
  const initialData = sampleData;

  return (
    <div className="container py-6">
      <UsageDashboard initialData={initialData} />
    </div>
  );
}
