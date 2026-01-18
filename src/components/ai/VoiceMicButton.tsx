'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Mic, MicOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

// Types pour Web Speech API
interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList
    resultIndex: number
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string
    message?: string
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean
    interimResults: boolean
    lang: string
    start: () => void
    stop: () => void
    abort: () => void
    onstart: (() => void) | null
    onend: (() => void) | null
    onresult: ((event: SpeechRecognitionEvent) => void) | null
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
}

declare global {
    interface Window {
        SpeechRecognition: new () => SpeechRecognition
        webkitSpeechRecognition: new () => SpeechRecognition
    }
}

interface VoiceMicButtonProps {
    onTranscript: (text: string) => void
    disabled?: boolean
    className?: string
    mode?: 'append' | 'replace'
}

export function VoiceMicButton({
    onTranscript,
    disabled = false,
    className = '',
    mode = 'append',
}: VoiceMicButtonProps) {
    const [isListening, setIsListening] = useState(false)
    const [isSupported, setIsSupported] = useState(false)
    const [interimTranscript, setInterimTranscript] = useState('')
    const recognitionRef = useRef<SpeechRecognition | null>(null)

    // Vérifier le support de Web Speech API
    useEffect(() => {
        const SpeechRecognitionAPI =
            window.SpeechRecognition || window.webkitSpeechRecognition
        setIsSupported(!!SpeechRecognitionAPI)
    }, [])

    // Initialiser le recognition
    const initRecognition = useCallback(() => {
        const SpeechRecognitionAPI =
            window.SpeechRecognition || window.webkitSpeechRecognition

        if (!SpeechRecognitionAPI) return null

        const recognition = new SpeechRecognitionAPI()
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = 'fr-FR'

        recognition.onstart = () => {
            setIsListening(true)
            setInterimTranscript('')
        }

        recognition.onend = () => {
            setIsListening(false)
            setInterimTranscript('')
        }

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            let finalTranscript = ''
            let interim = ''

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript
                if (event.results[i].isFinal) {
                    finalTranscript += transcript
                } else {
                    interim += transcript
                }
            }

            setInterimTranscript(interim)

            if (finalTranscript) {
                onTranscript(finalTranscript)
            }
        }

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            console.error('Erreur reconnaissance vocale:', event.error)
            setIsListening(false)
            setInterimTranscript('')

            // Messages d'erreur utilisateur-friendly
            switch (event.error) {
                case 'not-allowed':
                    toast.error('Microphone non autorisé', {
                        description: 'Veuillez autoriser l\'accès au microphone dans votre navigateur',
                    })
                    break
                case 'no-speech':
                    toast.info('Aucune parole détectée', {
                        description: 'Parlez dans le microphone pour dicter',
                    })
                    break
                case 'network':
                    toast.error('Erreur réseau', {
                        description: 'Vérifiez votre connexion internet',
                    })
                    break
                default:
                    toast.error('Erreur de reconnaissance vocale')
            }
        }

        return recognition
    }, [onTranscript])

    // Toggle listening
    const toggleListening = useCallback(() => {
        if (isListening) {
            // Arrêter l'écoute
            if (recognitionRef.current) {
                recognitionRef.current.stop()
            }
        } else {
            // Démarrer l'écoute
            const recognition = initRecognition()
            if (recognition) {
                recognitionRef.current = recognition
                try {
                    recognition.start()
                    toast.success('🎙️ Dictée activée', {
                        description: 'Parlez maintenant...',
                        duration: 2000,
                    })
                } catch (error) {
                    console.error('Erreur démarrage reconnaissance:', error)
                    toast.error('Impossible de démarrer la dictée')
                }
            }
        }
    }, [isListening, initRecognition])

    // Cleanup au démontage
    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort()
            }
        }
    }, [])

    // Si non supporté, ne rien afficher
    if (!isSupported) {
        return null
    }

    return (
        <div className="relative inline-flex items-center">
            <Button
                type="button"
                variant={isListening ? 'default' : 'outline'}
                size="icon"
                onClick={toggleListening}
                disabled={disabled}
                className={`relative ${isListening ? 'bg-red-500 hover:bg-red-600 animate-pulse' : ''} ${className}`}
                title={isListening ? 'Arrêter la dictée' : 'Dicter (microphone)'}
            >
                {isListening ? (
                    <MicOff className="h-4 w-4" />
                ) : (
                    <Mic className="h-4 w-4" />
                )}
            </Button>

            {/* Indicateur de transcription en cours */}
            {isListening && interimTranscript && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-muted rounded text-xs text-muted-foreground whitespace-nowrap max-w-[200px] truncate">
                    {interimTranscript}...
                </div>
            )}
        </div>
    )
}
