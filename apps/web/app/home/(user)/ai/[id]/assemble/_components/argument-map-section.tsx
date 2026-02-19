"use client";

import { useCallback, useState } from "react";

import type { ArgumentMapNode } from "../../../_lib/schemas/presentation-artifacts";
import { ArgumentMapEditor } from "./argument-map-editor";

export function ArgumentMapSection() {
	const [tree, setTree] = useState<ArgumentMapNode | null>(null);

	const handleChange = useCallback((next: ArgumentMapNode) => {
		setTree(next);
	}, []);

	return <ArgumentMapEditor value={tree} onChange={handleChange} />;
}
