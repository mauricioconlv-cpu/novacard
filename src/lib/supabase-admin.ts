import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// We need an admin client to bypass RLS for fetching the user profile 
// since public users cannot normally read the `users` table.
// If the service_role key is not available, we will fallback to anon key and hope RLS allows it, 
// or we will handle the null profile gracefully.
export async function createAdminClient() {
    const cookieStore = await cookies();

    // Fallback to anon key if service role is missing in dev environment
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        key,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll() {
                    // Read-only for admin client
                },
            },
        }
    );
}
