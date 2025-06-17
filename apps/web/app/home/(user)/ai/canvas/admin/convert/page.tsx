"use client";

import { Button } from "@kit/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@kit/ui/card";
import { Spinner } from "@kit/ui/spinner";
import { useState } from "react";

import { convertExistingRecordsToTiptap } from "../../_actions/convert-editor-data";


export default function ConvertEditorDataPage() {
	const [isConverting, setIsConverting] = useState(false);
	const [results, setResults] = useState<unknown>(null);
	const [error, setError] = useState<string | null>(null);

	const handleConvert = async () => {
		try {
			setIsConverting(true);
			setError(null);
			setResults(null);

			const result = await convertExistingRecordsToTiptap();
			setResults(result);
		} catch (err) {
			// TODO: Async logger needed
		// (await getLogger()).error("Error converting data:", {
		// data: err,
		// });
			setError(err instanceof Error ? err.message : "Unknown error occurred");
		} finally 
			setIsConverting(false);
	};

	return (
		<div className="container mx-auto py-8">
			<h1 className="mb-6 text-2xl font-bold">Convert Editor Data</h1>
			<Card>
				<CardHeader>
					<CardTitle>Convert Lexical to Tiptap Format</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="mb-4">
						This utility will convert all existing editor content from Lexical
						format to Tiptap format. This is a one-time operation that should be
						run after deploying the Tiptap editor.
					</p>
					<div className="mb-4">
						<Button
							onClick={handleConvert}
							disabled={isConverting}
							className="mr-2"
						>
							{isConverting ? (
								<>
									<Spinner className="mr-2 h-4 w-4" />
									Converting...
								</>
							) : (
								"Start Conversion"
							)}
						</Button>
					</div>

					{error && (
						<div className="mb-4 rounded-md bg-red-50 p-4 text-red-700">
							<p className="font-medium">Error:</p>
							<p>{error}</p>
						</div>
					)}

					{results && (
						<div className="rounded-md bg-gray-50 p-4">
							<h3 className="mb-2 font-medium">Results:</h3>
							<pre className="overflow-auto rounded-md bg-gray-100 p-2 text-sm">
								{JSON.stringify(results, null, 2)}
							</pre>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
