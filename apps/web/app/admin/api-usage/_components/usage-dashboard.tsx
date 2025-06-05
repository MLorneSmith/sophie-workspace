"use client";

import { useEffect, useState } from "react";

import {
	Bar,
	BarChart,
	CartesianGrid,
	Legend,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

import { Button } from "@kit/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@kit/ui/card";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@kit/ui/chart";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@kit/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@kit/ui/tabs";

import { fetchUsageDataAction } from "../_actions/fetch-usage-data";
import type { UsageStats } from "../_lib/types";

interface UsageDashboardProps {
	initialData: UsageStats;
}

export function UsageDashboard({ initialData }: UsageDashboardProps) {
	const [selectedTimeRange, setSelectedTimeRange] = useState("7d");
	const [currentData, setCurrentData] = useState(initialData);
	const [isLoading, setIsLoading] = useState(false);

	// Fetch data on component mount
	useEffect(() => {
		refreshData();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Fetch data from the server
	const refreshData = async () => {
		try {
			setIsLoading(true);

			const result = await fetchUsageDataAction({
				timeRange: selectedTimeRange as "24h" | "7d" | "30d" | "90d",
			});

			if (result.success && result.data) {
				setCurrentData(result.data);
				console.log("Fetched real usage data:", result.data);
			} else {
				console.error("Failed to fetch usage data:", result.error);
			}
		} catch (error) {
			console.error("Error fetching usage data:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleTimeRangeChange = (value: string) => {
		setSelectedTimeRange(value);
		// Trigger a refresh when time range changes
		setTimeout(() => {
			refreshData();
		}, 0);
	};

	// Chart configs for recharts
	const costConfig = {
		cost: { label: "Cost ($)", color: "var(--chart-1)" },
	};

	const tokensConfig = {
		tokens: { label: "Tokens", color: "var(--chart-2)" },
	};

	const modelConfig = {
		cost: { label: "Cost ($)", color: "var(--chart-1)" },
		tokens: { label: "Tokens (K)", color: "var(--chart-2)" },
	};

	const featureConfig = {
		cost: { label: "Cost ($)", color: "var(--chart-3)" },
		tokens: { label: "Tokens (K)", color: "var(--chart-4)" },
	};

	// Format numbers for display
	const formatCost = (cost: number) => `$${cost.toFixed(2)}`;
	const formatTokens = (tokens: number) => {
		if (tokens >= 1_000_000) {
			return `${(tokens / 1_000_000).toFixed(2)}M`;
		}
		if (tokens >= 1_000) {
			return `${(tokens / 1_000).toFixed(2)}K`;
		}
		return tokens.toString();
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-foreground text-2xl font-bold">
					AI Usage Dashboard
				</h1>
				<div className="flex items-center space-x-4">
					<Select
						value={selectedTimeRange}
						onValueChange={handleTimeRangeChange}
					>
						<SelectTrigger className="w-[180px]">
							<SelectValue placeholder="Select time range" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="24h">Last 24 Hours</SelectItem>
							<SelectItem value="7d">Last 7 Days</SelectItem>
							<SelectItem value="30d">Last 30 Days</SelectItem>
							<SelectItem value="90d">Last 90 Days</SelectItem>
						</SelectContent>
					</Select>
					<Button onClick={refreshData} disabled={isLoading}>
						{isLoading ? "Refreshing..." : "Refresh"}
					</Button>
				</div>
			</div>

			{/* Summary cards */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-muted-foreground text-sm font-medium">
							Total Cost
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{formatCost(currentData.totalCost)}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-muted-foreground text-sm font-medium">
							Total Tokens
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{formatTokens(currentData.totalTokens)}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-muted-foreground text-sm font-medium">
							Average Cost per Request
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{formatCost(currentData.averageCost)}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-muted-foreground text-sm font-medium">
							Average Tokens per Request
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{formatTokens(currentData.averageTokens)}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Tabs for different charts */}
			<Tabs defaultValue="daily" className="w-full">
				<TabsList>
					<TabsTrigger value="daily">Daily Usage</TabsTrigger>
					<TabsTrigger value="models">Models</TabsTrigger>
					<TabsTrigger value="features">Features</TabsTrigger>
					<TabsTrigger value="users">Most Active Users</TabsTrigger>
				</TabsList>

				{/* Daily usage chart */}
				<TabsContent value="daily" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Daily Usage</CardTitle>
							<CardDescription>Cost and token usage over time</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="h-[400px]">
								<ChartContainer
									config={costConfig}
									className="min-h-[400px] w-full"
								>
									<BarChart data={currentData.usageByDay} accessibilityLayer>
										<CartesianGrid strokeDasharray="3 3" vertical={false} />
										<XAxis dataKey="date" />
										<YAxis />
										<ChartTooltip content={<ChartTooltipContent />} />
										<Bar dataKey="cost" fill="var(--chart-1)" name="Cost ($)" />
									</BarChart>
								</ChartContainer>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Models chart */}
				<TabsContent value="models" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Usage by Model</CardTitle>
							<CardDescription>
								Cost and token usage by AI model
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="h-[400px]">
								<ChartContainer
									config={modelConfig}
									className="min-h-[400px] w-full"
								>
									<BarChart data={currentData.usageByModel} accessibilityLayer>
										<CartesianGrid strokeDasharray="3 3" vertical={false} />
										<XAxis dataKey="model" />
										<YAxis />
										<ChartTooltip content={<ChartTooltipContent />} />
										<Bar dataKey="cost" fill="var(--chart-1)" name="Cost ($)" />
										<Bar dataKey="tokens" fill="var(--chart-2)" name="Tokens" />
									</BarChart>
								</ChartContainer>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Features chart */}
				<TabsContent value="features" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Usage by Feature</CardTitle>
							<CardDescription>
								Cost and token usage by application feature
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="h-[400px]">
								<ChartContainer
									config={featureConfig}
									className="min-h-[400px] w-full"
								>
									<BarChart
										data={currentData.usageByFeature}
										accessibilityLayer
									>
										<CartesianGrid strokeDasharray="3 3" vertical={false} />
										<XAxis dataKey="feature" />
										<YAxis />
										<ChartTooltip content={<ChartTooltipContent />} />
										<Bar dataKey="cost" fill="var(--chart-3)" name="Cost ($)" />
										<Bar dataKey="tokens" fill="var(--chart-4)" name="Tokens" />
									</BarChart>
								</ChartContainer>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Users chart */}
				<TabsContent value="users" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Most Active Users</CardTitle>
							<CardDescription>
								Top users by cost and token usage
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="h-[400px]">
								<ChartContainer
									config={costConfig}
									className="min-h-[400px] w-full"
								>
									<BarChart
										data={currentData.mostActiveUsers}
										accessibilityLayer
									>
										<CartesianGrid strokeDasharray="3 3" vertical={false} />
										<XAxis dataKey="user" />
										<YAxis />
										<ChartTooltip content={<ChartTooltipContent />} />
										<Bar dataKey="cost" fill="var(--chart-1)" name="Cost ($)" />
									</BarChart>
								</ChartContainer>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
