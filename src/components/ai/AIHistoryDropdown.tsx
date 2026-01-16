import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Clock, RotateCcw, Trash2, History } from 'lucide-react'
import { AIHistoryEntry } from '@/types/ai-history'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

interface AIHistoryDropdownProps {
  history: AIHistoryEntry[]
  onRestore: (entry: AIHistoryEntry) => void
  onRemove: (entryId: string) => void
  onClear: () => void
}

export function AIHistoryDropdown({
  history,
  onRestore,
  onRemove,
  onClear,
}: AIHistoryDropdownProps) {
  const [open, setOpen] = useState(false)

  if (history.length === 0) {
    return null
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <History className="h-4 w-4" />
          Historique IA
          <Badge variant="secondary" className="ml-1">
            {history.length}
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[400px]">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Générations récentes</span>
          {history.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation()
                if (confirm('Vider tout l\'historique ?')) {
                  onClear()
                }
              }}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Tout effacer
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <div className="max-h-[400px] overflow-y-auto">
          {history.map((entry) => (
            <DropdownMenuItem
              key={entry.id}
              className="flex flex-col items-start gap-2 p-3 cursor-pointer"
              onSelect={() => {
                onRestore(entry)
                setOpen(false)
              }}
            >
              <div className="flex items-start justify-between w-full gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {entry.description.slice(0, 60)}
                    {entry.description.length > 60 && '...'}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(entry.timestamp, {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </span>
                    {entry.trade && (
                      <Badge variant="outline" className="text-xs">
                        {entry.trade}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {entry.items.length} ligne{entry.items.length > 1 ? 's' : ''}
                  </p>
                </div>

                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      onRestore(entry)
                      setOpen(false)
                    }}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation()
                      onRemove(entry.id)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
