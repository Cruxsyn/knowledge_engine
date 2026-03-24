/**
 * Japanese audio playback module.
 *
 * Uses two strategies:
 * 1. Web Speech API (built-in, zero deps, offline capable)
 * 2. Edge TTS Browser (neural voices, higher quality, requires internet)
 *
 * Falls back gracefully: Edge TTS → Web Speech API → silent
 */

let edgeTtsAvailable: boolean | null = null
let edgeTtsModule: typeof import('@kingdanx/edge-tts-browser') | null = null

// Cache for generated audio blobs (avoid re-generating same text)
const audioCache = new Map<string, string>() // text → objectURL

/**
 * Lazily load and check Edge TTS availability.
 */
async function getEdgeTts() {
  if (edgeTtsAvailable === false) return null
  if (edgeTtsModule) return edgeTtsModule

  try {
    edgeTtsModule = await import('@kingdanx/edge-tts-browser')
    edgeTtsAvailable = true
    return edgeTtsModule
  } catch {
    edgeTtsAvailable = false
    return null
  }
}

/**
 * Speak Japanese text using the best available method.
 *
 * @param text - Japanese text to speak
 * @param rate - Playback rate (0.5 = slow, 1.0 = normal, 1.5 = fast)
 * @param useNeural - Try neural voice first (Edge TTS), fallback to Web Speech
 */
export async function speakJapanese(
  text: string,
  rate: number = 0.9,
  useNeural: boolean = true
): Promise<void> {
  if (!text.trim()) return

  // Try Edge TTS (neural) first
  if (useNeural) {
    const success = await speakWithEdgeTts(text, rate)
    if (success) return
  }

  // Fallback to Web Speech API
  speakWithWebSpeech(text, rate)
}

/**
 * Speak using Edge TTS (Microsoft neural voices).
 * Returns true if successful.
 */
async function speakWithEdgeTts(text: string, rate: number): Promise<boolean> {
  try {
    const mod = await getEdgeTts()
    if (!mod) return false

    // Check cache
    const cacheKey = `edge:${text}:${rate}`
    let objectUrl = audioCache.get(cacheKey)

    if (!objectUrl) {
      const tts = new mod.EdgeTTSBrowser()

      // Convert rate (0.5-2.0) to Edge TTS format (percentage string)
      const ratePercent = Math.round((rate - 1) * 100)
      const rateStr = ratePercent >= 0 ? `+${ratePercent}%` : `${ratePercent}%`

      tts.tts.setVoiceParams({
        text,
        voice: 'ja-JP-NanamiNeural',
        rate: rateStr,
        volume: '+0%',
        pitch: '+0Hz',
      })

      const blob = await tts.ttsToBlob()
      objectUrl = URL.createObjectURL(blob)

      // Cache (limit cache size)
      if (audioCache.size > 200) {
        const firstKey = audioCache.keys().next().value
        if (firstKey) {
          URL.revokeObjectURL(audioCache.get(firstKey)!)
          audioCache.delete(firstKey)
        }
      }
      audioCache.set(cacheKey, objectUrl)
    }

    const audio = new Audio(objectUrl)
    audio.playbackRate = 1 // Rate already baked into TTS
    await audio.play()
    return true
  } catch (err) {
    console.warn('[audio] Edge TTS failed, falling back to Web Speech:', err)
    return false
  }
}

/**
 * Speak using the built-in Web Speech API.
 */
function speakWithWebSpeech(text: string, rate: number): void {
  if (!('speechSynthesis' in window)) {
    console.warn('[audio] Web Speech API not available')
    return
  }

  // Cancel any in-progress speech
  speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'ja-JP'
  utterance.rate = rate

  // Try to find a Japanese voice
  const voices = speechSynthesis.getVoices()
  const jaVoice = voices.find(
    (v) => v.lang === 'ja-JP' || v.lang === 'ja' || v.lang.startsWith('ja-')
  )
  if (jaVoice) {
    utterance.voice = jaVoice
  }

  speechSynthesis.speak(utterance)
}

/**
 * Stop any currently playing audio.
 */
export function stopAudio(): void {
  speechSynthesis?.cancel()
}

/**
 * Check if audio playback is available.
 */
export function isAudioAvailable(): boolean {
  return 'speechSynthesis' in window
}

/**
 * Preload voices (needed on some browsers where getVoices() is async).
 */
export function preloadVoices(): void {
  if ('speechSynthesis' in window) {
    speechSynthesis.getVoices()
    // Chrome loads voices asynchronously
    speechSynthesis.onvoiceschanged = () => {
      speechSynthesis.getVoices()
    }
  }
}
