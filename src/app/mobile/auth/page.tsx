'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MobileLogin } from '@/components/mobile/auth/MobileLogin';
import { MobileSignup } from '@/components/mobile/auth/MobileSignup';
import { Onboarding } from '@/components/mobile/Onboarding';
import { createClient } from '@/lib/supabase/client';

export default function MobileAuthPage() {
  const [view, setView] = useState<'onboarding' | 'login' | 'signup'>('onboarding');
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        router.push('/dashboard');
        return;
      }
    };

    // Check if onboarding has been seen
    const checkOnboarding = () => {
      if (typeof window !== 'undefined') {
        const seen = localStorage.getItem('chantipay_onboarding_seen');
        if (seen === 'true') {
          setHasSeenOnboarding(true);
          setView('login');
        }
      }
    };

    checkAuth();
    checkOnboarding();
  }, [router]);

  const handleOnboardingComplete = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('chantipay_onboarding_seen', 'true');
    }
    setHasSeenOnboarding(true);
    setView('login');
  };

  if (view === 'onboarding' && !hasSeenOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  if (view === 'signup') {
    return <MobileSignup onSwitchToLogin={() => setView('login')} />;
  }

  return <MobileLogin onSwitchToSignup={() => setView('signup')} />;
}
