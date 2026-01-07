'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, PenTool, Euro, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnboardingProps {
  onComplete: () => void;
}

const slides = [
  {
    icon: FileText,
    title: 'Créez vos devis',
    description: 'Créez des devis professionnels en quelques minutes avec notre éditeur intuitif.',
    color: 'from-blue-500 to-blue-600',
  },
  {
    icon: PenTool,
    title: 'Signez au doigt',
    description: 'Faites signer vos clients directement sur mobile grâce à la signature électronique.',
    color: 'from-purple-500 to-purple-600',
  },
  {
    icon: Euro,
    title: 'Encaissez vos acomptes',
    description: 'Recevez vos paiements en ligne de manière sécurisée et simplifiée.',
    color: 'from-green-500 to-green-600',
  },
];

export function Onboarding({ onComplete }: OnboardingProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const slide = slides[currentSlide];
  const Icon = slide.icon;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Skip button */}
      <div className="flex justify-end p-4">
        <Button
          variant="ghost"
          onClick={handleSkip}
          className="text-muted-foreground"
        >
          Passer
        </Button>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col items-center justify-center px-8 pb-12">
        {/* Icon with gradient background */}
        <div
          className={cn(
            'mb-12 flex h-32 w-32 items-center justify-center rounded-3xl bg-gradient-to-br shadow-lg',
            slide.color
          )}
        >
          <Icon className="h-16 w-16 text-white" strokeWidth={1.5} />
        </div>

        {/* Title */}
        <h1 className="mb-4 text-center text-3xl font-bold text-foreground">
          {slide.title}
        </h1>

        {/* Description */}
        <p className="mb-12 text-center text-lg text-muted-foreground">
          {slide.description}
        </p>

        {/* Dots indicator */}
        <div className="mb-12 flex gap-2">
          {slides.map((_, index) => (
            <div
              key={index}
              className={cn(
                'h-2 rounded-full transition-all',
                index === currentSlide
                  ? 'w-8 bg-primary'
                  : 'w-2 bg-muted-foreground/30'
              )}
            />
          ))}
        </div>

        {/* Next/Get Started button */}
        <Button
          onClick={handleNext}
          size="lg"
          className="w-full max-w-sm"
        >
          {currentSlide < slides.length - 1 ? (
            <>
              Suivant
              <ChevronRight className="ml-2 h-5 w-5" />
            </>
          ) : (
            'Commencer'
          )}
        </Button>
      </div>
    </div>
  );
}
