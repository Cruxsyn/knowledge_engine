import { useState, useCallback, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PatternCategory =
  | 'particles'
  | 'verb_forms'
  | 'sentence_structure'
  | 'kanji_patterns'
  | 'readings'
  | 'counters'

interface PatternExample {
  japanese: string
  english: string
  highlight: string
}

interface PatternInsight {
  correct: string
  explanation: string
  mnemonic?: string
  systemConnection?: string
}

interface PatternChallenge {
  id: string
  category: PatternCategory
  title: string
  examples: PatternExample[]
  question: string
  acceptableAnswers: string[]
  insight: PatternInsight
  hints: string[]
  difficulty: number
}

// ---------------------------------------------------------------------------
// Category metadata
// ---------------------------------------------------------------------------

const CATEGORY_META: Record<PatternCategory, { label: string; icon: string }> = {
  particles: { label: 'Particles', icon: '\u25C9' },
  verb_forms: { label: 'Verb Forms', icon: '\u25B6' },
  sentence_structure: { label: 'Sentence Structure', icon: '\u2261' },
  kanji_patterns: { label: 'Kanji Patterns', icon: '\u5B57' },
  readings: { label: 'Readings', icon: '\u97F3' },
  counters: { label: 'Counters', icon: '#' },
}

// ---------------------------------------------------------------------------
// Challenge data (20 challenges)
// ---------------------------------------------------------------------------

const PATTERN_CHALLENGES: PatternChallenge[] = [
  // ---- Particles ----
  {
    id: 'p-wa',
    category: 'particles',
    title: '\u300C\u306F\u300D\u3092\u89B3\u5BDF\u3057\u3066\u307F\u307E\u3057\u3087\u3046\u3002What does \u300C\u306F\u300D do?',
    examples: [
      { japanese: '\u79C1 \u306F \u5B66\u751F\u3067\u3059\u3002', english: 'I am a student.', highlight: '\u306F' },
      { japanese: '\u732B \u306F \u304B\u308F\u3044\u3044\u3067\u3059\u3002', english: 'The cat is cute.', highlight: '\u306F' },
      { japanese: '\u6771\u4EAC \u306F \u5927\u304D\u3044\u3067\u3059\u3002', english: 'Tokyo is big.', highlight: '\u306F' },
      { japanese: '\u7530\u4E2D\u3055\u3093 \u306F \u5148\u751F\u3067\u3059\u3002', english: 'Mr. Tanaka is a teacher.', highlight: '\u306F' },
    ],
    question: 'The word before \u300C\u306F\u300D is always:',
    acceptableAnswers: [
      'the topic',
      'topic',
      'subject',
      'the subject',
      'what the sentence is about',
      'the main topic',
      'what we are talking about',
      'the thing being described',
    ],
    insight: {
      correct:
        'Exactly! \u300C\u306F\u300D marks the TOPIC \u2014 what the sentence is ABOUT.',
      explanation:
        '"As for [topic] \u306F, [something about it]." Think of it as a spotlight: \u306F shines a light on what you\'re talking about.',
      mnemonic:
        'Imagine \u300C\u306F\u300D as a stage spotlight \u2014 whatever stands in front of it is the star of the sentence.',
      systemConnection:
        'Later you will discover \u300C\u304C\u300D, which marks the grammatical subject. The difference between \u306F and \u304C is one of the deepest patterns in Japanese.',
    },
    hints: [
      'Look at what appears right BEFORE \u300C\u306F\u300D in every sentence.',
      'Each sentence tells us something about that word. It\'s the main focus.',
      'It marks the thing the whole sentence is describing \u2014 the main ____.',
    ],
    difficulty: 1,
  },
  {
    id: 'p-ga',
    category: 'particles',
    title: 'How is \u300C\u304C\u300D different from \u300C\u306F\u300D?',
    examples: [
      { japanese: '\u8AB0 \u304C \u6765\u307E\u3057\u305F\u304B\u3002', english: 'Who came?', highlight: '\u304C' },
      { japanese: '\u96E8 \u304C \u964D\u3063\u3066\u3044\u307E\u3059\u3002', english: 'It is raining. (Rain is falling.)', highlight: '\u304C' },
      { japanese: '\u72AC \u304C \u3044\u307E\u3059\u3002', english: 'There is a dog.', highlight: '\u304C' },
      { japanese: '\u7530\u4E2D\u3055\u3093 \u304C \u52DD\u3061\u307E\u3057\u305F\u3002', english: 'Tanaka won! (emphasis: it was Tanaka)', highlight: '\u304C' },
    ],
    question: '\u300C\u304C\u300D emphasizes something that is:',
    acceptableAnswers: [
      'new information',
      'new',
      'unknown',
      'emphasized',
      'important',
      'being identified',
      'the focus',
      'newly introduced',
      'specific',
    ],
    insight: {
      correct:
        'Yes! \u300C\u304C\u300D marks new or emphasized information \u2014 it answers "who?" or "what?" when that\'s the unknown.',
      explanation:
        '\u306F sets the stage ("as for X...") while \u304C points a finger ("THIS is the one"). In "Who came?" the answer is new info, so it takes \u304C.',
      mnemonic:
        '\u304C is like an exclamation point for the subject \u2014 "THIS thing right here!"',
      systemConnection:
        'This \u306F/\u304C distinction connects to how information flows in conversation: old/known info uses \u306F, new/surprising info uses \u304C.',
    },
    hints: [
      'Notice the English translations \u2014 the thing before \u304C is often the answer to a question.',
      'Compare with \u306F: \u306F feels like "speaking of X..." while \u304C feels more like "X is the one that..."',
      'The word before \u304C provides NEW or EMPHASIZED information.',
    ],
    difficulty: 2,
  },
  {
    id: 'p-wo',
    category: 'particles',
    title: 'What role does \u300C\u3092\u300D play?',
    examples: [
      { japanese: '\u308A\u3093\u3054 \u3092 \u98DF\u3079\u307E\u3059\u3002', english: 'I eat an apple.', highlight: '\u3092' },
      { japanese: '\u672C \u3092 \u8AAD\u307F\u307E\u3059\u3002', english: 'I read a book.', highlight: '\u3092' },
      { japanese: '\u97F3\u697D \u3092 \u805E\u304D\u307E\u3059\u3002', english: 'I listen to music.', highlight: '\u3092' },
      { japanese: '\u65E5\u672C\u8A9E \u3092 \u52C9\u5F37\u3057\u307E\u3059\u3002', english: 'I study Japanese.', highlight: '\u3092' },
    ],
    question: 'The word before \u300C\u3092\u300D is always the thing being:',
    acceptableAnswers: [
      'acted on',
      'acted upon',
      'the object',
      'object',
      'direct object',
      'receiving the action',
      'affected by the verb',
      'done to',
      'eaten read listened studied',
    ],
    insight: {
      correct:
        'Right! \u300C\u3092\u300D marks the direct object \u2014 the thing receiving the action of the verb.',
      explanation:
        'The pattern is always: [object] \u3092 [verb]. The apple is eaten, the book is read, the music is listened to.',
      mnemonic:
        'Think of \u300C\u3092\u300D as an arrow pointing from the verb back to what it acts on: \u98DF\u3079\u307E\u3059 \u2190 \u3092 \u2190 \u308A\u3093\u3054.',
      systemConnection:
        'Combined with \u306F (topic) and \u304C (subject), \u3092 completes the core sentence skeleton: [topic \u306F] [subject \u304C] [object \u3092] [verb].',
    },
    hints: [
      'In each sentence, something is being DONE. What is it being done TO?',
      'Apples are eaten, books are read, music is listened to...',
      'The word before \u300C\u3092\u300D receives the action \u2014 it is the ____.',
    ],
    difficulty: 1,
  },
  {
    id: 'p-ni',
    category: 'particles',
    title: 'What does \u300C\u306B\u300D point to?',
    examples: [
      { japanese: '\u5B66\u6821 \u306B \u884C\u304D\u307E\u3059\u3002', english: 'I go to school.', highlight: '\u306B' },
      { japanese: '\u6771\u4EAC \u306B \u4F4F\u3093\u3067\u3044\u307E\u3059\u3002', english: 'I live in Tokyo.', highlight: '\u306B' },
      { japanese: '\u53CB\u9054 \u306B \u4F1A\u3044\u307E\u3059\u3002', english: 'I meet a friend.', highlight: '\u306B' },
      { japanese: '\u4E03\u6642 \u306B \u8D77\u304D\u307E\u3059\u3002', english: 'I wake up at 7 o\'clock.', highlight: '\u306B' },
    ],
    question: '\u300C\u306B\u300D points to a:',
    acceptableAnswers: [
      'destination',
      'location',
      'target',
      'direction',
      'place',
      'time',
      'point',
      'specific point',
      'destination or location or time',
      'goal',
      'where or when',
    ],
    insight: {
      correct:
        'Exactly! \u300C\u306B\u300D marks a specific target point \u2014 a destination, location, person, or time.',
      explanation:
        'Think of \u306B as a pin on a map: it marks the precise point something is directed at. "To school," "in Tokyo," "at 7 o\'clock" \u2014 all precise targets.',
      mnemonic:
        '\u306B is a pin \u2014 it pins down exactly WHERE, WHEN, or TO WHOM.',
      systemConnection:
        'Compare with \u300C\u3067\u300D (which you will discover next): \u306B marks a point, while \u3067 marks where an action takes place.',
    },
    hints: [
      'School, Tokyo, a friend, 7 o\'clock \u2014 what do these have in common as targets?',
      'Each one is a specific point that the action is directed at.',
      'It could be a place, a person, or a time \u2014 but always a specific ____.',
    ],
    difficulty: 1,
  },
  {
    id: 'p-de',
    category: 'particles',
    title: 'What does \u300C\u3067\u300D tell us?',
    examples: [
      { japanese: '\u56F3\u66F8\u9928 \u3067 \u52C9\u5F37\u3057\u307E\u3059\u3002', english: 'I study at the library.', highlight: '\u3067' },
      { japanese: '\u7B97 \u3067 \u98DF\u3079\u307E\u3059\u3002', english: 'I eat with chopsticks.', highlight: '\u3067' },
      { japanese: '\u30D0\u30B9 \u3067 \u884C\u304D\u307E\u3059\u3002', english: 'I go by bus.', highlight: '\u3067' },
      { japanese: '\u516C\u5712 \u3067 \u904A\u3073\u307E\u3059\u3002', english: 'I play at the park.', highlight: '\u3067' },
    ],
    question: '\u300C\u3067\u300D tells us the place or means by which an action:',
    acceptableAnswers: [
      'happens',
      'takes place',
      'occurs',
      'is performed',
      'is done',
      'where or how the action happens',
      'location of action',
      'how',
      'method',
      'means',
    ],
    insight: {
      correct:
        'Yes! \u300C\u3067\u300D sets the stage for action \u2014 it marks WHERE an action happens or the MEANS by which it\'s done.',
      explanation:
        'Library is where studying happens. Chopsticks are the tool for eating. Bus is the means of going. \u3067 always answers "where?" or "how?" for the action.',
      mnemonic:
        'If \u306B is a pin (destination), \u3067 is a stage \u2014 it sets the scene where the action plays out.',
      systemConnection:
        '\u306B vs. \u3067 is a key distinction: \u6771\u4EAC\u306B\u4F4F\u3093\u3067\u3044\u307E\u3059 (live IN Tokyo \u2014 static location) vs. \u6771\u4EAC\u3067\u50CD\u3044\u3066\u3044\u307E\u3059 (work IN Tokyo \u2014 where the action of working takes place).',
    },
    hints: [
      'The library is where studying occurs. Chopsticks are how eating is done.',
      'Each one provides context for HOW or WHERE the action takes place.',
      'It marks the location or tool/means for the ____.',
    ],
    difficulty: 2,
  },

  // ---- Verb Forms ----
  {
    id: 'v-masu',
    category: 'verb_forms',
    title: 'What pattern do you see in these verb endings?',
    examples: [
      { japanese: '\u98DF\u3079\u307E\u3059\u3002', english: 'I eat. (polite)', highlight: '\u307E\u3059' },
      { japanese: '\u98F2\u307F\u307E\u3059\u3002', english: 'I drink. (polite)', highlight: '\u307E\u3059' },
      { japanese: '\u884C\u304D\u307E\u3059\u3002', english: 'I go. (polite)', highlight: '\u307E\u3059' },
      { japanese: '\u898B\u307E\u3059\u3002', english: 'I see/watch. (polite)', highlight: '\u307E\u3059' },
    ],
    question: 'All polite present-tense verbs end with:',
    acceptableAnswers: [
      '\u307E\u3059',
      'masu',
      '-masu',
      '\u307E\u3059 (masu)',
      'the masu ending',
    ],
    insight: {
      correct:
        'Right! \u300C\u307E\u3059\u300D is the polite present/future ending \u2014 the standard form you\'ll hear in everyday conversation.',
      explanation:
        'The verb stem + \u307E\u3059 creates the polite form. \u98DF\u3079 + \u307E\u3059 = \u98DF\u3079\u307E\u3059. This is the first form most learners master.',
      mnemonic:
        '\u307E\u3059 is your "polite passport" \u2014 attach it and you\'re always polite.',
      systemConnection:
        'Once you know \u307E\u3059, changing the ending gives you past (\u307E\u3057\u305F), negative (\u307E\u305B\u3093), and past-negative (\u307E\u305B\u3093\u3067\u3057\u305F).',
    },
    hints: [
      'Look at the last two characters of each verb.',
      'They all share the same ending \u2014 what is it?',
      'It sounds like "mah-su."',
    ],
    difficulty: 1,
  },
  {
    id: 'v-mashita',
    category: 'verb_forms',
    title: 'How does the past tense change?',
    examples: [
      { japanese: '\u98DF\u3079\u307E\u3057\u305F\u3002', english: 'I ate. (polite)', highlight: '\u307E\u3057\u305F' },
      { japanese: '\u98F2\u307F\u307E\u3057\u305F\u3002', english: 'I drank. (polite)', highlight: '\u307E\u3057\u305F' },
      { japanese: '\u884C\u304D\u307E\u3057\u305F\u3002', english: 'I went. (polite)', highlight: '\u307E\u3057\u305F' },
      { japanese: '\u898B\u307E\u3057\u305F\u3002', english: 'I saw/watched. (polite)', highlight: '\u307E\u3057\u305F' },
    ],
    question: 'To make a polite verb past tense, \u300C\u307E\u3059\u300D becomes:',
    acceptableAnswers: [
      '\u307E\u3057\u305F',
      'mashita',
      '-mashita',
      '\u307E\u3057\u305F (mashita)',
    ],
    insight: {
      correct:
        'Exactly! \u300C\u307E\u3059\u300D \u2192 \u300C\u307E\u3057\u305F\u300D. Just swap \u300C\u3059\u300D for \u300C\u3057\u305F\u300D to move into the past.',
      explanation:
        'This is one of the most regular patterns in Japanese: the polite past is always formed the same way, no exceptions.',
      mnemonic:
        '\u300C\u3057\u305F\u300D sounds like "sh-ta" \u2014 think "shut the door on the past." Done!',
      systemConnection:
        'You now know present (\u307E\u3059) and past (\u307E\u3057\u305F). Next discover the negative form (\u307E\u305B\u3093) to complete the set.',
    },
    hints: [
      'Compare these endings with the present tense \u307E\u3059 you already discovered.',
      'What part changed? The ending swapped from \u3059 to...',
      'The last two characters became \u3057\u305F.',
    ],
    difficulty: 1,
  },
  {
    id: 'v-masen',
    category: 'verb_forms',
    title: 'How does negation work?',
    examples: [
      { japanese: '\u98DF\u3079\u307E\u305B\u3093\u3002', english: 'I don\'t eat. (polite)', highlight: '\u307E\u305B\u3093' },
      { japanese: '\u98F2\u307F\u307E\u305B\u3093\u3002', english: 'I don\'t drink. (polite)', highlight: '\u307E\u305B\u3093' },
      { japanese: '\u884C\u304D\u307E\u305B\u3093\u3002', english: 'I don\'t go. (polite)', highlight: '\u307E\u305B\u3093' },
      { japanese: '\u898B\u307E\u305B\u3093\u3002', english: 'I don\'t see/watch. (polite)', highlight: '\u307E\u305B\u3093' },
    ],
    question: 'To make a polite verb negative, \u300C\u307E\u3059\u300D becomes:',
    acceptableAnswers: [
      '\u307E\u305B\u3093',
      'masen',
      '-masen',
      '\u307E\u305B\u3093 (masen)',
    ],
    insight: {
      correct:
        'Yes! \u300C\u307E\u3059\u300D \u2192 \u300C\u307E\u305B\u3093\u300D. Swap \u300C\u3059\u300D for \u300C\u305B\u3093\u300D to negate.',
      explanation:
        'Another perfectly regular pattern. You now have three forms: \u307E\u3059 (do), \u307E\u3057\u305F (did), \u307E\u305B\u3093 (don\'t do).',
      mnemonic:
        '\u300C\u305B\u3093\u300D sounds like "sen" \u2014 think "I\'m sending it away" (rejecting it).',
      systemConnection:
        'Combine past + negative: \u307E\u305B\u3093\u3067\u3057\u305F means "didn\'t do." You\'ve now unlocked the complete polite verb grid!',
    },
    hints: [
      'Compare these with \u307E\u3059 (present) and \u307E\u3057\u305F (past). What changed?',
      'The ending after \u307E changed to express "not doing."',
      'It ends with \u305B\u3093.',
    ],
    difficulty: 1,
  },
  {
    id: 'v-te',
    category: 'verb_forms',
    title: 'What is the \u300C\u3066\u300D form pattern?',
    examples: [
      { japanese: '\u98DF\u3079\u3066\u304F\u3060\u3055\u3044\u3002', english: 'Please eat.', highlight: '\u3066' },
      { japanese: '\u898B\u3066\u304F\u3060\u3055\u3044\u3002', english: 'Please look.', highlight: '\u3066' },
      { japanese: '\u672C\u3092\u8AAD\u3093\u3067\u304F\u3060\u3055\u3044\u3002', english: 'Please read the book.', highlight: '\u3093\u3067' },
      { japanese: '\u66F8\u3044\u3066\u304F\u3060\u3055\u3044\u3002', english: 'Please write.', highlight: '\u3066' },
    ],
    question: 'The \u3066/\u3067 form is used to make:',
    acceptableAnswers: [
      'requests',
      'polite requests',
      'please',
      'asking someone to do something',
      'a request',
      'connecting actions',
      'te form',
    ],
    insight: {
      correct:
        'Yes! The \u3066-form is one of the most versatile forms in Japanese. With \u304F\u3060\u3055\u3044, it creates polite requests.',
      explanation:
        'The \u3066-form is a "connector" \u2014 it can link actions (\u98DF\u3079\u3066\u5BDD\u308B = eat and sleep), make requests (\u3066\u304F\u3060\u3055\u3044), show ongoing actions (\u3066\u3044\u308B), and more.',
      mnemonic:
        'Think of \u3066 as Velcro \u2014 it connects the verb to whatever comes next.',
      systemConnection:
        'The \u3066-form is the backbone of many grammar patterns: \u3066\u3044\u308B (ongoing), \u3066\u304F\u3060\u3055\u3044 (request), \u3066\u3082\u3044\u3044 (permission), \u3066\u306F\u3044\u3051\u306A\u3044 (prohibition).',
    },
    hints: [
      'Each sentence is asking someone to do something.',
      '\u304F\u3060\u3055\u3044 means "please" \u2014 so the \u3066/\u3067 part connects the verb to the request.',
      'The \u3066 ending transforms a verb so it can attach to other grammar patterns, like ____ .',
    ],
    difficulty: 2,
  },
  {
    id: 'v-tai',
    category: 'verb_forms',
    title: 'How do you express wanting?',
    examples: [
      { japanese: '\u98DF\u3079\u305F\u3044\u3067\u3059\u3002', english: 'I want to eat.', highlight: '\u305F\u3044' },
      { japanese: '\u884C\u304D\u305F\u3044\u3067\u3059\u3002', english: 'I want to go.', highlight: '\u305F\u3044' },
      { japanese: '\u898B\u305F\u3044\u3067\u3059\u3002', english: 'I want to see.', highlight: '\u305F\u3044' },
      { japanese: '\u8CB7\u3044\u305F\u3044\u3067\u3059\u3002', english: 'I want to buy.', highlight: '\u305F\u3044' },
    ],
    question: 'To express "want to [verb]," you add:',
    acceptableAnswers: [
      '\u305F\u3044',
      'tai',
      '-tai',
      '\u305F\u3044 (tai)',
      'tai desu',
    ],
    insight: {
      correct:
        'Exactly! Verb stem + \u305F\u3044 = "want to [verb]." Simple and powerful.',
      explanation:
        'Take the \u307E\u3059 form, drop \u307E\u3059, add \u305F\u3044: \u98DF\u3079\u307E\u3059 \u2192 \u98DF\u3079 \u2192 \u98DF\u3079\u305F\u3044. Note: \u305F\u3044 is only used for YOUR desires, not others\'.',
      mnemonic:
        '\u300C\u305F\u3044\u300D sounds like "tie" \u2014 you\'re tied to your desire, you want it!',
      systemConnection:
        '\u305F\u3044 behaves like an i-adjective: \u98DF\u3079\u305F\u304F\u306A\u3044 (don\'t want to eat), \u98DF\u3079\u305F\u304B\u3063\u305F (wanted to eat).',
    },
    hints: [
      'All these sentences express a desire. What ending do they share?',
      'Remove \u3067\u3059 \u2014 what\'s left at the end of each verb?',
      'It\'s a two-character ending that sounds like "tie."',
    ],
    difficulty: 1,
  },
  {
    id: 'v-teiru',
    category: 'verb_forms',
    title: 'What does \u300C\u3066\u3044\u308B\u300D express?',
    examples: [
      { japanese: '\u98DF\u3079\u3066\u3044\u307E\u3059\u3002', english: 'I am eating.', highlight: '\u3066\u3044' },
      { japanese: '\u8AAD\u3093\u3067\u3044\u307E\u3059\u3002', english: 'I am reading.', highlight: '\u3067\u3044' },
      { japanese: '\u96E8\u304C\u964D\u3063\u3066\u3044\u307E\u3059\u3002', english: 'It is raining.', highlight: '\u3066\u3044' },
      { japanese: '\u6771\u4EAC\u306B\u4F4F\u3093\u3067\u3044\u307E\u3059\u3002', english: 'I am living in Tokyo.', highlight: '\u3067\u3044' },
    ],
    question: '\u300C\u3066\u3044\u308B\u300D expresses an action that is:',
    acceptableAnswers: [
      'ongoing',
      'happening now',
      'in progress',
      'continuing',
      'continuous',
      'currently happening',
      'present progressive',
      'happening right now',
    ],
    insight: {
      correct:
        'Yes! \u300C\u3066\u3044\u308B\u300D (or \u3066\u3044\u307E\u3059 politely) shows an ongoing or continuous action \u2014 like English "-ing."',
      explanation:
        '\u3066-form + \u3044\u308B = "is doing." It also expresses states that result from a completed action: \u7D50\u5A5A\u3057\u3066\u3044\u308B = "is married" (result of getting married).',
      mnemonic:
        '\u3066\u3044\u308B = \u3066 (connector) + \u3044\u308B (to exist). The action EXISTS in the present moment.',
      systemConnection:
        'This is the first compound pattern you\'ve seen using \u3066: the \u3066-form really is the Velcro of Japanese grammar.',
    },
    hints: [
      'Compare "I eat" (\u98DF\u3079\u307E\u3059) with "I am eating" (\u98DF\u3079\u3066\u3044\u307E\u3059).',
      'The \u3066\u3044 part adds a sense of something happening right now.',
      'It\'s the Japanese equivalent of the English "-___" form.',
    ],
    difficulty: 2,
  },

  // ---- Sentence Structure ----
  {
    id: 's-sov',
    category: 'sentence_structure',
    title: 'Where does the verb always go?',
    examples: [
      { japanese: '\u79C1\u306F \u308A\u3093\u3054\u3092 \u98DF\u3079\u307E\u3059\u3002', english: 'I eat an apple.', highlight: '\u98DF\u3079\u307E\u3059' },
      { japanese: '\u7530\u4E2D\u3055\u3093\u306F \u672C\u3092 \u8AAD\u307F\u307E\u3059\u3002', english: 'Tanaka reads a book.', highlight: '\u8AAD\u307F\u307E\u3059' },
      { japanese: '\u5B66\u751F\u306F \u65E5\u672C\u8A9E\u3092 \u52C9\u5F37\u3057\u307E\u3059\u3002', english: 'The student studies Japanese.', highlight: '\u52C9\u5F37\u3057\u307E\u3059' },
      { japanese: '\u732B\u306F \u9B5A\u3092 \u98DF\u3079\u307E\u3059\u3002', english: 'The cat eats fish.', highlight: '\u98DF\u3079\u307E\u3059' },
    ],
    question: 'In Japanese, the verb always goes at the:',
    acceptableAnswers: [
      'end',
      'the end',
      'end of the sentence',
      'last',
      'final position',
      'last position',
    ],
    insight: {
      correct:
        'Yes! Japanese is a "verb-final" language. The verb ALWAYS comes at the end of the sentence.',
      explanation:
        'English: Subject-Verb-Object (I eat apples). Japanese: Subject-Object-Verb (I apples eat). This SOV order is actually the most common word order in the world\'s languages!',
      mnemonic:
        'In Japanese, the verb is the period \u2014 it seals the sentence at the very end.',
      systemConnection:
        'Because the verb is always last, particles like \u306F, \u304C, \u3092, \u306B, \u3067 mark each word\'s role. Word order between them is flexible!',
    },
    hints: [
      'Look at where each action word (\u98DF\u3079\u307E\u3059, \u8AAD\u307F\u307E\u3059, etc.) appears in the sentence.',
      'Is it at the beginning, middle, or end?',
      'The verb is always in the ____ position.',
    ],
    difficulty: 1,
  },
  {
    id: 's-desu',
    category: 'sentence_structure',
    title: 'What does \u300C\u3067\u3059\u300D do?',
    examples: [
      { japanese: '\u5B66\u751F\u3067\u3059\u3002', english: 'I am a student.', highlight: '\u3067\u3059' },
      { japanese: '\u5148\u751F\u3067\u3059\u3002', english: 'He/She is a teacher.', highlight: '\u3067\u3059' },
      { japanese: '\u304D\u308C\u3044\u3067\u3059\u3002', english: 'It is beautiful.', highlight: '\u3067\u3059' },
      { japanese: '\u65E5\u66DC\u65E5\u3067\u3059\u3002', english: 'It is Sunday.', highlight: '\u3067\u3059' },
    ],
    question: '\u300C\u3067\u3059\u300D works like the English word:',
    acceptableAnswers: [
      'is',
      'am',
      'are',
      'to be',
      'is/am/are',
      'equals',
      'be',
      'is are am',
    ],
    insight: {
      correct:
        'Right! \u300C\u3067\u3059\u300D is the polite copula \u2014 it functions like "is/am/are" in English.',
      explanation:
        'It links a subject to a description or identity: [X] \u3067\u3059 = "[X] is..." It also adds politeness to adjective sentences.',
      mnemonic:
        '\u300C\u3067\u3059\u300D sounds like "des" \u2014 think "DESscribe what something IS."',
      systemConnection:
        'The casual form of \u3067\u3059 is \u3060. Past: \u3067\u3057\u305F. Negative: \u3058\u3083\u306A\u3044\u3067\u3059 or \u3058\u3083\u3042\u308A\u307E\u305B\u3093.',
    },
    hints: [
      'Remove \u3067\u3059 from each sentence. What meaning disappears?',
      'It connects the subject to what it IS.',
      'It plays the same role as "is," "am," or "are" in English.',
    ],
    difficulty: 1,
  },
  {
    id: 's-adj',
    category: 'sentence_structure',
    title: 'Where do adjectives go?',
    examples: [
      { japanese: '\u5927\u304D\u3044 \u732B', english: 'big cat', highlight: '\u5927\u304D\u3044' },
      { japanese: '\u304D\u308C\u3044\u306A \u82B1', english: 'beautiful flower', highlight: '\u304D\u308C\u3044\u306A' },
      { japanese: '\u65B0\u3057\u3044 \u672C', english: 'new book', highlight: '\u65B0\u3057\u3044' },
      { japanese: '\u9759\u304B\u306A \u90E8\u5C4B', english: 'quiet room', highlight: '\u9759\u304B\u306A' },
    ],
    question: 'In Japanese, adjectives go ____ the noun:',
    acceptableAnswers: [
      'before',
      'in front of',
      'before the noun',
      'preceding',
      'ahead of',
    ],
    insight: {
      correct:
        'Yes! Just like English, Japanese adjectives come BEFORE the noun they modify.',
      explanation:
        'Notice two types: \u3044-adjectives (\u5927\u304D\u3044, \u65B0\u3057\u3044) and \u306A-adjectives (\u304D\u308C\u3044\u306A, \u9759\u304B\u306A). The \u306A-adjectives need \u306A to connect to the noun.',
      mnemonic:
        'Adjectives are "scouts" \u2014 they run ahead of the noun to describe what\'s coming.',
      systemConnection:
        'The \u3044/\u306A distinction matters for conjugation too: \u5927\u304D\u304F\u306A\u3044 (not big) vs. \u9759\u304B\u3058\u3083\u306A\u3044 (not quiet).',
    },
    hints: [
      'Where is \u5927\u304D\u3044 relative to \u732B? Where is \u304D\u308C\u3044\u306A relative to \u82B1?',
      'The descriptive word comes ____ the thing it describes.',
      'Same position as in English: "big cat" not "cat big."',
    ],
    difficulty: 1,
  },
  {
    id: 's-no',
    category: 'sentence_structure',
    title: 'How does \u300C\u306E\u300D connect nouns?',
    examples: [
      { japanese: '\u79C1 \u306E \u672C', english: 'my book', highlight: '\u306E' },
      { japanese: '\u65E5\u672C \u306E \u98DF\u3079\u7269', english: 'Japanese food', highlight: '\u306E' },
      { japanese: '\u5927\u5B66 \u306E \u5148\u751F', english: 'university teacher/professor', highlight: '\u306E' },
      { japanese: '\u6728 \u306E \u673A', english: 'wooden desk (desk of wood)', highlight: '\u306E' },
    ],
    question: '\u300C\u306E\u300D connects two nouns and shows:',
    acceptableAnswers: [
      'possession',
      'belonging',
      'ownership',
      'connection',
      'relationship',
      'association',
      'of',
      'a relationship between them',
      'that one belongs to the other',
    ],
    insight: {
      correct:
        'Yes! \u300C\u306E\u300D shows a relationship between two nouns \u2014 possession, origin, material, or any "of" connection.',
      explanation:
        'Think of \u306E as the reverse of English "of": "book of me" \u2192 \u79C1\u306E\u672C. The modifier always comes first: [modifier] \u306E [main noun].',
      mnemonic:
        '\u306E is a bridge between two nouns. The first noun tells us something ABOUT the second.',
      systemConnection:
        '\u306E is the noun-connector just as \u3066 is the verb-connector. Both link things to create more complex expressions.',
    },
    hints: [
      '\u79C1\u306E\u672C = "my book." What does \u306E do between \u79C1 and \u672C?',
      'It creates an "of" relationship: book OF me, food OF Japan.',
      'It shows ____ or connection between two nouns.',
    ],
    difficulty: 1,
  },

  // ---- Kanji Patterns ----
  {
    id: 'k-water',
    category: 'kanji_patterns',
    title: 'What do these kanji have in common?',
    examples: [
      { japanese: '\u6D77', english: 'sea / ocean', highlight: '\u6C35' },
      { japanese: '\u6CB3', english: 'river', highlight: '\u6C35' },
      { japanese: '\u6E56', english: 'lake', highlight: '\u6C35' },
      { japanese: '\u6D17', english: 'to wash', highlight: '\u6C35' },
    ],
    question: 'They all share the \u6C35 radical on the left, which relates to:',
    acceptableAnswers: [
      'water',
      'liquid',
      'water/liquid',
      'wet',
      'fluids',
    ],
    insight: {
      correct:
        'Exactly! The \u6C35 (sanzui) radical means WATER. Any kanji with this radical likely relates to water or liquids.',
      explanation:
        '\u6D77 (sea), \u6CB3 (river), \u6E56 (lake), \u6D17 (wash) \u2014 all connected to water. Other examples: \u6CF3 (swim), \u6D6E (float), \u6CE2 (wave).',
      mnemonic:
        'The three strokes of \u6C35 look like splashing water droplets.',
      systemConnection:
        'Radicals are the building blocks of kanji. Learning them is like learning the periodic table for chemistry \u2014 they reveal the system behind thousands of characters.',
    },
    hints: [
      'Sea, river, lake, wash \u2014 what element connects all of these?',
      'Look at the left side of each kanji. They share the same three-stroke radical.',
      'It\'s something you find in seas, rivers, and lakes. You use it to wash things.',
    ],
    difficulty: 1,
  },
  {
    id: 'k-person',
    category: 'kanji_patterns',
    title: 'What does the \u4EBB radical tell you?',
    examples: [
      { japanese: '\u4F11', english: 'rest / take a break', highlight: '\u4EBB' },
      { japanese: '\u4F53', english: 'body', highlight: '\u4EBB' },
      { japanese: '\u4F5C', english: 'to make / create', highlight: '\u4EBB' },
      { japanese: '\u4F4F', english: 'to live / reside', highlight: '\u4EBB' },
    ],
    question: 'The \u4EBB radical on the left relates to:',
    acceptableAnswers: [
      'people',
      'person',
      'human',
      'a person',
      'humans',
      'people/person',
    ],
    insight: {
      correct:
        'Yes! \u4EBB (ninben) is the "person" radical. Kanji with \u4EBB relate to people or human actions.',
      explanation:
        '\u4F11 = a person (\u4EBB) leaning against a tree (\u6728) = rest! \u4F53 = person + base = body. These visual stories make kanji memorable.',
      mnemonic:
        '\u4EBB looks like a person walking \u2014 one leg forward, one back.',
      systemConnection:
        'Like the water radical, the person radical helps you decode unfamiliar kanji. If you see \u4EBB, you know it involves people somehow.',
    },
    hints: [
      'Rest, body, make, live \u2014 what does a human do?',
      'The radical on the left looks like a person walking.',
      'All these actions and concepts relate to a ____ .',
    ],
    difficulty: 1,
  },
  {
    id: 'k-phonetic',
    category: 'kanji_patterns',
    title: 'These kanji share a component and a sound!',
    examples: [
      { japanese: '\u6E05 (\u30BB\u30A4)', english: 'pure / clean', highlight: '\u9752' },
      { japanese: '\u6674 (\u30BB\u30A4)', english: 'clear weather', highlight: '\u9752' },
      { japanese: '\u7CBE (\u30BB\u30A4)', english: 'spirit / essence', highlight: '\u9752' },
      { japanese: '\u9759 (\u30BB\u30A4)', english: 'quiet / still', highlight: '\u9752' },
    ],
    question: 'The shared component \u9752 gives these kanji the same:',
    acceptableAnswers: [
      'reading',
      'sound',
      'pronunciation',
      'on reading',
      'onyomi',
      'on\'yomi',
      'sei',
    ],
    insight: {
      correct:
        'Right! \u9752 is a PHONETIC component \u2014 it gives all these kanji the reading \u30BB\u30A4 (sei). The other part tells you the meaning.',
      explanation:
        '\u6C35+\u9752 = \u6E05 (water + sei = purity). \u65E5+\u9752 = \u6674 (sun + sei = clear sky). The radical gives meaning, the phonetic component gives sound.',
      mnemonic:
        'Kanji = meaning radical + sound component. Like a code: one half tells you WHAT, the other tells you HOW to say it.',
      systemConnection:
        'About 80% of kanji work this way! Learning phonetic components lets you guess the reading of new kanji \u2014 a massive shortcut.',
    },
    hints: [
      'Look at the readings in parentheses. What do they all share?',
      'Each kanji contains \u9752 and is read as \u30BB\u30A4.',
      '\u9752 isn\'t giving meaning here \u2014 it\'s giving them the same ____ .',
    ],
    difficulty: 2,
  },
  {
    id: 'k-compound',
    category: 'kanji_patterns',
    title: 'How do kanji meanings combine?',
    examples: [
      { japanese: '\u706B\u5C71', english: 'volcano (fire + mountain)', highlight: '\u706B+\u5C71' },
      { japanese: '\u5165\u53E3', english: 'entrance (enter + mouth/opening)', highlight: '\u5165+\u53E3' },
      { japanese: '\u6BCE\u65E5', english: 'every day (every + day)', highlight: '\u6BCE+\u65E5' },
      { japanese: '\u96FB\u8ECA', english: 'train (electricity + car)', highlight: '\u96FB+\u8ECA' },
    ],
    question: 'Compound words combine kanji to create meaning through:',
    acceptableAnswers: [
      'adding meanings',
      'combining meanings',
      'logic',
      'combining their meanings together',
      'logical combination',
      'putting meanings together',
      'addition',
      'combination',
    ],
    insight: {
      correct:
        'Yes! Kanji compounds build meaning logically: fire + mountain = volcano, electricity + car = train.',
      explanation:
        'This is one of the most satisfying patterns in Japanese. Once you know individual kanji, you can often GUESS what compounds mean. \u56F3\u66F8\u9928 = \u56F3(picture) + \u66F8(write/book) + \u9928(building) = library!',
      mnemonic:
        'Kanji compounds are like LEGO \u2014 snap individual meaning blocks together to build new words.',
      systemConnection:
        'This is why learning individual kanji meanings is so powerful. 2,000 kanji can generate tens of thousands of compound words through logical combination.',
    },
    hints: [
      'Fire + mountain = ? Electricity + car = ?',
      'Each compound word\'s meaning is built from its parts.',
      'The meanings are logically ____ to create new words.',
    ],
    difficulty: 1,
  },

  // ---- Readings ----
  {
    id: 'r-onyomi',
    category: 'readings',
    title: 'When do kanji use on\'yomi (Chinese readings)?',
    examples: [
      { japanese: '\u5B66\u751F (\u30AC\u30AF\u30BB\u30A4)', english: 'student', highlight: '\u5B66+\u751F' },
      { japanese: '\u5148\u751F (\u30BB\u30F3\u30BB\u30A4)', english: 'teacher', highlight: '\u5148+\u751F' },
      { japanese: '\u96FB\u8A71 (\u30C7\u30F3\u30EF)', english: 'telephone', highlight: '\u96FB+\u8A71' },
      { japanese: '\u56F3\u66F8\u9928 (\u30C8\u30B7\u30E7\u30AB\u30F3)', english: 'library', highlight: '\u56F3+\u66F8+\u9928' },
    ],
    question: 'On\'yomi readings are used when kanji appear:',
    acceptableAnswers: [
      'together',
      'in compounds',
      'combined',
      'in pairs',
      'with other kanji',
      'next to other kanji',
      'in multi-kanji words',
      'as compounds',
    ],
    insight: {
      correct:
        'Exactly! When multiple kanji appear together in a compound word, they almost always use on\'yomi (the Chinese-derived reading).',
      explanation:
        '\u5B66 alone can be \u307E\u306A\u3076 (kun\'yomi), but in \u5B66\u751F it becomes \u30AC\u30AF (on\'yomi). This pattern holds for roughly 70% of compound words.',
      mnemonic:
        'On\'yomi is the "team reading" \u2014 kanji use it when they work TOGETHER in a compound.',
      systemConnection:
        'This connects to the compound meaning pattern you discovered: not only do the meanings combine, but the readings shift to on\'yomi when kanji team up.',
    },
    hints: [
      'Are these single kanji or multi-kanji words?',
      'Each word is made of 2-3 kanji stuck together.',
      'When kanji combine into compound words, they use the ______ reading.',
    ],
    difficulty: 2,
  },
  {
    id: 'r-kunyomi',
    category: 'readings',
    title: 'When do kanji use kun\'yomi (Japanese readings)?',
    examples: [
      { japanese: '\u5C71 (\u3084\u307E)', english: 'mountain', highlight: '\u5C71' },
      { japanese: '\u82B1 (\u306F\u306A)', english: 'flower', highlight: '\u82B1' },
      { japanese: '\u98DF\u3079\u308B (\u305F\u3079\u308B)', english: 'to eat', highlight: '\u98DF' },
      { japanese: '\u5927\u304D\u3044 (\u304A\u304A\u304D\u3044)', english: 'big', highlight: '\u5927' },
    ],
    question: 'Kun\'yomi readings are used when a kanji appears:',
    acceptableAnswers: [
      'alone',
      'by itself',
      'on its own',
      'standalone',
      'with hiragana',
      'independently',
      'as a single kanji',
      'alone or with hiragana',
    ],
    insight: {
      correct:
        'Yes! When a kanji stands alone (often with a hiragana ending), it uses kun\'yomi \u2014 the native Japanese reading.',
      explanation:
        '\u5C71 alone = \u3084\u307E (kun\'yomi). In a compound like \u706B\u5C71 = \u30AB\u30B6\u30F3 (on\'yomi). The hiragana endings (\u308B in \u98DF\u3079\u308B, \u3044 in \u5927\u304D\u3044) are a strong clue it\'s kun\'yomi.',
      mnemonic:
        'Kun\'yomi is the "solo reading" \u2014 kanji use it when performing alone.',
      systemConnection:
        'Together with the on\'yomi pattern, you now have a powerful rule of thumb: compounds = on\'yomi, standalone = kun\'yomi. This covers most cases!',
    },
    hints: [
      'How many kanji are in each word? Are they combined with other kanji?',
      'Each kanji here is either alone or followed by hiragana, not another kanji.',
      'When a kanji stands ____ (not in a compound), it uses the native Japanese reading.',
    ],
    difficulty: 2,
  },

  // ---- Counters ----
  {
    id: 'c-general',
    category: 'counters',
    title: 'What do Japanese numbers need?',
    examples: [
      { japanese: '\u732B\u304C \u4E09\u5339 \u3044\u307E\u3059\u3002', english: 'There are 3 cats.', highlight: '\u5339' },
      { japanese: '\u672C\u3092 \u4E8C\u518A \u8CB7\u3044\u307E\u3057\u305F\u3002', english: 'I bought 2 books.', highlight: '\u518A' },
      { japanese: '\u6C34\u3092 \u4E00\u676F \u304F\u3060\u3055\u3044\u3002', english: 'One glass of water, please.', highlight: '\u676F' },
      { japanese: '\u4EBA\u304C \u4E94\u4EBA \u3044\u307E\u3059\u3002', english: 'There are 5 people.', highlight: '\u4EBA' },
    ],
    question: 'After the number, Japanese adds a special word called a:',
    acceptableAnswers: [
      'counter',
      'counter word',
      'counting word',
      'classifier',
      'measure word',
      'counter suffix',
    ],
    insight: {
      correct:
        'Right! Japanese uses COUNTER WORDS \u2014 special suffixes after numbers that categorize what\'s being counted.',
      explanation:
        '\u5339 for small animals, \u518A for books/bound things, \u676F for cups/glasses, \u4EBA for people. Different categories of things get different counters.',
      mnemonic:
        'Counters are like English "pieces of paper" or "glasses of water" \u2014 but Japanese uses them for EVERYTHING.',
      systemConnection:
        'Counter words connect to kanji meanings: \u518A contains the concept of "book/volume," \u4EBA means "person." The counter often contains a clue about what it counts.',
    },
    hints: [
      'Look at the character right after the number in each sentence.',
      'It changes depending on WHAT is being counted: cats, books, cups, people.',
      'Each type of thing has its own counting word, called a ____.',
    ],
    difficulty: 2,
  },
]

// ---------------------------------------------------------------------------
// Local storage helpers
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'patternlab-progress'

function loadProgress(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {}
  } catch {
    return {}
  }
}

function saveProgress(progress: Record<string, boolean>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
}

// ---------------------------------------------------------------------------
// Answer-checking
// ---------------------------------------------------------------------------

function checkAnswer(userInput: string, acceptable: string[]): boolean {
  const cleaned = userInput.trim().toLowerCase()
  if (!cleaned) return false
  for (const answer of acceptable) {
    const a = answer.trim().toLowerCase()
    if (cleaned === a) return true
    if (cleaned.includes(a) || a.includes(cleaned)) return true
  }
  return false
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ExampleSentence({
  example,
}: {
  example: PatternExample
}) {
  const parts = example.japanese.split(example.highlight)

  return (
    <div className="py-3 px-4 rounded-lg bg-ash-stone/40 border border-ash-stone/30">
      <div className="text-xl text-parchment font-serif tracking-wide">
        {parts.map((part, i) => (
          <span key={i}>
            <span>{part}</span>
            {i < parts.length - 1 && (
              <span className="text-icon-gold font-bold mx-0.5">
                {example.highlight}
              </span>
            )}
          </span>
        ))}
      </div>
      <div className="text-sm text-warm-gray mt-1.5">{example.english}</div>
    </div>
  )
}

function ProgressBar({
  current,
  total,
  label,
}: {
  current: number
  total: number
  label: string
}) {
  const pct = total > 0 ? (current / total) * 100 : 0

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-parchment">{label}</span>
        <span className="text-warm-gray">
          {current}/{total} discovered
        </span>
      </div>
      <div className="h-2 bg-ash-stone/60 rounded-full overflow-hidden">
        <div
          className="h-full bg-icon-gold/80 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function InsightPanel({
  insight,
  onNext,
  isLast,
}: {
  insight: PatternInsight
  onNext: () => void
  isLast: boolean
}) {
  return (
    <Card className="border-patina-teal/40 bg-patina-teal/5 animate-page-in">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-patina-teal flex items-center gap-2">
          <span className="text-xl">{'\u2713'}</span> {insight.correct}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-parchment/90 leading-relaxed">
          {insight.explanation}
        </p>

        {insight.mnemonic && (
          <div className="pl-4 border-l-2 border-icon-gold/40">
            <p className="text-sm text-warm-gray italic">
              <span className="text-icon-gold font-medium not-italic">
                Memory aid:{' '}
              </span>
              {insight.mnemonic}
            </p>
          </div>
        )}

        {insight.systemConnection && (
          <div className="pl-4 border-l-2 border-deep-azure/40">
            <p className="text-sm text-warm-gray italic">
              <span className="text-deep-azure font-medium not-italic">
                System connection:{' '}
              </span>
              {insight.systemConnection}
            </p>
          </div>
        )}

        <div className="pt-2">
          <Button
            variant="gold"
            onClick={onNext}
            className="gap-2"
          >
            {isLast ? 'Back to Categories' : 'Next Pattern \u2192'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function PatternLab() {
  const [discoveredMap, setDiscoveredMap] = useState<Record<string, boolean>>(
    loadProgress,
  )
  const [activeCategory, setActiveCategory] = useState<PatternCategory | null>(
    null,
  )
  const [activeChallengeIndex, setActiveChallengeIndex] = useState(0)
  const [userAnswer, setUserAnswer] = useState('')
  const [answerState, setAnswerState] = useState<
    'idle' | 'correct' | 'incorrect'
  >('idle')
  const [hintsUsed, setHintsUsed] = useState(0)
  const [showReveal, setShowReveal] = useState(false)
  const [hintTimerFired, setHintTimerFired] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Challenges for the selected category, sorted by difficulty
  const categoryChallenges = activeCategory
    ? PATTERN_CHALLENGES.filter((c) => c.category === activeCategory).sort(
        (a, b) => a.difficulty - b.difficulty,
      )
    : []

  const currentChallenge: PatternChallenge | undefined =
    categoryChallenges[activeChallengeIndex]

  // Category progress
  const categoryProgress = (cat: PatternCategory) => {
    const all = PATTERN_CHALLENGES.filter((c) => c.category === cat)
    const done = all.filter((c) => discoveredMap[c.id])
    return { done: done.length, total: all.length }
  }

  // Persist progress
  const markDiscovered = useCallback(
    (id: string) => {
      setDiscoveredMap((prev) => {
        const next = { ...prev, [id]: true }
        saveProgress(next)
        return next
      })
    },
    [],
  )

  // Reset per-challenge state
  const resetChallengeState = useCallback(() => {
    setUserAnswer('')
    setAnswerState('idle')
    setHintsUsed(0)
    setShowReveal(false)
    setHintTimerFired(false)
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current)
  }, [])

  // Start hint timer when a new challenge is shown
  useEffect(() => {
    if (!currentChallenge || answerState === 'correct') return

    if (hintTimerRef.current) clearTimeout(hintTimerRef.current)
    hintTimerRef.current = setTimeout(() => {
      setHintTimerFired(true)
    }, 30_000)

    return () => {
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current)
    }
  }, [currentChallenge?.id, answerState])

  // Focus input when challenge changes
  useEffect(() => {
    if (currentChallenge && answerState === 'idle') {
      inputRef.current?.focus()
    }
  }, [currentChallenge?.id, answerState])

  // Handlers
  const handleCheckAnswer = () => {
    if (!currentChallenge) return
    if (checkAnswer(userAnswer, currentChallenge.acceptableAnswers)) {
      setAnswerState('correct')
      markDiscovered(currentChallenge.id)
    } else {
      setAnswerState('incorrect')
      // auto-show a hint on wrong answer
      if (hintsUsed < currentChallenge.hints.length) {
        setHintsUsed((h) => h + 1)
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && answerState !== 'correct') {
      handleCheckAnswer()
    }
  }

  const handleNextPattern = () => {
    if (activeChallengeIndex < categoryChallenges.length - 1) {
      setActiveChallengeIndex((i) => i + 1)
      resetChallengeState()
    } else {
      // Finished all in category
      setActiveCategory(null)
      setActiveChallengeIndex(0)
      resetChallengeState()
    }
  }

  const handleReveal = () => {
    if (!currentChallenge) return
    setShowReveal(true)
    setAnswerState('correct')
    markDiscovered(currentChallenge.id)
  }

  const handleRequestHint = () => {
    if (!currentChallenge) return
    if (hintsUsed < currentChallenge.hints.length) {
      setHintsUsed((h) => h + 1)
    }
  }

  const handleSelectCategory = (cat: PatternCategory) => {
    setActiveCategory(cat)
    setActiveChallengeIndex(0)
    resetChallengeState()
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const allCategories = Object.keys(CATEGORY_META) as PatternCategory[]

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-page-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-serif font-semibold text-parchment">
          Pattern Lab
        </h2>
        <p className="text-warm-gray text-sm mt-1">
          Observe. Discover. Understand.
        </p>
      </div>

      {/* Category selector */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-warm-gray">
            Pattern Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {allCategories.map((cat) => {
              const { done, total } = categoryProgress(cat)
              const meta = CATEGORY_META[cat]
              const isActive = activeCategory === cat
              const isComplete = done === total

              return (
                <button
                  key={cat}
                  onClick={() => handleSelectCategory(cat)}
                  className={cn(
                    'px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 border',
                    'flex items-center gap-2',
                    isActive
                      ? 'bg-icon-gold/15 border-icon-gold/50 text-icon-gold'
                      : isComplete
                        ? 'bg-patina-teal/10 border-patina-teal/30 text-patina-teal'
                        : 'bg-ash-stone/30 border-ash-stone/40 text-warm-gray hover:border-parchment/30 hover:text-parchment',
                  )}
                >
                  <span>{meta.icon}</span>
                  <span>{meta.label}</span>
                  {done > 0 && (
                    <Badge
                      variant={isComplete ? 'solid' : 'processing'}
                      className="ml-1 text-[10px] px-1.5 py-0"
                    >
                      {done}/{total}
                    </Badge>
                  )}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Active challenge */}
      {currentChallenge && (
        <div className="space-y-4 animate-page-in" key={currentChallenge.id}>
          {/* Challenge card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="processing" className="text-[10px]">
                  {CATEGORY_META[currentChallenge.category].label}
                </Badge>
                <Badge variant="outline" className="text-[10px] text-warm-gray">
                  Difficulty {currentChallenge.difficulty}/5
                </Badge>
                {discoveredMap[currentChallenge.id] && (
                  <Badge variant="solid" className="text-[10px]">
                    Discovered
                  </Badge>
                )}
              </div>
              <CardTitle className="text-lg text-parchment">
                {currentChallenge.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Examples */}
              <div className="space-y-2">
                {currentChallenge.examples.map((ex, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-warm-gray/50 text-sm mt-1 w-5 text-right shrink-0">
                      {'\u2460\u2461\u2462\u2463\u2464\u2465'[i] ?? `${i + 1}`}
                    </span>
                    <div className="flex-1">
                      <ExampleSentence example={ex} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Question + answer input */}
              {answerState !== 'correct' && (
                <div className="pt-4 space-y-3">
                  <p className="text-parchment font-medium">
                    {currentChallenge.question}
                  </p>

                  <div className="flex gap-2">
                    <Input
                      ref={inputRef}
                      value={userAnswer}
                      onChange={(e) => {
                        setUserAnswer(e.target.value)
                        if (answerState === 'incorrect') setAnswerState('idle')
                      }}
                      onKeyDown={handleKeyDown}
                      placeholder="Type your observation..."
                      className={cn(
                        'flex-1 bg-ash-stone/30 border-ash-stone/50 text-parchment placeholder:text-warm-gray/50',
                        'focus-visible:ring-icon-gold/50',
                        answerState === 'incorrect' && 'border-oxide-red/40',
                      )}
                    />
                    <Button
                      variant="gold"
                      onClick={handleCheckAnswer}
                      disabled={!userAnswer.trim()}
                    >
                      Check My Answer
                    </Button>
                  </div>

                  {/* Incorrect feedback */}
                  {answerState === 'incorrect' && (
                    <p className="text-sm text-warm-gray animate-page-in">
                      Not quite — but you are thinking in the right direction.
                      Look at the hint below.
                    </p>
                  )}

                  {/* Hints */}
                  {(hintsUsed > 0 || hintTimerFired) && (
                    <div className="space-y-2 animate-page-in">
                      {currentChallenge.hints
                        .slice(0, hintsUsed)
                        .map((hint, i) => (
                          <div
                            key={i}
                            className="pl-4 border-l-2 border-icon-gold/30 text-sm text-warm-gray"
                          >
                            <span className="text-icon-gold font-medium">
                              Hint {i + 1}:{' '}
                            </span>
                            {hint}
                          </div>
                        ))}

                      {hintsUsed < currentChallenge.hints.length && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleRequestHint}
                          className="text-warm-gray hover:text-parchment"
                        >
                          Need another hint?
                        </Button>
                      )}

                      {hintsUsed >= currentChallenge.hints.length &&
                        !showReveal && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleReveal}
                            className="text-warm-gray hover:text-icon-gold"
                          >
                            Want to see the pattern?
                          </Button>
                        )}
                    </div>
                  )}

                  {/* Hint prompt if timer fired but no hints used yet */}
                  {hintTimerFired && hintsUsed === 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRequestHint}
                      className="text-warm-gray hover:text-parchment animate-page-in"
                    >
                      Need a hint?
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Insight panel (after correct) */}
          {answerState === 'correct' && (
            <InsightPanel
              insight={currentChallenge.insight}
              onNext={handleNextPattern}
              isLast={activeChallengeIndex >= categoryChallenges.length - 1}
            />
          )}
        </div>
      )}

      {/* Prompt when no category selected */}
      {!activeCategory && (
        <Card className="border-ash-stone/30 bg-ash-stone/10">
          <CardContent className="py-12 text-center">
            <p className="text-warm-gray text-lg">
              Select a category above to begin discovering patterns.
            </p>
            <p className="text-warm-gray/60 text-sm mt-2">
              Each challenge shows you examples and asks what pattern you
              observe. Rules you discover yourself stick 30-50% better than rules
              you are told.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Discovery progress */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-warm-gray">
            Discovery Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {allCategories.map((cat) => {
            const { done, total } = categoryProgress(cat)
            return (
              <ProgressBar
                key={cat}
                label={CATEGORY_META[cat].label}
                current={done}
                total={total}
              />
            )
          })}

          {/* Overall summary */}
          {(() => {
            const totalDiscovered = Object.values(discoveredMap).filter(Boolean).length
            const totalPatterns = PATTERN_CHALLENGES.length
            if (totalDiscovered === 0) return null
            return (
              <div className="pt-2 border-t border-ash-stone/30 mt-2">
                <p className="text-sm text-warm-gray">
                  Total:{' '}
                  <span className="text-icon-gold font-medium">
                    {totalDiscovered}
                  </span>{' '}
                  / {totalPatterns} patterns discovered
                </p>
              </div>
            )
          })()}
        </CardContent>
      </Card>
    </div>
  )
}
