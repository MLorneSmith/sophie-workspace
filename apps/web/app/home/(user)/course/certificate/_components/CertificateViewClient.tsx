"use client";

import { Button } from "@kit/ui/button";
import { Card, CardContent } from "@kit/ui/card";
import { ChevronLeft, Download } from "lucide-react";
import Link from "next/link";

interface CertificateViewClientProps {
	certificateUrl: string;
}

export function CertificateViewClient({
	certificateUrl,
}: CertificateViewClientProps) {
	const handleDownload = () => {
		window.open(certificateUrl, "_blank");
	};

	return (
		<div className="container mx-auto max-w-4xl p-4">
			<Card>
				<CardContent className="p-6">
					<div className="mb-4 flex justify-between">
						<Link href="/home/course">
							<Button variant="outline">
								<ChevronLeft className="mr-2 h-4 w-4" />
								Back to Course
							</Button>
						</Link>
						<Button onClick={handleDownload}>
							<Download className="mr-2 h-4 w-4" />
							Download Certificate
						</Button>
					</div>

					<div className="flex justify-center">
						<iframe
							src={certificateUrl}
							className="h-[800px] w-full rounded-lg border border-gray-200"
							title="Course Completion Certificate"
						/>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
