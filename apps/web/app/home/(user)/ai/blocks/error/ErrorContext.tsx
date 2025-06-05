"use client";

import {
	type ReactNode,
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";

import { ErrorCoordinator } from "./coordinator";

interface ErrorContextType {
	coordinator: ErrorCoordinator;
	lastError: Error | null;
	clearError: () => void;
}

const ErrorContext = createContext<ErrorContextType | null>(null);

interface ErrorProviderProps {
	children: ReactNode;
}

export function ErrorProvider({ children }: ErrorProviderProps) {
	const [lastError, setLastError] = useState<Error | null>(null);

	const coordinator = useMemo(() => {
		const coord = new ErrorCoordinator();

		// Register global handler to track last error
		coord.registerGlobal(async (error) => {
			setLastError(error);
			return false; // Allow other handlers to process the error
		});

		return coord;
	}, []);

	const clearError = useCallback(() => {
		setLastError(null);
	}, []);

	// Clean up coordinator on unmount
	useEffect(() => {
		return () => {
			coordinator.clear();
		};
	}, [coordinator]);

	return (
		<ErrorContext.Provider value={{ coordinator, lastError, clearError }}>
			{children}
		</ErrorContext.Provider>
	);
}

export function useError() {
	const context = useContext(ErrorContext);
	if (!context) {
		throw new Error("useError must be used within an ErrorProvider");
	}
	return context;
}

export function useErrorHandler(
	component: string,
	handler: (error: Error) => Promise<boolean>,
) {
	const { coordinator } = useError();

	useEffect(() => {
		const unregister = coordinator.register(component, handler);
		return () => {
			unregister();
		};
	}, [coordinator, component, handler]);
}

// Export the context for use in error boundaries
export const ErrorCoordinatorContext = createContext<ErrorCoordinator | null>(
	null,
);
