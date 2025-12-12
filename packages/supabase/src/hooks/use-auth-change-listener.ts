"use client";

import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { useSupabase } from "./use-supabase";

/**
 * @name PRIVATE_PATH_PREFIXES
 * @description A list of private path prefixes
 */
const PRIVATE_PATH_PREFIXES = ["/home", "/admin", "/join", "/update-password"];

/**
 * @name AUTH_PATHS
 * @description A list of auth paths
 */
const AUTH_PATHS = ["/auth"];

/**
 * @name useAuthChangeListener
 * @param privatePathPrefixes - A list of private path prefixes
 * @param appHomePath - The path to redirect to when the user is signed out
 * @param onEvent - Callback function to be called when an auth event occurs
 */
export function useAuthChangeListener({
	privatePathPrefixes = PRIVATE_PATH_PREFIXES,
	appHomePath: _appHomePath,
	onEvent,
}: {
	appHomePath: string;
	privatePathPrefixes?: string[];
	onEvent?: (event: AuthChangeEvent, user: Session | null) => void;
}) {
	const client = useSupabase();
	const pathName = usePathname();

	useEffect(() => {
		// keep this running for the whole session unless the component was unmounted
		const listener = client.auth.onAuthStateChange((event, user) => {
			if (onEvent) {
				onEvent(event, user);
			}

			// Only redirect on explicit SIGNED_OUT event, not for initial null user states.
			// During INITIAL_SESSION event, user can be null momentarily before the session
			// loads from localStorage/cookies. We must not redirect during this brief window.
			// See GitHub issue #1109 for root cause analysis.
			if (event === "SIGNED_OUT") {
				// Sometimes Supabase sends SIGNED_OUT event on auth paths, so ignore it there
				if (AUTH_PATHS.some((path) => pathName.startsWith(path))) {
					return;
				}

				// Only redirect if on a private route
				if (isPrivateRoute(pathName, privatePathPrefixes)) {
					window.location.assign("/");
					return;
				}

				// Reload for other routes to clear any stale auth state
				window.location.reload();
			}
		});

		// destroy listener on un-mounts
		return () => listener.data.subscription.unsubscribe();
	}, [client.auth, pathName, privatePathPrefixes, onEvent]);
}

/**
 * Determines if a given path is a private route.
 */
function isPrivateRoute(path: string, privatePathPrefixes: string[]) {
	return privatePathPrefixes.some((prefix) => path.startsWith(prefix));
}
