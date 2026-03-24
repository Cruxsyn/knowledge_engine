/**
 * Japanese audio playback via Web Speech API.
 *
 * Uses Japanese voice if available, otherwise speaks with
 * lang='ja-JP' hint which lets the OS attempt Japanese pronunciation.
 *
 * To install Japanese voice on Windows:
 * Settings → Time & Language → Speech → Add voices → Japanese
 * Then restart Chrome.
 */

let jaVoice: SpeechSynthesisVoice | null = null
let voiceSearchDone = false

function findJaVoice(): SpeechSynthesisVoice | null {
  const voices = speechSynthesis.getVoices()
  jaVoice = voices.find(
    v => v.lang === 'ja-JP' || v.lang === 'ja' || v.lang.startsWith('ja-')
  ) ?? null
  if (voices.length > 0) voiceSearchDone = true
  return jaVoice
}

/**
 * Speak Japanese text. Always attempts to speak — uses Japanese voice
 * if available, otherwise sets lang hint and uses default voice.
 */
export async function speakJapanese(text: string, rate: number = 0.9): Promise<boolean> {
  if (!text.trim()) return false
  if (!('speechSynthesis' in window)) return false

  speechSynthesis.cancel()

  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'ja-JP'
  u.rate = rate

  const voice = findJaVoice()
  if (voice) {
    u.voice = voice
  }
  // If no Japanese voice, still speak — the lang hint may help,
  // and at minimum the user gets audible feedback

  speechSynthesis.speak(u)
  return true
}

/** Stop playback. */
export function stopAudio(): void {
  speechSynthesis?.cancel()
}

/** Check if a dedicated Japanese voice is installed. */
export function isJapaneseVoiceAvailable(): boolean {
  if (!voiceSearchDone) findJaVoice()
  return jaVoice !== null
}

/** Preload voices (async in Chrome). */
export function preloadVoices(): void {
  if (!('speechSynthesis' in window)) return
  speechSynthesis.getVoices()
  speechSynthesis.onvoiceschanged = () => findJaVoice()
}
