'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MobileDashboard } from '@/components/mobile/MobileDashboard';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

export default function MobileDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalQuotes: 0,
    pendingQuotes: 0,
    signedQuotes: 0,
    monthlyRevenue: 0,
  });
  const [recentQuotes, setRecentQuotes] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient();

      // Check auth
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push('/mobile/auth');
        return;
      }

      setUser(session.user);

      // Get profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      // Get quotes
      const { data: quotes } = await supabase
        .from('quotes')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (quotes) {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const pending = quotes.filter((q) => q.status === 'sent').length;
        const signed = quotes.filter((q) => q.status === 'signed').length;
        const monthlyRevenue = quotes
          .filter((q) => {
            const quoteDate = new Date(q.created_at);
            return (
              q.status === 'signed' &&
              quoteDate.getMonth() === currentMonth &&
              quoteDate.getFullYear() === currentYear
            );
          })
          .reduce((sum, q) => sum + (q.total_amount || 0), 0);

        setStats({
          totalQuotes: quotes.length,
          pendingQuotes: pending,
          signedQuotes: signed,
          monthlyRevenue,
        });

        setRecentQuotes(quotes);
      }

      setLoading(false);
    };

    loadData();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <MobileLayout
      title="Dashboard"
      subtitle="Vue d'ensemble"
      user={{
        name: user?.user_metadata?.full_name || user?.email,
        email: user?.email,
      }}
    >
      <MobileDashboard stats={stats} recentQuotes={recentQuotes} />
    </MobileLayout>
  );
}
