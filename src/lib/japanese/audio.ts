/**
 * Japanese audio playback using Web Speech API.
 * Simple, reliable, zero dependencies. Works offline on most platforms.
 */

let voicesLoaded = false
let voicesPromise: Promise<void> | null = null

/**
 * Ensure speech synthesis voices are loaded (async in Chrome).
 */
function ensureVoices(): Promise<void> {
  if (voicesLoaded) return Promise.resolve()
  if (voicesPromise) return voicesPromise

  voicesPromise = new Promise<void>((resolve) => {
    const voices = speechSynthesis.getVoices()
    if (voices.length > 0) {
      voicesLoaded = true
      resolve()
      return
    }
    // Chrome loads voices asynchronously
    speechSynthesis.onvoiceschanged = () => {
      voicesLoaded = true
      resolve()
    }
    // Timeout fallback — speak without explicit voice selection
    setTimeout(() => {
      voicesLoaded = true
      resolve()
    }, 1000)
  })

  return voicesPromise
}

/**
 * Speak Japanese text using Web Speech API.
 */
export async function speakJapanese(
  text: string,
  rate: number = 0.9
): Promise<void> {
  if (!text.trim()) return
  if (!('speechSynthesis' in window)) return

  await ensureVoices()

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
 * Preload voices (call early so they're ready when needed).
 */
export function preloadVoices(): void {
  if ('speechSynthesis' in window) {
    ensureVoices()
  }
}
