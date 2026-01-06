import Link from 'next/link'

const usefulLinks = [
  { href: '/logiciel-devis-artisan', label: 'Logiciel devis artisan' },
  { href: '/devis-sur-mobile', label: 'Devis sur mobile' },
  { href: '/signature-devis-electronique', label: 'Signature électronique' },
  { href: '/acompte-chantier', label: 'Acompte chantier' },
  { href: '/modele-devis-artisan', label: 'Modèle devis artisan' },
  { href: '/devis-plombier', label: 'Devis plombier' },
  { href: '/devis-electricien', label: 'Devis électricien' },
  { href: '/tarifs', label: 'Tarifs' },
  { href: '/demo', label: 'Démo interactive' },
  { href: '/contact', label: 'Contact' },
]

interface UsefulLinksProps {
  currentPath?: string
}

export function UsefulLinks({ currentPath }: UsefulLinksProps) {
  const filteredLinks = usefulLinks.filter((link) => link.href !== currentPath)

  return (
    <section className="py-12 bg-slate-50 dark:bg-slate-900">
      <div className="mx-auto max-w-4xl px-4">
        <h2 className="text-xl font-bold mb-6 text-center">Pages utiles</h2>
        <div className="flex flex-wrap justify-center gap-2">
          {filteredLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-2 text-sm bg-background border rounded-lg hover:bg-primary hover:text-white transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
