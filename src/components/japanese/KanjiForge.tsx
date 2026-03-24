import { useState, useCallback, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Trash2,
  ExternalLink,
  Lightbulb,
  Check,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { SpeakButton, InlineSpeakButton } from './SpeakButton'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ForgeVocab {
  word: string
  reading: string
  meaning: string
}

interface ForgeResult {
  character: string
  meaning: string
  reading: string
  mnemonic: string
  vocab: ForgeVocab[]
}

interface ForgeRecipe {
  components: string[]
  result: ForgeResult
}

interface PaletteComponent {
  character: string
  meaning: string
}

// ---------------------------------------------------------------------------
// Forge Recipes (pre-built data)
// ---------------------------------------------------------------------------

const FORGE_RECIPES: ForgeRecipe[] = [
  {
    components: ['日', '月'],
    result: {
      character: '明',
      meaning: 'bright, light',
      reading: 'メイ / あか(るい)',
      mnemonic: 'Sun and moon together make everything bright',
      vocab: [
        { word: '明日', reading: 'あした', meaning: 'tomorrow' },
        { word: '説明', reading: 'せつめい', meaning: 'explanation' },
        { word: '明るい', reading: 'あかるい', meaning: 'bright' },
      ],
    },
  },
  {
    components: ['人', '木'],
    result: {
      character: '休',
      meaning: 'rest, holiday',
      reading: 'キュウ / やす(む)',
      mnemonic: 'A person leaning against a tree, resting',
      vocab: [
        { word: '休む', reading: 'やすむ', meaning: 'to rest' },
        { word: '休日', reading: 'きゅうじつ', meaning: 'holiday' },
      ],
    },
  },
  {
    components: ['木', '木'],
    result: {
      character: '林',
      meaning: 'grove, small forest',
      reading: 'リン / はやし',
      mnemonic: 'Two trees together make a grove',
      vocab: [{ word: '林', reading: 'はやし', meaning: 'grove' }],
    },
  },
  {
    components: ['木', '木', '木'],
    result: {
      character: '森',
      meaning: 'forest',
      reading: 'シン / もり',
      mnemonic: 'Three trees make a dense forest',
      vocab: [
        { word: '森', reading: 'もり', meaning: 'forest' },
        { word: '森林', reading: 'しんりん', meaning: 'forest/woodland' },
      ],
    },
  },
  {
    components: ['女', '子'],
    result: {
      character: '好',
      meaning: 'like, fond of',
      reading: 'コウ / す(き)',
      mnemonic: 'A woman with her child \u2014 the fondness of motherly love',
      vocab: [
        { word: '好き', reading: 'すき', meaning: 'like/fond of' },
        { word: '好む', reading: 'このむ', meaning: 'to prefer' },
      ],
    },
  },
  {
    components: ['日', '生'],
    result: {
      character: '星',
      meaning: 'star',
      reading: 'セイ / ほし',
      mnemonic: 'Life born from the sun \u2014 stars',
      vocab: [{ word: '星', reading: 'ほし', meaning: 'star' }],
    },
  },
  {
    components: ['人', '人'],
    result: {
      character: '从',
      meaning: 'follow, from',
      reading: 'ジュウ',
      mnemonic: 'One person following another',
      vocab: [],
    },
  },
  {
    components: ['口', '口', '口'],
    result: {
      character: '品',
      meaning: 'goods, article, quality',
      reading: 'ヒン / しな',
      mnemonic: 'Three mouths discussing the quality of goods',
      vocab: [{ word: '品物', reading: 'しなもの', meaning: 'goods/article' }],
    },
  },
  {
    components: ['山', '山', '山'],
    result: {
      character: '嶽',
      meaning: 'peak, mountain',
      reading: 'ガク / たけ',
      mnemonic: 'Three mountains towering \u2014 a great peak',
      vocab: [],
    },
  },
  {
    components: ['田', '力'],
    result: {
      character: '男',
      meaning: 'man, male',
      reading: 'ダン / おとこ',
      mnemonic:
        "Strength (\u529B) in the rice field (\u7530) \u2014 traditionally a man's role",
      vocab: [
        { word: '男', reading: 'おとこ', meaning: 'man' },
        { word: '男性', reading: 'だんせい', meaning: 'male' },
      ],
    },
  },
  {
    components: ['日', '一'],
    result: {
      character: '旦',
      meaning: 'daybreak, dawn',
      reading: 'タン / ダン',
      mnemonic: 'The sun (\u65E5) over the horizon line (\u4E00) \u2014 dawn',
      vocab: [
        { word: '元旦', reading: 'がんたん', meaning: "New Year's Day" },
      ],
    },
  },
  {
    components: ['大', '一'],
    result: {
      character: '天',
      meaning: 'heaven, sky',
      reading: 'テン / あま',
      mnemonic: 'Above (\u4E00) the great (\u5927) \u2014 heaven',
      vocab: [
        { word: '天気', reading: 'てんき', meaning: 'weather' },
        { word: '天国', reading: 'てんごく', meaning: 'heaven' },
      ],
    },
  },
  {
    components: ['口', '木'],
    result: {
      character: '杏',
      meaning: 'apricot',
      reading: 'アン / あんず',
      mnemonic: 'A tree (\u6728) with fruit you put in your mouth (\u53E3)',
      vocab: [{ word: '杏', reading: 'あんず', meaning: 'apricot' }],
    },
  },
  {
    components: ['人', '大'],
    result: {
      character: '犬',
      meaning: 'dog',
      reading: 'ケン / いぬ',
      mnemonic:
        'A big (\u5927) figure with a person-like dot \u2014 a pictograph of a dog',
      vocab: [
        { word: '犬', reading: 'いぬ', meaning: 'dog' },
        { word: '子犬', reading: 'こいぬ', meaning: 'puppy' },
      ],
    },
  },
  {
    components: ['火', '火'],
    result: {
      character: '炎',
      meaning: 'flame, blaze',
      reading: 'エン / ほのお',
      mnemonic: 'Two fires stacked \u2014 a roaring blaze',
      vocab: [{ word: '炎', reading: 'ほのお', meaning: 'flame' }],
    },
  },
  {
    components: ['言', '口'],
    result: {
      character: '訟',
      meaning: 'lawsuit, accusation',
      reading: 'ショウ',
      mnemonic:
        'Words (\u8A00) from a mouth (\u53E3) \u2014 making accusations in court',
      vocab: [
        { word: '訴訟', reading: 'そしょう', meaning: 'lawsuit/litigation' },
      ],
    },
  },
  {
    components: ['山', '石'],
    result: {
      character: '岩',
      meaning: 'rock, crag',
      reading: 'ガン / いわ',
      mnemonic: 'A stone (\u77F3) on a mountain (\u5C71) \u2014 a crag',
      vocab: [
        { word: '岩', reading: 'いわ', meaning: 'rock/crag' },
        { word: '岩石', reading: 'がんせき', meaning: 'rock/boulder' },
      ],
    },
  },
  {
    components: ['糸', '言'],
    result: {
      character: '詩',
      meaning: 'poem',
      reading: 'シ',
      mnemonic:
        'Words (\u8A00) woven like threads (\u7CF8) \u2014 poetry',
      vocab: [
        { word: '詩', reading: 'し', meaning: 'poem/poetry' },
        { word: '詩人', reading: 'しじん', meaning: 'poet' },
      ],
    },
  },
  {
    components: ['雨', '下'],
    result: {
      character: '雫',
      meaning: 'drop, drip',
      reading: 'ダ / しずく',
      mnemonic: 'Rain (\u96E8) falling down (\u4E0B) \u2014 a raindrop',
      vocab: [{ word: '雫', reading: 'しずく', meaning: 'drop/drip' }],
    },
  },
  {
    components: ['門', '日'],
    result: {
      character: '間',
      meaning: 'interval, between, space',
      reading: 'カン / あいだ',
      mnemonic:
        'The sun (\u65E5) peeking through a gate (\u9580) \u2014 the space between',
      vocab: [
        { word: '時間', reading: 'じかん', meaning: 'time' },
        { word: '間', reading: 'あいだ', meaning: 'between/space' },
        { word: '人間', reading: 'にんげん', meaning: 'human being' },
      ],
    },
  },
]

// ---------------------------------------------------------------------------
// Palette components (radicals + simple kanji usable as building blocks)
// ---------------------------------------------------------------------------

const PALETTE_COMPONENTS: PaletteComponent[] = [
  { character: '人', meaning: 'person' },
  { character: '口', meaning: 'mouth' },
  { character: '日', meaning: 'sun/day' },
  { character: '月', meaning: 'moon' },
  { character: '水', meaning: 'water' },
  { character: '火', meaning: 'fire' },
  { character: '木', meaning: 'tree' },
  { character: '金', meaning: 'gold/metal' },
  { character: '土', meaning: 'earth' },
  { character: '山', meaning: 'mountain' },
  { character: '川', meaning: 'river' },
  { character: '田', meaning: 'rice field' },
  { character: '目', meaning: 'eye' },
  { character: '手', meaning: 'hand' },
  { character: '心', meaning: 'heart' },
  { character: '女', meaning: 'woman' },
  { character: '子', meaning: 'child' },
  { character: '大', meaning: 'big' },
  { character: '一', meaning: 'one' },
  { character: '力', meaning: 'power' },
  { character: '生', meaning: 'life/birth' },
  { character: '石', meaning: 'stone' },
  { character: '言', meaning: 'words/say' },
  { character: '糸', meaning: 'thread' },
  { character: '雨', meaning: 'rain' },
  { character: '下', meaning: 'below' },
  { character: '門', meaning: 'gate' },
]

// Max number of forge slots
const MAX_SLOTS = 3

// ---------------------------------------------------------------------------
// Helper: sort-independent recipe matching
// ---------------------------------------------------------------------------

function makeRecipeKey(components: string[]): string {
  return [...components].sort().join('+')
}

const RECIPE_MAP = new Map<string, ForgeRecipe>()
for (const recipe of FORGE_RECIPES) {
  RECIPE_MAP.set(makeRecipeKey(recipe.components), recipe)
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function KanjiForge() {
  // Forge slots (selected components)
  const [slots, setSlots] = useState<string[]>([])

  // Forging state
  const [forgeResult, setForgeResult] = useState<ForgeResult | null>(null)
  const [forgeError, setForgeError] = useState<string | null>(null)
  const [isForging, setIsForging] = useState(false)
  const [showResult, setShowResult] = useState(false)

  // Discovery tracker
  const [forgedKanji, setForgedKanji] = useState<
    Map<string, { character: string; components: string[] }>
  >(new Map())

  // Hint system
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [currentHint, setCurrentHint] = useState<string | null>(null)

  // Discoveries panel expanded
  const [discoveriesExpanded, setDiscoveriesExpanded] = useState(true)

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const addComponent = useCallback(
    (char: string) => {
      if (slots.length >= MAX_SLOTS) return
      // Reset previous result when modifying slots
      setForgeResult(null)
      setForgeError(null)
      setShowResult(false)
      setSlots((prev) => [...prev, char])
    },
    [slots.length],
  )

  const removeSlot = useCallback((index: number) => {
    setSlots((prev) => prev.filter((_, i) => i !== index))
    setForgeResult(null)
    setForgeError(null)
    setShowResult(false)
  }, [])

  const clearSlots = useCallback(() => {
    setSlots([])
    setForgeResult(null)
    setForgeError(null)
    setShowResult(false)
    setCurrentHint(null)
    setFailedAttempts(0)
  }, [])

  const forge = useCallback(() => {
    if (slots.length < 2) return
    setIsForging(true)
    setForgeResult(null)
    setForgeError(null)
    setShowResult(false)

    // Simulate a short "forging" delay for dramatic effect
    setTimeout(() => {
      const key = makeRecipeKey(slots)
      const recipe = RECIPE_MAP.get(key)

      if (recipe) {
        setForgeResult(recipe.result)
        setShowResult(true)
        setFailedAttempts(0)
        setCurrentHint(null)

        // Track discovery
        setForgedKanji((prev) => {
          const next = new Map(prev)
          if (!next.has(recipe.result.character)) {
            next.set(recipe.result.character, {
              character: recipe.result.character,
              components: [...recipe.components],
            })
          }
          return next
        })
      } else {
        const newAttempts = failedAttempts + 1
        setFailedAttempts(newAttempts)

        // Generate hint based on attempt count
        const hint = generateHint(slots, newAttempts)
        setCurrentHint(hint)
        setForgeError(
          "This combination doesn't form a known kanji. Try different components!",
        )
      }
      setIsForging(false)
    }, 600)
  }, [slots, failedAttempts])

  // -------------------------------------------------------------------------
  // Hint generation
  // -------------------------------------------------------------------------

  const generateHint = useCallback(
    (currentSlots: string[], attempts: number): string | null => {
      // Find recipes that use at least one of the current components
      const partialMatches = FORGE_RECIPES.filter((r) =>
        currentSlots.some((s) => r.components.includes(s)),
      )

      if (partialMatches.length === 0) {
        return 'These components are not used in any known combinations. Try starting with common components like \u65E5, \u6728, or \u4EBA.'
      }

      if (attempts >= 5) {
        // Reveal a specific recipe
        const hint = partialMatches[0]
        if (hint) {
          return `Try combining: ${hint.components.join(' + ')} = ?`
        }
      }

      if (attempts >= 3) {
        // Give a meaning hint
        const hint = partialMatches[0]
        if (hint) {
          return `One of your components appears in a kanji meaning "${hint.result.meaning}"...`
        }
      }

      // After first failure, a gentle nudge
      if (partialMatches.length > 0) {
        const componentSet = new Set(currentSlots)
        const suggestion = partialMatches.find(
          (r) => !r.components.every((c) => componentSet.has(c)),
        )
        if (suggestion) {
          const missing = suggestion.components.find(
            (c) => !componentSet.has(c),
          )
          if (missing) {
            const paletteItem = PALETTE_COMPONENTS.find(
              (p) => p.character === missing,
            )
            return `Try pairing with something related to "${paletteItem?.meaning ?? 'another component'}"...`
          }
        }
      }

      return null
    },
    [],
  )

  // -------------------------------------------------------------------------
  // Suggested combinations (for discovery panel)
  // -------------------------------------------------------------------------

  const suggestions = useMemo(() => {
    const unforged = FORGE_RECIPES.filter(
      (r) => !forgedKanji.has(r.result.character),
    )
    // Pick up to 3 suggestions, showing only components (not the result)
    return unforged.slice(0, 3).map((r) => r.components.join(' + ') + ' = ?')
  }, [forgedKanji])

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-col gap-4 p-4 animate-page-in">
        {/* Header */}
        <div>
          <h2 className="text-lg font-semibold text-parchment">
            Compose
          </h2>
          <p className="text-xs text-warm-gray/60 mt-0.5">
            Assemble kanji from their components
          </p>
        </div>

        {/* Component Palette */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xs uppercase tracking-widest text-warm-gray/70">
              Component Palette
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {PALETTE_COMPONENTS.map((comp) => (
                <Tooltip key={comp.character}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => addComponent(comp.character)}
                      disabled={slots.length >= MAX_SLOTS}
                      className={cn(
                        'flex flex-col items-center justify-center',
                        'w-12 h-14 rounded',
                        'bg-charcoal-slate border border-ash-stone/20',
                        'transition-all duration-200',
                        'hover:border-ash-stone/50 hover:bg-ash-stone/40',
                        'active:scale-95',
                        'disabled:opacity-40 disabled:cursor-not-allowed',
                        'focus-ring',
                      )}
                    >
                      <span className="text-xl text-parchment leading-none">
                        {comp.character}
                      </span>
                      <span className="text-[10px] text-warm-gray mt-1 leading-none truncate w-full text-center px-0.5">
                        {comp.meaning}
                      </span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {comp.character} &mdash; {comp.meaning}
                    </p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Workspace */}
        <Card className="relative overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs uppercase tracking-widest text-warm-gray/70">
              Workspace
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-6">
              {/* Slots */}
              <div className="flex items-center gap-3 min-h-[120px]">
                {slots.length === 0 && (
                  <p className="text-warm-gray/60 text-sm italic">
                    Select components from the palette above
                  </p>
                )}
                {slots.map((char, idx) => {
                  const comp = PALETTE_COMPONENTS.find(
                    (p) => p.character === char,
                  )
                  return (
                    <div key={`${char}-${idx}`} className="flex items-center gap-3">
                      {idx > 0 && (
                        <span className="text-2xl text-warm-gray/50 font-light select-none">
                          +
                        </span>
                      )}
                      <button
                        onClick={() => removeSlot(idx)}
                        className={cn(
                          'relative flex flex-col items-center justify-center',
                          'w-20 h-24 rounded-lg',
                          'bg-charcoal-slate border border-ash-stone/40',
                          'transition-all duration-200',
                          'hover:border-oxide-red/60',
                          'group',
                        )}
                        title="Click to remove"
                      >
                        <span className="text-3xl text-parchment leading-none">
                          {char}
                        </span>
                        <span className="text-xs text-warm-gray mt-1.5">
                          {comp?.meaning ?? ''}
                        </span>
                        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-oxide-red/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 className="w-3 h-3 text-parchment" />
                        </div>
                      </button>
                    </div>
                  )
                })}
                {slots.length > 0 && (
                  <>
                    <span className="text-2xl text-warm-gray/50 font-light select-none ml-2">
                      =
                    </span>
                    <div
                      className={cn(
                        'flex items-center justify-center',
                        'w-20 h-24 rounded-xl',
                        'border-2 border-dashed border-ash-stone/40',
                        'text-3xl text-warm-gray/30',
                      )}
                    >
                      ?
                    </div>
                  </>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearSlots}
                  disabled={slots.length === 0 || isForging}
                  className="gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Clear
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={forge}
                  disabled={slots.length < 2 || isForging}
                  className={cn(
                    'gap-1.5 min-w-[100px]',
                    isForging && 'animate-pulse',
                  )}
                >
                  {isForging ? 'Building...' : 'Build'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error / Hint */}
        {forgeError && (
          <Card className="border-oxide-red/30 bg-oxide-red/5">
            <CardContent className="pt-5 pb-4">
              <p className="text-sm text-parchment/80">{forgeError}</p>
              {currentHint && (
                <div className="flex items-start gap-2 mt-3 p-3 rounded-lg bg-charcoal-slate/60 border border-icon-gold/20">
                  <Lightbulb className="w-4 h-4 text-icon-gold mt-0.5 shrink-0" />
                  <p className="text-sm text-icon-gold/90">{currentHint}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Result */}
        {forgeResult && (
          <Card
            className={cn(
              'border-ash-stone/20 overflow-hidden',
              showResult && 'forge-result-enter',
            )}
          >
            <CardContent className="pt-6 pb-6">
              <div className="flex flex-col items-center gap-4">
                {/* Forged Kanji */}
                <div
                  className={cn(
                    'flex flex-col items-center',
                    showResult && 'forge-kanji-appear',
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="text-7xl text-icon-gold leading-none"
                      style={{
                        textShadow: '0 0 30px rgba(200, 162, 74, 0.3)',
                      }}
                    >
                      {forgeResult.character}
                    </span>
                    <SpeakButton text={forgeResult.character} />
                  </div>
                  <p className="text-lg text-parchment mt-3">
                    {forgeResult.meaning}
                  </p>
                  <p className="text-sm text-warm-gray mt-1">
                    {forgeResult.reading}
                  </p>
                </div>

                {/* Mnemonic */}
                <div className="max-w-md text-center px-4 py-3 rounded-lg bg-charcoal-slate/60 border border-ash-stone/20">
                  <p className="text-sm text-parchment/80 italic">
                    &ldquo;{forgeResult.mnemonic}&rdquo;
                  </p>
                </div>

                {/* Vocabulary */}
                {forgeResult.vocab.length > 0 && (
                  <div className="w-full max-w-md">
                    <h4 className="text-sm font-medium text-warm-gray mb-2">
                      Vocabulary
                    </h4>
                    <div className="flex flex-col gap-1.5">
                      {forgeResult.vocab.map((v) => (
                        <div
                          key={v.word}
                          className="flex items-center gap-3 px-3 py-2 rounded bg-charcoal-slate/40"
                        >
                          <span className="text-base text-parchment font-medium">
                            {v.word}
                          </span>
                          <span className="text-sm text-warm-gray">
                            ({v.reading})
                          </span>
                          <InlineSpeakButton text={v.reading} />
                          <span className="text-sm text-warm-gray/70 ml-auto">
                            {v.meaning}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action */}
                <Button variant="outline" size="sm" className="gap-1.5 mt-2">
                  <ExternalLink className="w-3.5 h-3.5" />
                  Explore in Web
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Discoveries */}
        <Card>
          <CardHeader className="pb-3">
            <button
              onClick={() => setDiscoveriesExpanded((v) => !v)}
              className="flex items-center justify-between w-full"
            >
              <CardTitle className="text-xs uppercase tracking-widest text-warm-gray/70 flex items-center gap-2">
                Discoveries
                <Badge variant="secondary" className="ml-2 text-xs">
                  {forgedKanji.size} / {FORGE_RECIPES.length}
                </Badge>
              </CardTitle>
              {discoveriesExpanded ? (
                <ChevronUp className="h-4 w-4 text-warm-gray" />
              ) : (
                <ChevronDown className="h-4 w-4 text-warm-gray" />
              )}
            </button>
          </CardHeader>
          {discoveriesExpanded && (
            <CardContent>
              {/* Progress bar */}
              <div className="w-full h-2 bg-charcoal-slate rounded-full overflow-hidden mb-4">
                <div
                  className="h-full bg-verdigris rounded-full transition-all duration-500"
                  style={{
                    width: `${(forgedKanji.size / FORGE_RECIPES.length) * 100}%`,
                  }}
                />
              </div>

              {/* Forged list */}
              {forgedKanji.size > 0 && (
                <ScrollArea className="max-h-[120px] mb-4">
                  <div className="flex flex-wrap gap-2">
                    {Array.from(forgedKanji.values()).map((entry) => (
                      <div
                        key={entry.character}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-charcoal-slate/60 border border-verdigris/20"
                      >
                        <Check className="w-3.5 h-3.5 text-verdigris" />
                        <span className="text-sm text-parchment">
                          {entry.character}
                        </span>
                        <span className="text-xs text-warm-gray">
                          ({entry.components.join('+')})
                        </span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}

              {forgedKanji.size === 0 && (
                <p className="text-sm text-warm-gray/60 mb-4">
                  No kanji composed yet. Start combining components.
                </p>
              )}

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div>
                  <p className="text-xs text-warm-gray mb-2 flex items-center gap-1.5">
                    <Lightbulb className="w-3 h-3 text-icon-gold" />
                    Try combining:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((s) => (
                      <span
                        key={s}
                        className="text-xs text-icon-gold/70 px-2 py-1 rounded bg-icon-gold/5 border border-icon-gold/15"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {forgedKanji.size === FORGE_RECIPES.length && (
                <div className="text-center py-4">
                  <p className="text-sm text-verdigris font-medium">
                    All compositions discovered.
                  </p>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      </div>

      {/* Forge CSS animations (scoped via class names) */}
      <style>{`
        .forge-result-enter {
          animation: forge-card-enter 0.4s ease-out;
        }
        .forge-kanji-appear {
          animation: forge-scale-up 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes forge-card-enter {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes forge-scale-up {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          60% {
            opacity: 1;
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
          }
        }
      `}</style>
    </TooltipProvider>
  )
}
