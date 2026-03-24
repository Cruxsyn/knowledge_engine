/**
 * Japanese audio playback via Web Speech API.
 *
 * Requires a Japanese voice installed on the system.
 * Windows: Settings → Time & Language → Speech → Add voices → Japanese
 * The voice will appear after restart.
 */

let jaVoice: SpeechSynthesisVoice | null = null
let voiceSearchDone = false
let hasJapaneseVoice = false

function findJaVoice(): SpeechSynthesisVoice | null {
  const voices = speechSynthesis.getVoices()
  jaVoice = voices.find(
    v => v.lang === 'ja-JP' || v.lang === 'ja' || v.lang.startsWith('ja-')
  ) ?? null
  if (voices.length > 0) {
    voiceSearchDone = true
    hasJapaneseVoice = jaVoice !== null
  }
  return jaVoice
}

/**
 * Speak Japanese text.
 * Returns false if no Japanese voice is available.
 */
export async function speakJapanese(text: string, rate: number = 0.9): Promise<boolean> {
  if (!text.trim()) return false
  if (!('speechSynthesis' in window)) return false

  const voice = findJaVoice()
  if (!voice) return false

  speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'ja-JP'
  u.rate = rate
  u.voice = voice
  speechSynthesis.speak(u)
  return true
}

/** Stop playback. */
export function stopAudio(): void {
  speechSynthesis?.cancel()
}

/** Check if a Japanese voice is installed. */
export function isJapaneseVoiceAvailable(): boolean {
  if (!voiceSearchDone) findJaVoice()
  return hasJapaneseVoice
}

/** Preload voices (async in Chrome). */
export function preloadVoices(): void {
  if (!('speechSynthesis' in window)) return
  speechSynthesis.getVoices()
  speechSynthesis.onvoiceschanged = () => findJaVoice()
}
