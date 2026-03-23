import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { X, Network, BookOpen, Layers, MessageSquare, Volume2 } from 'lucide-react'
import type { JpKanji, JpMasteryLevel, JpItemType } from '@/types'

// ── Mock related data ────────────────────────────────────────────────

interface VocabRef {
  word: string
  reading: string
  meaning: string
}

interface AssociationRef {
  character: string
  meaning: string
  category: 'semantic' | 'orthographic' | 'phonological'
}

// For demo: mock vocabulary and associations for each kanji
function getMockVocab(character: string): VocabRef[] {
  const vocabMap: Record<string, VocabRef[]> = {
    '山': [
      { word: '山', reading: 'やま', meaning: 'mountain' },
      { word: '火山', reading: 'かざん', meaning: 'volcano' },
      { word: '富士山', reading: 'ふじさん', meaning: 'Mt. Fuji' },
    ],
    '川': [
      { word: '川', reading: 'かわ', meaning: 'river' },
      { word: '小川', reading: 'おがわ', meaning: 'brook, stream' },
    ],
    '日': [
      { word: '日本', reading: 'にほん', meaning: 'Japan' },
      { word: '毎日', reading: 'まいにち', meaning: 'every day' },
      { word: '日曜日', reading: 'にちようび', meaning: 'Sunday' },
    ],
    '月': [
      { word: '月', reading: 'つき', meaning: 'moon, month' },
      { word: '月曜日', reading: 'げつようび', meaning: 'Monday' },
      { word: '今月', reading: 'こんげつ', meaning: 'this month' },
    ],
    '火': [
      { word: '火', reading: 'ひ', meaning: 'fire' },
      { word: '火山', reading: 'かざん', meaning: 'volcano' },
      { word: '火曜日', reading: 'かようび', meaning: 'Tuesday' },
    ],
    '水': [
      { word: '水', reading: 'みず', meaning: 'water' },
      { word: '水曜日', reading: 'すいようび', meaning: 'Wednesday' },
    ],
    '木': [
      { word: '木', reading: 'き', meaning: 'tree' },
      { word: '木曜日', reading: 'もくようび', meaning: 'Thursday' },
    ],
    '金': [
      { word: 'お金', reading: 'おかね', meaning: 'money' },
      { word: '金曜日', reading: 'きんようび', meaning: 'Friday' },
    ],
    '大': [
      { word: '大きい', reading: 'おおきい', meaning: 'big, large' },
      { word: '大学', reading: 'だいがく', meaning: 'university' },
      { word: '大人', reading: 'おとな', meaning: 'adult' },
    ],
    '小': [
      { word: '小さい', reading: 'ちいさい', meaning: 'small' },
      { word: '小学校', reading: 'しょうがっこう', meaning: 'elementary school' },
    ],
    '中': [
      { word: '中', reading: 'なか', meaning: 'inside, middle' },
      { word: '中学校', reading: 'ちゅうがっこう', meaning: 'middle school' },
    ],
    '人': [
      { word: '人', reading: 'ひと', meaning: 'person' },
      { word: '日本人', reading: 'にほんじん', meaning: 'Japanese person' },
      { word: '大人', reading: 'おとな', meaning: 'adult' },
    ],
    '上': [
      { word: '上', reading: 'うえ', meaning: 'above, up' },
      { word: '上手', reading: 'じょうず', meaning: 'skillful' },
    ],
    '下': [
      { word: '下', reading: 'した', meaning: 'below, down' },
      { word: '下手', reading: 'へた', meaning: 'unskillful' },
    ],
    '男': [
      { word: '男', reading: 'おとこ', meaning: 'man' },
      { word: '男の子', reading: 'おとこのこ', meaning: 'boy' },
    ],
    '女': [
      { word: '女', reading: 'おんな', meaning: 'woman' },
      { word: '女の子', reading: 'おんなのこ', meaning: 'girl' },
    ],
    '子': [
      { word: '子供', reading: 'こども', meaning: 'child' },
      { word: '女の子', reading: 'おんなのこ', meaning: 'girl' },
    ],
  }
  return vocabMap[character] ?? []
}

function getMockAssociations(character: string): AssociationRef[] {
  const assocMap: Record<string, AssociationRef[]> = {
    '山': [
      { character: '川', meaning: 'river', category: 'semantic' },
      { character: '森', meaning: 'forest', category: 'semantic' },
    ],
    '川': [
      { character: '山', meaning: 'mountain', category: 'semantic' },
      { character: '水', meaning: 'water', category: 'semantic' },
    ],
    '日': [
      { character: '月', meaning: 'moon', category: 'semantic' },
      { character: '明', meaning: 'bright', category: 'orthographic' },
    ],
    '月': [
      { character: '日', meaning: 'sun', category: 'semantic' },
      { character: '明', meaning: 'bright', category: 'orthographic' },
    ],
    '大': [
      { character: '小', meaning: 'small', category: 'semantic' },
      { character: '人', meaning: 'person', category: 'orthographic' },
    ],
    '小': [
      { character: '大', meaning: 'big', category: 'semantic' },
    ],
    '上': [
      { character: '下', meaning: 'below', category: 'semantic' },
    ],
    '下': [
      { character: '上', meaning: 'above', category: 'semantic' },
    ],
    '男': [
      { character: '女', meaning: 'woman', category: 'semantic' },
    ],
    '女': [
      { character: '男', meaning: 'man', category: 'semantic' },
    ],
    '火': [
      { character: '水', meaning: 'water', category: 'semantic' },
    ],
    '水': [
      { character: '火', meaning: 'fire', category: 'semantic' },
    ],
  }
  return assocMap[character] ?? []
}

// ── Mastery config ───────────────────────────────────────────────────

const MASTERY_CONFIG: Record<JpMasteryLevel, { label: string; className: string }> = {
  unknown: { label: 'Unknown', className: 'bg-warm-gray/20 text-warm-gray border-warm-gray/30' },
  seen: { label: 'Seen', className: 'bg-ash-stone/30 text-ash-stone border-ash-stone/40' },
  learning: { label: 'Learning', className: 'bg-icon-gold/20 text-icon-gold/80 border-icon-gold/30' },
  known: { label: 'Known', className: 'bg-verdigris/20 text-verdigris border-verdigris/30' },
  mastered: { label: 'Mastered', className: 'bg-icon-gold/20 text-icon-gold border-icon-gold/30' },
}

const CATEGORY_BADGE_COLORS: Record<string, string> = {
  semantic: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  orthographic: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  phonological: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
}

// ── Section component ────────────────────────────────────────────────

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="py-4 border-b border-ash-stone/30 last:border-b-0">
      <h4 className="flex items-center gap-2 text-xs font-semibold text-warm-gray uppercase tracking-wider mb-3">
        {icon}
        {title}
      </h4>
      <div>{children}</div>
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────────────

interface KanjiDetailProps {
  kanji: JpKanji
  mastery: JpMasteryLevel
  onClose?: () => void
  onViewInGraph?: (id: string) => void
  onNavigate?: (id: string, type: JpItemType) => void
  className?: string
}

export function KanjiDetail({
  kanji,
  mastery,
  onClose,
  onViewInGraph,
  className,
}: KanjiDetailProps) {
  const masteryInfo = MASTERY_CONFIG[mastery]
  const vocab = useMemo(() => getMockVocab(kanji.character), [kanji.character])
  const associations = useMemo(() => getMockAssociations(kanji.character), [kanji.character])

  return (
    <div className={cn('flex flex-col h-full bg-obsidian', className)}>
      {/* Header with large character */}
      <div className="flex-shrink-0 p-5 border-b border-ash-stone/50">
        <div className="flex items-start gap-4">
          {/* Large character box */}
          <div className="w-24 h-24 rounded-lg bg-charcoal-slate border border-ash-stone/30 flex items-center justify-center shrink-0">
            <span className="text-7xl leading-none" style={{ fontFamily: 'system-ui, sans-serif' }}>
              {kanji.character}
            </span>
          </div>

          {/* Info beside character */}
          <div className="flex-1 min-w-0">
            {/* Readings */}
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl font-mono text-parchment">
                {kanji.character}
              </span>
              <span className="text-lg text-warm-gray">(</span>
              {kanji.kun_readings.length > 0 && (
                <span className="text-lg font-mono text-parchment">
                  {kanji.kun_readings[0].replace('.', '')}
                </span>
              )}
              {kanji.on_readings.length > 0 && (
                <>
                  <span className="text-warm-gray">/</span>
                  <span className="text-lg font-mono text-parchment">
                    {kanji.on_readings[0]}
                  </span>
                </>
              )}
              <span className="text-lg text-warm-gray">)</span>
            </div>

            {/* Meanings */}
            <p className="text-sm text-parchment/90 mb-2">
              {kanji.meanings.join(', ')}
            </p>

            {/* Meta badges */}
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="outline" className="text-[10px] h-5">
                JLPT N{kanji.jlpt_level}
              </Badge>
              {kanji.grade && (
                <Badge variant="outline" className="text-[10px] h-5">
                  Grade {kanji.grade}
                </Badge>
              )}
              <Badge variant="outline" className="text-[10px] h-5">
                {kanji.stroke_count} strokes
              </Badge>
              <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border', masteryInfo.className)}>
                {masteryInfo.label}
              </span>
            </div>
          </div>

          {/* Close button */}
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Scrollable content */}
      <ScrollArea className="flex-1 px-5">
        {/* Mnemonic */}
        {kanji.mnemonic && (
          <Section title="Mnemonic" icon={<MessageSquare className="h-3 w-3" />}>
            <p className="text-sm text-warm-gray italic leading-relaxed">
              {kanji.mnemonic}
            </p>
          </Section>
        )}

        {/* Components */}
        <Section title="Components" icon={<Layers className="h-3 w-3" />}>
          {kanji.components.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {kanji.components.map((compId) => (
                <span
                  key={compId}
                  className="px-2 py-1 bg-charcoal-slate rounded border border-ash-stone/30 text-sm"
                >
                  {compId}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-warm-gray">
              {kanji.character} is a pictographic/ideographic character (no sub-components)
            </p>
          )}
        </Section>

        {/* Readings */}
        <Section title="Readings" icon={<Volume2 className="h-3 w-3" />}>
          <div className="space-y-2">
            {kanji.on_readings.length > 0 && (
              <div className="flex items-start gap-3">
                <span className="text-xs text-warm-gray w-16 shrink-0 pt-0.5">On&apos;yomi</span>
                <div className="flex flex-wrap gap-2">
                  {kanji.on_readings.map((r, i) => (
                    <span key={i} className="font-mono text-sm bg-charcoal-slate px-2 py-0.5 rounded">
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {kanji.kun_readings.length > 0 && (
              <div className="flex items-start gap-3">
                <span className="text-xs text-warm-gray w-16 shrink-0 pt-0.5">Kun&apos;yomi</span>
                <div className="flex flex-wrap gap-2">
                  {kanji.kun_readings.map((r, i) => (
                    <span key={i} className="font-mono text-sm bg-charcoal-slate px-2 py-0.5 rounded">
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Section>

        {/* Vocabulary */}
        {vocab.length > 0 && (
          <Section title="Vocabulary" icon={<BookOpen className="h-3 w-3" />}>
            <div className="space-y-1.5">
              {vocab.map((v, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-2 py-1.5 rounded hover:bg-charcoal-slate/50 transition-colors"
                >
                  <span className="text-base font-mono" style={{ fontFamily: 'system-ui, sans-serif' }}>
                    {v.word}
                  </span>
                  <span className="text-xs text-warm-gray font-mono">({v.reading})</span>
                  <span className="text-xs text-warm-gray/80 ml-auto">{v.meaning}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Phonetic series */}
        <Section title="Phonetic Series">
          {kanji.phonetic_series ? (
            <p className="text-sm">Part of the {kanji.phonetic_series} series</p>
          ) : (
            <p className="text-xs text-warm-gray">
              {kanji.character} is not part of a phonetic series
            </p>
          )}
        </Section>

        {/* Associations */}
        {associations.length > 0 && (
          <Section title="Associations" icon={<Network className="h-3 w-3" />}>
            <div className="space-y-2">
              {(['semantic', 'orthographic', 'phonological'] as const).map((cat) => {
                const catAssocs = associations.filter((a) => a.category === cat)
                if (catAssocs.length === 0) return null
                return (
                  <div key={cat}>
                    <span className="text-xs text-warm-gray capitalize">{cat}:</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {catAssocs.map((a, i) => (
                        <span
                          key={i}
                          className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs border', CATEGORY_BADGE_COLORS[cat])}
                        >
                          <span className="text-base" style={{ fontFamily: 'system-ui, sans-serif' }}>
                            {a.character}
                          </span>
                          <span className="opacity-70">({a.meaning})</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </Section>
        )}

        {/* View in graph */}
        {onViewInGraph && (
          <div className="py-4">
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2"
              onClick={() => onViewInGraph(kanji.id)}
            >
              <Network className="h-3.5 w-3.5" />
              View in Association Web
            </Button>
          </div>
        )}

        {/* Bottom padding */}
        <div className="h-6" />
      </ScrollArea>
    </div>
  )
}
