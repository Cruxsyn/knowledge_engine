import { Settings, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useJapaneseStore } from '@/stores/japaneseStore'

// ── Sub-Components ───────────────────────────────────────────────────────

function SettingRow({
  label,
  description,
  children,
  warning,
}: {
  label: string
  description: string
  children: React.ReactNode
  warning?: string
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6 py-4 border-b border-ash-stone/20 last:border-0">
      <div className="sm:w-1/2">
        <Label className="text-sm font-medium text-parchment">{label}</Label>
        <p className="text-xs text-warm-gray/70 mt-0.5">{description}</p>
        {warning && (
          <p className="text-xs text-oxide-red/80 mt-1 flex items-start gap-1">
            <Info className="h-3 w-3 mt-0.5 shrink-0" />
            {warning}
          </p>
        )}
      </div>
      <div className="sm:w-1/2 flex items-center">{children}</div>
    </div>
  )
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-icon-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-obsidian',
        checked ? 'bg-icon-gold' : 'bg-ash-stone'
      )}
    >
      <span
        className={cn(
          'pointer-events-none block h-5 w-5 rounded-full bg-parchment shadow-sm ring-0 transition-transform duration-200',
          checked ? 'translate-x-5.5' : 'translate-x-0.5',
          'mt-0.5'
        )}
      />
    </button>
  )
}

function RetentionSlider({
  value,
  onChange,
}: {
  value: number
  onChange: (v: number) => void
}) {
  const pct = ((value - 0.7) / 0.27) * 100

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={70}
          max={97}
          step={1}
          value={Math.round(value * 100)}
          onChange={(e) => onChange(Number(e.target.value) / 100)}
          className="flex-1 h-2 accent-icon-gold bg-ash-stone/30 rounded-full cursor-pointer
            [&::-webkit-slider-thumb]:bg-icon-gold [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-runnable-track]:bg-ash-stone/30 [&::-webkit-slider-runnable-track]:rounded-full
            [&::-webkit-slider-runnable-track]:h-2
            appearance-none"
        />
        <span className="text-sm font-mono text-parchment w-12 text-right tabular-nums">
          {(value * 100).toFixed(0)}%
        </span>
      </div>
      <div className="relative h-1">
        <div className="absolute left-0 right-0 h-1 bg-ash-stone/20 rounded-full" />
        <div
          className="absolute left-0 h-1 bg-icon-gold/40 rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────────────────

export function SettingsPanel() {
  const { settings, updateSettings } = useJapaneseStore()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Settings className="h-5 w-5 text-icon-gold" />
        <h2 className="font-serif text-xl text-parchment">Learning Settings</h2>
      </div>

      {/* SRS Settings */}
      <div className="bg-charcoal-slate/50 border border-ash-stone/30 rounded-lg p-6">
        <h3 className="font-serif text-base text-parchment mb-2">SRS Configuration</h3>
        <p className="text-xs text-warm-gray/60 mb-4">
          Settings are synced to the jp_settings table. Changes take effect on next review session.
        </p>

        <div className="divide-y divide-ash-stone/20">
          {/* Desired Retention */}
          <SettingRow
            label="Desired Retention"
            description="Higher values mean fewer forgotten cards but more reviews. 0.90 is recommended for most learners."
          >
            <RetentionSlider
              value={settings.desiredRetention}
              onChange={(v) => updateSettings({ desiredRetention: v })}
            />
          </SettingRow>

          {/* New Cards per Day */}
          <SettingRow
            label="New Cards per Day"
            description="Total new cards introduced each day, split across radicals, kanji, and vocabulary."
          >
            <Input
              type="number"
              min={0}
              max={50}
              value={settings.newCardsPerDay}
              onChange={(e) => updateSettings({ newCardsPerDay: Number(e.target.value) })}
              className="w-24 text-center"
            />
          </SettingRow>

          {/* Card type breakdown */}
          <SettingRow
            label="New Card Breakdown"
            description="How to split new cards across types."
          >
            <div className="flex items-center gap-3 w-full">
              <div className="flex-1">
                <span className="text-[10px] text-warm-gray/60 block mb-1">Radicals</span>
                <Input
                  type="number"
                  min={0}
                  max={20}
                  value={settings.newRadicalsPerDay}
                  onChange={(e) => updateSettings({ newRadicalsPerDay: Number(e.target.value) })}
                  className="w-full text-center text-sm"
                />
              </div>
              <div className="flex-1">
                <span className="text-[10px] text-warm-gray/60 block mb-1">Kanji</span>
                <Input
                  type="number"
                  min={0}
                  max={20}
                  value={settings.newKanjiPerDay}
                  onChange={(e) => updateSettings({ newKanjiPerDay: Number(e.target.value) })}
                  className="w-full text-center text-sm"
                />
              </div>
              <div className="flex-1">
                <span className="text-[10px] text-warm-gray/60 block mb-1">Vocab</span>
                <Input
                  type="number"
                  min={0}
                  max={30}
                  value={settings.newVocabPerDay}
                  onChange={(e) => updateSettings({ newVocabPerDay: Number(e.target.value) })}
                  className="w-full text-center text-sm"
                />
              </div>
            </div>
          </SettingRow>

          {/* Max Reviews */}
          <SettingRow
            label="Max Reviews per Day"
            description="Caps the number of reviews per session."
            warning="Setting below 9999 breaks SRS scheduling. Only lower if you must limit daily time."
          >
            <Input
              type="number"
              min={10}
              max={9999}
              value={settings.maxReviewsPerDay}
              onChange={(e) => updateSettings({ maxReviewsPerDay: Number(e.target.value) })}
              className="w-24 text-center"
            />
          </SettingRow>

          {/* Review Order */}
          <SettingRow
            label="Review Order"
            description="How cards are ordered within a review session."
          >
            <Select
              value={settings.reviewOrder}
              onValueChange={(v) => updateSettings({ reviewOrder: v as 'due_date' | 'random' | 'difficulty' })}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="due_date">Due Date</SelectItem>
                <SelectItem value="random">Random</SelectItem>
                <SelectItem value="difficulty">Difficulty</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>
        </div>
      </div>

      {/* Display Settings */}
      <div className="bg-charcoal-slate/50 border border-ash-stone/30 rounded-lg p-6">
        <h3 className="font-serif text-base text-parchment mb-2">Display Settings</h3>
        <p className="text-xs text-warm-gray/60 mb-4">
          Visual preferences for reading and review interfaces.
        </p>

        <div className="divide-y divide-ash-stone/20">
          {/* Show Pitch Accent */}
          <SettingRow
            label="Show Pitch Accent"
            description="Display pitch accent indicators on vocabulary cards and readings."
          >
            <Toggle
              checked={settings.showPitchAccent}
              onChange={(v) => updateSettings({ showPitchAccent: v })}
            />
          </SettingRow>

          {/* Show Furigana */}
          <SettingRow
            label="Show Furigana by Default"
            description="Show reading annotations above kanji in reading practice by default."
          >
            <Toggle
              checked={settings.showFurigana}
              onChange={(v) => updateSettings({ showFurigana: v })}
            />
          </SettingRow>

          {/* Interleave Reviews */}
          <SettingRow
            label="Interleave Reviews"
            description="Mix different card types (radicals, kanji, vocab) during reviews instead of grouping them."
          >
            <Toggle
              checked={settings.interleaveReviews}
              onChange={(v) => updateSettings({ interleaveReviews: v })}
            />
          </SettingRow>
        </div>
      </div>
    </div>
  )
}
