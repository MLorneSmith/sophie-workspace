import type { SupabaseClient } from "@supabase/supabase-js";
export declare function callPayloadAPI(endpoint: string, options?: RequestInit, supabaseClient?: SupabaseClient): Promise<void>;
