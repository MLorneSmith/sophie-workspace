/**
 * Metadata filter types for vector similarity queries.
 *
 * Supports MongoDB-like filter operators for filtering vector search results
 * by metadata fields. This enables multi-tenant retrieval by scoping queries
 * to specific accounts, content types, or other metadata.
 *
 * Supported Operators:
 * - $eq - Equality match
 * - $ne - Not equal
 * - $in - Match any value in array
 * - $nin - Match none of the values in array
 * - $contains - Array contains value
 * - $all - Array contains all values
 * - $size - Array has exact size
 * - $and - Logical AND
 * - $or - Logical OR
 *
 * @example
 * // Match playbooks (global, no account filter)
 * { contentType: { $eq: 'playbook' } }
 *
 * // Match deck history for a specific account
 * { contentType: { $eq: 'deck-history' }, accountId: { $eq: 'acc_123' } }
 *
 * // Match multiple content types
 * { contentType: { $in: ['deck-history', 'uploaded-doc'] }, accountId: { $eq: 'acc_123' } }
 *
 * // Complex filter with OR
 * {
 *   $or: [
 *     { contentType: { $eq: 'playbook' } },
 *     { contentType: { $eq: 'deck-history' }, accountId: { $eq: 'acc_123' } }
 *   ]
 * }
 */
export type MetadataFilter = Record<
	string,
	| unknown
	| {
			$eq?: unknown;
			$ne?: unknown;
			$in?: unknown[];
			$nin?: unknown[];
			$contains?: unknown;
			$all?: unknown[];
			$size?: number;
	  }
> & {
	$and?: MetadataFilter[];
	$or?: MetadataFilter[];
};

/**
 * Filter operator types for type-safe filter construction
 */
export type FilterOperator =
	| { $eq: unknown }
	| { $ne: unknown }
	| { $in: unknown[] }
	| { $nin: unknown[] }
	| { $contains: unknown }
	| { $all: unknown[] }
	| { $size: number };

/**
 * Type guard to check if a value is a filter operator object
 */
export function isFilterOperator(value: unknown): value is FilterOperator {
	if (typeof value !== "object" || value === null) {
		return false;
	}

	const operators = ["$eq", "$ne", "$in", "$nin", "$contains", "$all", "$size"];
	return operators.some((op) => op in value);
}
