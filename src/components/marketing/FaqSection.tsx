interface FaqItem {
  question: string
  answer: string
}

interface FaqSectionProps {
  faqs: FaqItem[]
  pageUrl: string
}

export function FaqSection({ faqs, pageUrl }: FaqSectionProps) {
  // Generate FAQPage JSON-LD
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }

  return (
    <section className="py-16 bg-white">
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <div className="mx-auto max-w-3xl px-4">
        <h2 className="text-2xl font-bold mb-8 text-center">
          Questions fréquentes
        </h2>
        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <div key={index} className="border-b pb-6 last:border-0">
              <h3 className="font-semibold text-lg mb-2">{faq.question}</h3>
              <p className="text-muted-foreground">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
