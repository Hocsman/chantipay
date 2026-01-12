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
  const requestUrl = new URL(request.url)
  const { searchParams, origin } = requestUrl
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  const error_description = searchParams.get('error_description')

  // Si erreur OAuth du provider
  if (error_description) {
    console.error('OAuth provider error:', error_description)
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error_description)}`)
  }

  if (code) {
    const supabase = await createClient()

    try {
      // Échanger le code contre une session
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

      if (exchangeError) {
        console.error('❌ Exchange code error:', exchangeError)
        return NextResponse.redirect(`${origin}/login?error=auth_failed`)
      }

      if (!data?.user) {
        console.error('❌ No user data after exchange')
        return NextResponse.redirect(`${origin}/login?error=no_user`)
      }

      console.log('✅ User authenticated:', data.user.email)

      // Vérifier si le profil existe déjà
      const { data: existingProfile, error: profileCheckError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('id', data.user.id)
        .maybeSingle()

      if (profileCheckError) {
        console.error('❌ Profile check error:', profileCheckError)
      }

      // Si c'est la première connexion OAuth, créer le profil automatiquement
      if (!existingProfile) {
        console.log('🆕 Creating new profile for OAuth user:', data.user.email)

        const profileData = {
          id: data.user.id,
          email: data.user.email || '',
          full_name:
            data.user.user_metadata?.full_name ||
            data.user.user_metadata?.name ||
            data.user.user_metadata?.given_name ||
            data.user.email?.split('@')[0] ||
            'Utilisateur',
          company_name: data.user.user_metadata?.company_name || '',
          phone: data.user.user_metadata?.phone || '',
          company_address: data.user.user_metadata?.address || '',
          company_phone: data.user.user_metadata?.phone || '',
          company_email: data.user.email || '',
          siret: data.user.user_metadata?.siret || '',
        }

        console.log('📝 Profile data to insert:', profileData)

        const { error: profileError } = await supabase
          .from('profiles')
          .insert(profileData)

        if (profileError) {
          console.error('❌ Error creating OAuth profile:', profileError)
          // Ne pas bloquer, le profil sera créé au prochain login
        } else {
          console.log('✅ Profile created successfully')
        }
      } else {
        console.log('✅ Existing profile found:', existingProfile.email)
      }

      // Successful authentication - redirect
      const redirectUrl = new URL(next, origin)
      console.log('🔀 Redirecting to:', redirectUrl.toString())

      return NextResponse.redirect(redirectUrl)

    } catch (error) {
      console.error('❌ Unexpected error in callback:', error)
      return NextResponse.redirect(`${origin}/login?error=server_error`)
    }
  }

  // If there's no code, redirect to login with error
  console.log('⚠️ No code in callback, redirecting to login')
  return NextResponse.redirect(`${origin}/login?error=no_code`)
}
