"use client";

import { Toaster } from "@kit/ui/sonner";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function RootProviders({ children }: React.PropsWithChildren) {
	return <ReactQueryProvider>{children}</ReactQueryProvider>;
}

function ReactQueryProvider(props: React.PropsWithChildren) {
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						staleTime: 60 * 1000,
					},
				},
			}),
	);

	return (
		<QueryClientProvider client={queryClient}>
			{props.children}

			<Toaster position="top-center" />
		</QueryClientProvider>
	);
}
