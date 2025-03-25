import 'server-only';
// Import from the package alias
import { getSupabaseServerClient } from '@kit/supabase/server-client';
/**
 * Get the server session in a server-only context
 * This isolates the server-only imports to avoid issues with dynamic routes
 */
export async function getServerSession() {
    try {
        const supabase = getSupabaseServerClient();
        const { data } = await supabase.auth.getSession();
        return data.session;
    }
    catch (error) {
        console.error('Failed to get server session:', error);
        return null;
    }
}
