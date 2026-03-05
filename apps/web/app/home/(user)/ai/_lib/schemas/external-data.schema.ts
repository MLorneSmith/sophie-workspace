import { z } from "zod";

/**
 * Financial data from Alpha Vantage API for public companies.
 * All fields optional to handle partial API responses.
 */
export const AlphaVantageDataSchema = z.object({
	// Company overview
	revenue: z.number().nullable().optional(),
	grossMargin: z.number().nullable().optional(),
	operatingMargin: z.number().nullable().optional(),
	profitMargin: z.number().nullable().optional(),
	stockPrice: z.number().nullable().optional(),
	week52High: z.number().nullable().optional(),
	week52Low: z.number().nullable().optional(),

	// Market data
	marketCap: z.number().nullable().optional(),
	ebitda: z.number().nullable().optional(),
	eps: z.number().nullable().optional(),
	dividendYield: z.number().nullable().optional(),
	movingAvg50: z.number().nullable().optional(),
	movingAvg200: z.number().nullable().optional(),
	fiscalYearEnd: z.string().nullable().optional(),

	// Analyst ratings
	analystConsensus: z.string().nullable().optional(),
	analystBuyCount: z.number().nullable().optional(),
	analystHoldCount: z.number().nullable().optional(),
	analystSellCount: z.number().nullable().optional(),

	// Valuation
	peRatio: z.number().nullable().optional(),
	industryAvgPeRatio: z.number().nullable().optional(),
	beta: z.number().nullable().optional(),
});

export type AlphaVantageDataInput = z.infer<typeof AlphaVantageDataSchema>;

/**
 * Regulatory filing data from SEC EDGAR.
 * All fields optional since not all companies have recent filings.
 */
const RevenueByYearSchema = z.object({
	year: z.number(),
	amount: z.number(),
});

const EightKEventSchema = z.object({
	date: z.string(),
	type: z.string(),
	summary: z.string(),
});

export const SecEdgarDataSchema = z.object({
	/** Risk factors from the most recent 10-K filing */
	riskFactors: z.array(z.string()).optional(),
	/** Management Discussion & Analysis summary */
	mdaSummary: z.string().nullable().optional(),
	/** Historical revenue by fiscal year */
	revenueByYear: z.array(RevenueByYearSchema).optional(),
	/** Recent 8-K events (filing date, event type, summary) */
	recentEightKEvents: z.array(EightKEventSchema).optional(),
});

export type SecEdgarDataInput = z.infer<typeof SecEdgarDataSchema>;
