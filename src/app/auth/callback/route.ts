import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * ===========================================
 * Auth Callback Route
 * ===========================================
 * GET /auth/callback
 *
 * Gère la redirection depuis Supabase après:
 * - Confirmation d'email (inscription classique)
 * - Authentification OAuth (Google, Apple)
 *
 * Flow:
 * 1. Récupère le code d'authentification
 * 2. Échange le code contre une session
 * 3. Crée le profil si première connexion OAuth
 * 4. Redirige vers dashboard ou mobile
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') || '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Vérifier si le profil existe déjà
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .maybeSingle()

      // Si c'est la première connexion OAuth, créer le profil automatiquement
      if (!existingProfile) {
        const { error: profileError } = await supabase.from('profiles').insert({
          id: data.user.id,
          email: data.user.email || '',
          full_name:
            data.user.user_metadata?.full_name ||
            data.user.user_metadata?.name ||
            data.user.email?.split('@')[0] ||
            '',
          company_name: data.user.user_metadata?.company_name || '',
          phone: data.user.user_metadata?.phone || '',
          company_address: data.user.user_metadata?.address || '',
          company_phone: data.user.user_metadata?.phone || '',
          company_email: data.user.email || '',
          siret: data.user.user_metadata?.siret || '',
        })

        if (profileError) {
          console.error('Error creating OAuth profile:', profileError)
          // Continue quand même, le profil sera créé plus tard si nécessaire
        }
      }

      // Successful authentication - redirect
      return NextResponse.redirect(new URL(next, request.url))
    }

    if (error) {
      console.error('OAuth callback error:', error)
    }
  }

  // If there's an error or no code, redirect to login with error
  return NextResponse.redirect(new URL('/login?error=auth', request.url))
}
