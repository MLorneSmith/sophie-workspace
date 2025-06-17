"use client";

import { createServiceLogger } from "@kit/shared/logger";
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useMemo,
	useRef,
	useState,
} from "react";
import { toast } from "sonner";

// Initialize service logger
const { getLogger } = createServiceLogger("HOME-(USER)");

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface SaveContextType {
	saveStatus: SaveStatus;
	setSaveStatus: (status: SaveStatus) => void;
	manualSave: () => Promise<void>;
	registerSaveCallback: (callback: () => Promise<void>) => void;
}

const SaveContext = createContext<SaveContextType | undefined>(undefined);

interface SaveContextProviderProps {
	children: ReactNode;
}

export function SaveContextProvider({ children }: SaveContextProviderProps) {
	const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
	const saveCallbackRef = useRef<(() => Promise<void>) | null>(null);

	const registerSaveCallback = useCallback((callback: () => Promise<void>) => {
		saveCallbackRef.current = callback;
	}, []);

	const manualSave = useCallback(async () => {
		if (!saveCallbackRef.current) {
			(await getLogger()).warn("No save callback registered");
			return;
		}

		if (saveStatus === "saving") {
			return;
		}

		try {
			setSaveStatus("saving");
			await saveCallbackRef.current();
			setSaveStatus("saved");
			toast.success("Content saved successfully");
			setTimeout(() => setSaveStatus("idle"), 2000);
		} catch (error) {
			setSaveStatus("error");
			toast.error("Failed to save content", {
				description:
					error instanceof Error ? error.message : "An unknown error occurred",
			});
			setTimeout(() => setSaveStatus("idle"), 3000);
		}
	}, [saveStatus]);

	const value = useMemo(
		() => ({
			saveStatus,
			setSaveStatus,
			manualSave,
			registerSaveCallback,
		}),
		[saveStatus, manualSave, registerSaveCallback],
	);

	return <SaveContext.Provider value={value}>{children}</SaveContext.Provider>;
}

export function useSaveContext() {
	const context = useContext(SaveContext);
	if (context === undefined) {
		throw new Error("useSaveContext must be used within a SaveContextProvider");
	}
	return context;
}
