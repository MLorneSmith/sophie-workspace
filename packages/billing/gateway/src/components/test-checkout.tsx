"use client";

import { Button } from "@kit/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@kit/ui/card";
import { useEffect, useState } from "react";

/**
 * Test checkout component for E2E testing
 * This component simulates the Stripe checkout flow without requiring
 * actual Stripe iframe interaction
 */
export function TestCheckout({
	checkoutToken,
	onClose,
}: {
	checkoutToken: string;
	onClose?: () => void;
}) {
	const [isProcessing, setIsProcessing] = useState(false);

	useEffect(() => {
		// Expose test functions to the window for E2E tests
		if (typeof window !== "undefined") {
			(window as any).__testCheckout = {
				simulateSuccess: async () => {
					setIsProcessing(true);
					// Simulate payment processing
					await new Promise((resolve) => setTimeout(resolve, 1000));

					// Redirect to success page
					const url = new URL(window.location.href);
					// Extract the account path (e.g., "/home/team-name-123" or "/home")
					const basePath = url.pathname.split("/billing")[0];
					const successUrl = `${basePath}/billing/return?session_id=test_${checkoutToken}&success=true`;
					window.location.href = successUrl;
				},
				simulateCancel: () => {
					if (onClose) {
						onClose();
					}
				},
			};
		}

		return () => {
			if (typeof window !== "undefined") {
				delete (window as any).__testCheckout;
			}
		};
	}, [checkoutToken, onClose]);

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			<button
				type="button"
				className="fixed inset-0 bg-background/80 backdrop-blur-sm"
				onClick={onClose}
				onKeyDown={(e) => {
					if (e.key === "Escape" && onClose) {
						onClose();
					}
				}}
				aria-label="Close checkout"
			/>
			<Card
				className="relative z-10 w-full max-w-lg"
				data-test="test-checkout-modal"
			>
				<CardHeader>
					<CardTitle>Test Checkout Mode</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="rounded-lg bg-muted p-4">
						<p className="text-sm text-muted-foreground">
							This is a test checkout for E2E testing.
						</p>
						<p className="mt-2 text-xs font-mono">
							Session: {checkoutToken.substring(0, 20)}...
						</p>
					</div>

					<div className="flex gap-3">
						<Button
							data-test="test-checkout-success"
							onClick={async () => {
								setIsProcessing(true);
								await (window as any).__testCheckout?.simulateSuccess();
							}}
							disabled={isProcessing}
							className="flex-1"
						>
							{isProcessing ? "Processing..." : "Complete Payment"}
						</Button>

						<Button
							data-test="test-checkout-cancel"
							variant="outline"
							onClick={() => {
								(window as any).__testCheckout?.simulateCancel();
							}}
							disabled={isProcessing}
						>
							Cancel
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
