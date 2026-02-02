import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FormattedText } from '@/components/ui/formatted-text'
import type { SharedConcept } from '@/types/share'

interface SharedConceptCardProps {
  concept: SharedConcept
}

export function SharedConceptCard({ concept }: SharedConceptCardProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg">{concept.name}</CardTitle>
          <Badge variant={concept.mastery as any} className="shrink-0">
            {concept.mastery}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="text-xs font-medium text-warm-gray uppercase tracking-wide mb-1">
            Definition
          </h4>
          <div className="text-sm text-parchment">
            <FormattedText>{concept.definition}</FormattedText>
          </div>
        </div>

        {concept.intuition && (
          <div>
            <h4 className="text-xs font-medium text-warm-gray uppercase tracking-wide mb-1">
              Intuition
            </h4>
            <div className="text-sm text-parchment/90">
              <FormattedText>{concept.intuition}</FormattedText>
            </div>
          </div>
        )}

        {concept.pitfalls && (
          <div>
            <h4 className="text-xs font-medium text-oxide-red/80 uppercase tracking-wide mb-1">
              Pitfalls
            </h4>
            <div className="text-sm text-parchment/90">
              <FormattedText>{concept.pitfalls}</FormattedText>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
