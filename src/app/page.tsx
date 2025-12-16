import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MarketingPage from './(marketing)/page'

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>
}) {
  const params = await searchParams
  
  // Si un code d'auth est présent, échanger contre une session
  if (params.code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(params.code)
    
    if (!error) {
      redirect('/dashboard')
    }
  }

  return <MarketingPage />
}
