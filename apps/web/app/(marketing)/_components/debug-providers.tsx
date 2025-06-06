"use client";

import { useQueryClient } from "@tanstack/react-query";

export function DebugProviders() {
  try {
    const queryClient = useQueryClient();
    console.log("QueryClient available:", !!queryClient);
    return <div>Providers OK</div>;
  } catch (error) {
    console.error("QueryClient not available:", error);
    return <div>Providers Error</div>;
  }
}