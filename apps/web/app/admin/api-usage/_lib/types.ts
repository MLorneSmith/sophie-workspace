export interface UsageData {
	date: string;
	cost: number;
	tokens: number;
}

export interface UsageStats {
	totalCost: number;
	totalTokens: number;
	averageCost: number;
	averageTokens: number;
	usageByDay: UsageData[];
	usageByModel: {
		model: string;
		cost: number;
		tokens: number;
	}[];
	usageByFeature: {
		feature: string;
		cost: number;
		tokens: number;
	}[];
	mostActiveUsers: {
		user: string;
		cost: number;
		tokens: number;
	}[];
}
