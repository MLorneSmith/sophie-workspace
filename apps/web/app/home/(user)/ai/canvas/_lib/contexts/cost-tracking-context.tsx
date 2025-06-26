"use client";

import { useUser } from "@kit/supabase/hooks/use-user";
import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useState,
} from "react";
import { v4 as uuidv4 } from "uuid";

// Client-safe logger wrapper
const logger = {
	error: (...args: unknown[]) => {
		if (process.env.NODE_ENV === "development") {
			// biome-ignore lint/suspicious/noConsole: Development logging is allowed
			console.error(...args);
		}
	},
};

// Define the context type
type CostTrackingContextType = {
	sessionCost: number;
	sessionId: string;
	addCost: (cost: number) => void;
	isLoading: boolean;
};

// Create the context with undefined as default to enable error detection
const CostTrackingContext = createContext<CostTrackingContextType | undefined>(
	undefined,
);

// Create the provider component
export function CostTrackingProvider({ children }: { children: ReactNode }) {
	const [sessionCost, setSessionCost] = useState(0);
	const [sessionId, setSessionId] = useState("");
	const [isLoading, setIsLoading] = useState(true);
	const userQuery = useUser();

	// Initialize the session ID and load initial costs
	useEffect(() => {
		if (!userQuery.data) return;
		// Generate a unique session ID when the component mounts
		const newSessionId = uuidv4();
		setSessionId(newSessionId);

		// Fetch initial costs (if any) for this session
		async function fetchInitialCosts() {
			try {
				setIsLoading(true);
				const response = await fetch("/api/ai-usage/session-cost");
				const data = await response.json();

				if (data.success) {
					setSessionCost(data.cost || 0);
				}
			} catch (_error) {
				logger.error("Failed to fetch initial costs:", {
					error: _error,
					sessionId: newSessionId,
				});
			} finally {
				setIsLoading(false);
			}
		}

		fetchInitialCosts();
	}, [userQuery.data]);

	// Function to add new costs
	const addCost = (cost: number) => {
		setSessionCost((prevCost) => prevCost + cost);
	};

	return (
		<CostTrackingContext.Provider
			value={{
				sessionCost,
				sessionId,
				addCost,
				isLoading,
			}}
		>
			{children}
		</CostTrackingContext.Provider>
	);
}

// Custom hook to use the context
export function useCostTracking() {
	const context = useContext(CostTrackingContext);

	if (context === undefined) {
		throw new Error(
			"useCostTracking must be used within a CostTrackingProvider",
		);
	}

	return context;
}
