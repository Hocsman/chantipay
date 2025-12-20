import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface CtaBlockProps {
  title?: string
  subtitle?: string
}

export function CtaBlock({
  title = 'Prêt à simplifier vos devis ?',
  subtitle = 'Testez ChantiPay gratuitement pendant 14 jours.',
}: CtaBlockProps) {
  return (
    <section className="py-16 bg-primary text-white">
      <div className="mx-auto max-w-3xl px-4 text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">{title}</h2>
        <p className="text-primary-foreground/80 mb-8">{subtitle}</p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/demo">
            <Button
              size="lg"
              variant="secondary"
              className="w-full sm:w-auto px-8"
            >
              Voir la démo
            </Button>
          </Link>
          <Link href="/register">
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto px-8 bg-transparent border-white text-white hover:bg-white hover:text-primary"
            >
              Créer mon compte
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
