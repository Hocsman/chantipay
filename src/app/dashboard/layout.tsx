'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { FileText, LogOut, Settings, User, Home, Users, Receipt, Calendar, BarChart3, Plus } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const navItems = [
    { href: '/dashboard', label: 'Tableau de bord', icon: Home },
    { href: '/dashboard/clients', label: 'Clients', icon: Users },
    { href: '/dashboard/quotes', label: 'Devis', icon: FileText },
    { href: '/dashboard/invoices', label: 'Factures', icon: Receipt },
    { href: '/dashboard/avoirs', label: 'Avoirs', icon: Receipt },
    { href: '/dashboard/calendar', label: 'Calendrier', icon: Calendar },
    { href: '/dashboard/stats', label: 'Statistiques', icon: BarChart3 },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname?.startsWith(href);
  };

  return (
    <div className="bg-background min-h-screen pb-24 md:pb-0">
      {/* Desktop Header */}
      <header className="sticky top-0 z-50 hidden md:block border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-10">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2.5 group">
              <div className="relative">
                <Image
                  src="/favicon.svg"
                  alt="ChantiPay"
                  width={36}
                  height={36}
                  className="rounded-xl transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 rounded-xl bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <span className="text-xl font-bold tracking-tight">ChantiPay</span>
            </Link>

            {/* Navigation */}
            <nav className="flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "relative flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                      active
                        ? "text-foreground bg-muted"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <Icon className={cn(
                      "h-4 w-4 transition-transform duration-200",
                      active && "text-primary"
                    )} />
                    <span>{item.label}</span>
                    {active && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right section */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/dashboard/quotes/new">
              <Button size="sm" className="gap-2 shadow-md hover:shadow-lg">
                <Plus className="h-4 w-4" />
                Nouveau devis
              </Button>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full ring-2 ring-border hover:ring-primary/30 transition-all duration-200">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">U</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 shadow-lg" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-semibold leading-none">Mon compte</p>
                    <p className="text-muted-foreground text-xs leading-none">
                      Gérez votre profil
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Profil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings/billing" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Abonnement
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/30"
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 border-b backdrop-blur md:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image
              src="/favicon.svg"
              alt="ChantiPay"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <span className="text-lg font-bold">ChantiPay</span>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-9 w-9 rounded-full p-0">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">U</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  Paramètres
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-red-600"
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Content */}
      <main className="animate-fade-in-up">{children}</main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
