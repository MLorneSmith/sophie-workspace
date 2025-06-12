

declare module "@supabase/storage-js" {
	interface StorageFileApi {
		/**
		 * Creates a policy for the storage bucket
		 * @param options Policy options
		 * @returns Promise with the result of the policy creation
		 */
		createPolicy(options: {
			name: string;
			allowed_operations: string[];
			definition: string;
		}): Promise<{ data: any; error: any }>;
	}
}
