"use client";

import { useEffect, useState } from "react";

import { createPortal } from "react-dom";

import { X } from "lucide-react";

import { Button } from "@kit/ui/button";
import { cn } from "@kit/ui/utils";

interface BookDemoOverlayProps {
	isOpen: boolean;
	onClose: () => void;
}

export function BookDemoOverlay({ isOpen, onClose }: BookDemoOverlayProps) {
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) return null;

	const overlayContent = (
		<div
			className={cn(
				"fixed inset-0 z-[99999]",
				"transition-all duration-200",
				isOpen ? "opacity-100" : "pointer-events-none opacity-0",
			)}
		>
			{/* Backdrop blur */}
			<div className="bg-background/80 fixed inset-0 backdrop-blur-sm" />

			{/* Content container */}
			<div className="fixed inset-0 z-[99999] flex items-center justify-center">
				<div
					className={cn(
						"bg-background relative h-[calc(100vh-4rem)] w-full max-w-[1000px]",
						"overflow-hidden transition-all duration-200",
						isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0",
					)}
				>
					{/* Header */}
					<div className="absolute top-4 right-4 z-[99999]">
						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8 hover:bg-gray-100"
							onClick={onClose}
						>
							<X className="h-5 w-5" />
						</Button>
					</div>

					{/* Calendar */}
					<iframe
						src="https://cal.com/slideheroes.com/demo?embed=true&layout=month_view&theme=dark&hideEventTypeDetails=false"
						className="h-full w-full"
						style={{ border: "none" }}
					/>
				</div>
			</div>
		</div>
	);

	// Create portal to mount overlay directly to document body
	return createPortal(overlayContent, document.body);
}
