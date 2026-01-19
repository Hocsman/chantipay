import { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Clock, RotateCcw, Trash2, History } from 'lucide-react'
import { AIHistoryEntry } from '@/types/ai-history'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { getAgentLabel } from '@/lib/ai/quoteAgents'

interface AIHistorySheetProps {
  history: AIHistoryEntry[]
  onRestore: (entry: AIHistoryEntry) => void
  onRemove: (entryId: string) => void
  onClear: () => void
}

export function AIHistorySheet({
  history,
  onRestore,
  onRemove,
  onClear,
}: AIHistorySheetProps) {
  const [open, setOpen] = useState(false)

  if (history.length === 0) {
    return null
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <History className="h-4 w-4" />
          Historique
          <Badge variant="secondary" className="ml-1">
            {history.length}
          </Badge>
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[80vh] overflow-hidden flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span>Générations récentes</span>
            {history.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs text-muted-foreground"
                onClick={(e) => {
                  e.stopPropagation()
                  if (confirm('Vider tout l\'historique ?')) {
                    onClear()
                    setOpen(false)
                  }
                }}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Tout effacer
              </Button>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto mt-4 -mx-6 px-6">
          <div className="space-y-3">
            {history.map((entry, index) => (
              <div key={entry.id}>
                <div className="flex flex-col gap-3 p-3 rounded-lg border bg-card">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-2">
                        {entry.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(entry.timestamp, {
                            addSuffix: true,
                            locale: fr,
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        {entry.trade && (
                          <Badge variant="outline" className="text-xs">
                            {entry.trade}
                          </Badge>
                        )}
                        {entry.agent && (
                          <Badge variant="secondary" className="text-xs">
                            {getAgentLabel(entry.agent)}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {entry.items.length} ligne{entry.items.length > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        onRestore(entry)
                        setOpen(false)
                      }}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Restaurer
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="px-3"
                      onClick={() => {
                        onRemove(entry.id)
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>

                {index < history.length - 1 && <div className="h-3" />}
              </div>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
