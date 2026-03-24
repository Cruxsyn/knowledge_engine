/**
 * Japanese audio playback.
 *
 * Strategy:
 * 1. Edge TTS (Microsoft neural voices via WebSocket) — high quality
 * 2. Web Speech API fallback — if Edge TTS fails AND a Japanese voice exists
 */

// ── Edge TTS ──────────────────────────────────────────────────

let edgeTtsModule: { default: new () => EdgeTTSInstance } | null = null
let edgeTtsLoaded = false

interface EdgeTTSInstance {
  tts: {
    setVoiceParams: (params: {
      text: string
      voice: string
      rate: string
      volume: string
      pitch: string
    }) => void
  }
  ttsToFile: () => Promise<Blob>
}

async function getEdgeTts(): Promise<typeof edgeTtsModule> {
  if (edgeTtsLoaded) return edgeTtsModule
  try {
    edgeTtsModule = await import('@kingdanx/edge-tts-browser') as typeof edgeTtsModule
    edgeTtsLoaded = true
    return edgeTtsModule
  } catch {
    edgeTtsLoaded = true
    edgeTtsModule = null
    return null
  }
}

// Audio blob cache to avoid regenerating the same text
const blobCache = new Map<string, string>()

async function speakEdgeTts(text: string, rate: number): Promise<boolean> {
  try {
    const mod = await getEdgeTts()
    if (!mod) return false

    const cacheKey = `${text}:${rate}`
    let url = blobCache.get(cacheKey)

    if (!url) {
      const tts = new mod.default()
      const pct = Math.round((rate - 1) * 100)
      tts.tts.setVoiceParams({
        text,
        voice: 'ja-JP-NanamiNeural',
        rate: pct >= 0 ? `+${pct}%` : `${pct}%`,
        volume: '+0%',
        pitch: '+0Hz',
      })

      const blob = await tts.ttsToFile()
      if (!blob || blob.size === 0) return false

      url = URL.createObjectURL(blob)

      // Evict oldest if cache is large
      if (blobCache.size > 150) {
        const first = blobCache.entries().next().value
        if (first) {
          URL.revokeObjectURL(first[1])
          blobCache.delete(first[0])
        }
      }
      blobCache.set(cacheKey, url)
    }

    await new Audio(url).play()
    return true
  } catch {
    return false
  }
}

// ── Web Speech API fallback ───────────────────────────────────

let jaVoice: SpeechSynthesisVoice | null = null
let voiceChecked = false

function findJaVoice(): SpeechSynthesisVoice | null {
  if (voiceChecked) return jaVoice
  const voices = speechSynthesis.getVoices()
  jaVoice = voices.find(
    v => v.lang === 'ja-JP' || v.lang === 'ja' || v.lang.startsWith('ja-')
  ) ?? null
  if (voices.length > 0) voiceChecked = true
  return jaVoice
}

function speakWebSpeech(text: string, rate: number): boolean {
  if (!('speechSynthesis' in window)) return false
  const voice = findJaVoice()
  if (!voice) return false // No Japanese voice available — don't speak English

  speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'ja-JP'
  u.rate = rate
  u.voice = voice
  speechSynthesis.speak(u)
  return true
}

// ── Public API ────────────────────────────────────────────────

/**
 * Speak Japanese text. Tries Edge TTS first, falls back to Web Speech.
 */
export async function speakJapanese(text: string, rate: number = 0.9): Promise<void> {
  if (!text.trim()) return
  const ok = await speakEdgeTts(text, rate)
  if (!ok) speakWebSpeech(text, rate)
}

/** Stop any currently playing audio. */
export function stopAudio(): void {
  speechSynthesis?.cancel()
}

/** Whether any audio method is likely available. */
export function isAudioAvailable(): boolean {
  return 'speechSynthesis' in window
}

/** Preload voices and Edge TTS module. */
export function preloadVoices(): void {
  if ('speechSynthesis' in window) {
    speechSynthesis.getVoices()
    speechSynthesis.onvoiceschanged = () => findJaVoice()
  }
  getEdgeTts() // start loading module
}
