/**
 * ===========================================
 * SUPABASE CLIENT UTILITIES
 * ===========================================
 * Centralized Supabase client creation for ChantiPay
 *
 * This file provides clean, typed Supabase client instances for both
 * browser-side and server-side usage with proper cookie handling.
 */

import { createBrowserClient, createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

/**
 * Creates a Supabase client for use in browser/client components
 *
 * This client uses the anonymous (public) key and is safe to use in
 * client-side code. It respects Row Level Security (RLS) policies.
 *
 * @returns {SupabaseClient<Database>} Typed Supabase browser client
 *
 * @example
 * ```tsx
 * 'use client';
 * import { getSupabaseBrowserClient } from '@/lib/supabaseClient';
 *
 * function MyComponent() {
 *   const supabase = getSupabaseBrowserClient();
 *   // Use supabase client...
 * }
 * ```
 */
export function getSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required'
    );
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}

/**
 * Creates a Supabase client for use in server components and API routes
 *
 * This client handles cookie-based authentication for server-side rendering
 * and API endpoints. It uses the anonymous key and respects RLS policies.
 *
 * IMPORTANT: This function is async and must be awaited
 *
 * @returns {Promise<SupabaseClient<Database>>} Typed Supabase server client
 *
 * @example
 * ```tsx
 * import { getSupabaseServerClient } from '@/lib/supabaseClient';
 *
 * export async function MyServerComponent() {
 *   const supabase = await getSupabaseServerClient();
 *   const { data } = await supabase.from('quotes').select('*');
 *   // ...
 * }
 * ```
 */
export async function getSupabaseServerClient() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required'
    );
  }

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
          // Cookie setting will be handled by middleware in this case.
        }
      },
    },
  });
}

/**
 * Creates a Supabase client with service role key for admin operations
 *
 * ⚠️ WARNING: This client bypasses Row Level Security (RLS) policies!
 * Only use this for trusted server-side operations like:
 * - User management
 * - Webhook handlers
 * - Administrative tasks
 * - Data migrations
 *
 * NEVER expose this client to the browser or use it with untrusted input.
 *
 * @returns {Promise<SupabaseClient<Database>>} Typed Supabase admin client
 *
 * @example
 * ```tsx
 * import { getSupabaseAdminClient } from '@/lib/supabaseClient';
 *
 * export async function POST(request: Request) {
 *   const supabase = await getSupabaseAdminClient();
 *   // TODO: Perform admin operations with caution
 *   // This bypasses RLS policies!
 * }
 * ```
 */
export async function getSupabaseAdminClient() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      'Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required'
    );
  }

  return createServerClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Ignore cookie setting errors in Server Components
        }
      },
    },
  });
}

// ===========================================
// RE-EXPORTS FOR BACKWARD COMPATIBILITY
// ===========================================
// These maintain compatibility with existing code using the old import paths

/**
 * @deprecated Use getSupabaseBrowserClient() instead
 * Kept for backward compatibility with existing code
 */
export { getSupabaseBrowserClient as createClient };
