'use client'

import { LayoutContainer } from '@/components/LayoutContainer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  HelpCircle,
  FileText,
  Receipt,
  Users,
  Settings,
  Mail,
  Lightbulb,
  ArrowRight,
  ExternalLink,
} from 'lucide-react'
import Link from 'next/link'

const faqSections = [
  {
    id: 'devis',
    title: 'Devis',
    icon: FileText,
    color: 'text-blue-500',
    questions: [
      {
        question: 'Comment créer un devis ?',
        answer: `Pour créer un devis, cliquez sur le bouton "Nouveau devis" en haut à droite ou depuis le tableau de bord. Remplissez les informations du client, ajoutez vos lignes de prestation avec les prix HT, et le total TTC sera calculé automatiquement.`,
      },
      {
        question: 'Comment envoyer un devis par email ?',
        answer: `Une fois votre devis créé, cliquez sur "Envoyer" depuis la page du devis. Le client recevra un email avec un lien pour consulter et signer le devis en ligne. Vous serez notifié dès qu'il sera signé.`,
      },
      {
        question: 'Comment fonctionne la signature électronique ?',
        answer: `Lorsque le client reçoit le devis par email, il peut le consulter et le signer directement en ligne. La signature est horodatée et enregistrée. Vous recevrez une notification et le devis passera automatiquement au statut "Signé".`,
      },
      {
        question: 'Comment relancer un client qui n\'a pas signé ?',
        answer: `Depuis la page du devis ou le tableau de bord, cliquez sur "Relancer". Un email de rappel sera envoyé au client avec le lien vers le devis. Vous pouvez relancer jusqu'à 3 fois.`,
      },
      {
        question: 'Comment dupliquer un devis existant ?',
        answer: `Ouvrez le devis que vous souhaitez dupliquer, puis cliquez sur le menu "..." et sélectionnez "Dupliquer". Un nouveau devis sera créé avec les mêmes informations, que vous pourrez modifier.`,
      },
      {
        question: 'Comment l\'IA peut m\'aider à créer des devis ?',
        answer: `ChantiPay intègre une IA qui peut analyser des photos de chantier pour suggérer des lignes de devis, estimer les quantités et proposer des prix basés sur votre historique. Cliquez sur l'icône appareil photo lors de la création d'un devis pour utiliser cette fonctionnalité.`,
      },
    ],
  },
  {
    id: 'factures',
    title: 'Factures',
    icon: Receipt,
    color: 'text-green-500',
    questions: [
      {
        question: 'Comment convertir un devis en facture ?',
        answer: `Une fois le devis signé, un bouton "Convertir en facture" apparaît sur la page du devis. Cliquez dessus pour générer automatiquement une facture avec toutes les informations du devis.`,
      },
      {
        question: 'Comment gérer les acomptes ?',
        answer: `Lors de la création de la facture, vous pouvez définir un pourcentage d'acompte (par exemple 30%). Une facture d'acompte sera générée. Le solde pourra être facturé ultérieurement.`,
      },
      {
        question: 'Comment relancer une facture impayée ?',
        answer: `Les factures en retard apparaissent sur votre tableau de bord. Cliquez sur "Relancer" pour envoyer un email de rappel au client. Les relances incluent automatiquement les mentions légales sur les pénalités de retard.`,
      },
      {
        question: 'Comment marquer une facture comme payée ?',
        answer: `Ouvrez la facture et cliquez sur "Marquer comme payée". Vous pouvez préciser la date et le mode de paiement (virement, chèque, espèces, etc.).`,
      },
      {
        question: 'Comment créer un avoir ?',
        answer: `Pour créer un avoir, allez dans le menu "Avoirs" puis cliquez sur "Nouvel avoir". Sélectionnez la facture concernée et indiquez le montant à rembourser. L'avoir sera lié à la facture originale.`,
      },
    ],
  },
  {
    id: 'clients',
    title: 'Clients',
    icon: Users,
    color: 'text-purple-500',
    questions: [
      {
        question: 'Comment ajouter un client ?',
        answer: `Allez dans "Clients" puis cliquez sur "Nouveau client". Remplissez les informations (nom, email, téléphone, adresse). Vous pouvez aussi créer un client directement lors de la création d'un devis.`,
      },
      {
        question: 'Comment retrouver l\'historique d\'un client ?',
        answer: `Cliquez sur un client dans la liste pour voir sa fiche. Vous y trouverez tous ses devis, factures et le montant total facturé.`,
      },
      {
        question: 'Puis-je importer mes clients existants ?',
        answer: `L'import de clients n'est pas encore disponible. Nous travaillons sur cette fonctionnalité pour une prochaine version.`,
      },
    ],
  },
  {
    id: 'compte',
    title: 'Compte & Paramètres',
    icon: Settings,
    color: 'text-orange-500',
    questions: [
      {
        question: 'Comment modifier mes informations d\'entreprise ?',
        answer: `Allez dans "Plus" > "Paramètres". Vous pouvez y modifier le nom de votre entreprise, adresse, SIRET, numéro de TVA et vos coordonnées de contact.`,
      },
      {
        question: 'Comment ajouter mon logo ?',
        answer: `Dans "Paramètres", cliquez sur la zone logo pour télécharger votre image. Elle apparaîtra sur tous vos devis et factures. Formats acceptés : PNG, JPG (max 2 Mo).`,
      },
      {
        question: 'Comment gérer mon abonnement ?',
        answer: `Allez dans "Plus" > "Abonnement" pour voir votre plan actuel, mettre à jour votre moyen de paiement ou changer de formule.`,
      },
      {
        question: 'Comment exporter mes données ?',
        answer: `Vous pouvez exporter vos devis et factures au format Excel depuis les pages de liste respectives. Cliquez sur le bouton "Exporter" en haut de la liste.`,
      },
    ],
  },
]

const quickGuides = [
  {
    title: 'Créer mon premier devis',
    description: 'Apprenez à créer et envoyer un devis en quelques clics',
    href: '/dashboard/quotes/new',
    icon: FileText,
  },
  {
    title: 'Configurer mon entreprise',
    description: 'Ajoutez votre logo et vos informations légales',
    href: '/dashboard/settings',
    icon: Settings,
  },
  {
    title: 'Ajouter un client',
    description: 'Créez votre carnet de clients',
    href: '/dashboard/clients',
    icon: Users,
  },
]

export default function HelpPage() {
  return (
    <LayoutContainer>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Centre d&apos;aide</h1>
        <p className="text-muted-foreground mt-1">
          Trouvez des réponses à vos questions et apprenez à utiliser ChantiPay
        </p>
      </div>

      {/* Quick Guides */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          Guides rapides
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {quickGuides.map((guide) => {
            const Icon = guide.icon
            return (
              <Link key={guide.href} href={guide.href}>
                <Card className="h-full hover:shadow-md transition-shadow cursor-pointer group">
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium group-hover:text-primary transition-colors">
                        {guide.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {guide.description}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>

      {/* FAQ Sections */}
      <div className="space-y-6">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-blue-500" />
          Questions fréquentes
        </h2>

        {faqSections.map((section) => {
          const Icon = section.icon
          return (
            <Card key={section.id}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Icon className={`h-5 w-5 ${section.color}`} />
                  {section.title}
                  <Badge variant="secondary" className="ml-auto">
                    {section.questions.length} questions
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <Accordion type="single" collapsible className="w-full">
                  {section.questions.map((item, index) => (
                    <AccordionItem key={index} value={`${section.id}-${index}`}>
                      <AccordionTrigger className="text-left hover:no-underline">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Contact Support */}
      <Card className="mt-8 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="rounded-full bg-primary/10 p-3">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Vous ne trouvez pas la réponse ?</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Notre équipe est disponible pour vous aider. Contactez-nous par email.
              </p>
            </div>
            <Button asChild>
              <a href="mailto:support@chantipay.com">
                Contacter le support
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </LayoutContainer>
  )
}
