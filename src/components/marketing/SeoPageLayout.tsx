import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { UsefulLinks } from './UsefulLinks'
import { CtaBlock } from './CtaBlock'
import { FaqSection } from './FaqSection'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import Image from 'next/image'

interface FaqItem {
  question: string
  answer: string
}

interface SeoPageLayoutProps {
  children: React.ReactNode
  currentPath: string
  faqs: FaqItem[]
  ctaTitle?: string
  ctaSubtitle?: string
}

export function SeoPageLayout({
  children,
  currentPath,
  faqs,
  ctaTitle,
  ctaSubtitle,
}: SeoPageLayoutProps) {
  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.chantipay.com'

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/favicon.svg"
              alt="ChantiPay"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <span className="text-xl font-bold">ChantiPay</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login" className="hidden sm:block">
              <Button variant="ghost">Connexion</Button>
            </Link>
            <Link href="/register">
              <Button>Essai gratuit</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>

      {/* FAQ Section */}
      <FaqSection faqs={faqs} pageUrl={`${BASE_URL}${currentPath}`} />

      {/* CTA Block */}
      <CtaBlock title={ctaTitle} subtitle={ctaSubtitle} />

      {/* Useful Links */}
      <UsefulLinks currentPath={currentPath} />

      {/* Footer */}
      <footer className="border-t bg-slate-50 dark:bg-slate-900 py-8">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/favicon.svg"
                alt="ChantiPay"
                width={24}
                height={24}
                className="rounded"
              />
              <span className="font-bold">ChantiPay</span>
            </Link>
            <nav className="flex flex-wrap items-center justify-center gap-4 text-sm">
              <Link
                href="/mentions-legales"
                className="text-muted-foreground hover:text-foreground"
              >
                Mentions légales
              </Link>
              <Link
                href="/cgu"
                className="text-muted-foreground hover:text-foreground"
              >
                CGU
              </Link>
              <Link
                href="/politique-confidentialite"
                className="text-muted-foreground hover:text-foreground"
              >
                Confidentialité
              </Link>
              <Link
                href="/contact"
                className="text-muted-foreground hover:text-foreground"
              >
                Contact
              </Link>
            </nav>
            <p className="text-muted-foreground text-sm">
              © 2025 ChantiPay
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
