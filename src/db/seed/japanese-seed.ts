import type { Database } from 'sql.js'
import { nanoid } from 'nanoid'

export function seedJapaneseData(database: Database): void {
  try {
    const now = new Date().toISOString()
    const dueDate = now // Cards due immediately for fresh start

    // ---- ID maps for cross-referencing ----
    const radicalIds: Record<string, string> = {}
    const kanjiIds: Record<string, string> = {}
    const vocabIds: Record<string, string> = {}
    const grammarIds: Record<string, string> = {}
    const sentenceIds: Record<string, string> = {}

    // ============================================================
    // RADICALS (15)
    // ============================================================

    const radicals = [
      { char: '人', meaning: 'person', stroke_count: 2, position_hint: 'hen (left)', mnemonic: 'A person walking - two legs spread apart' },
      { char: '口', meaning: 'mouth', stroke_count: 3, position_hint: 'various', mnemonic: 'An open mouth, a square opening' },
      { char: '日', meaning: 'sun', stroke_count: 4, position_hint: 'hen (left) or top', mnemonic: 'The sun with a line through it - a window to the sky' },
      { char: '月', meaning: 'moon', stroke_count: 4, position_hint: 'tsukuri (right)', mnemonic: 'A crescent moon with lines - the moon and its markings' },
      { char: '水', meaning: 'water', stroke_count: 4, position_hint: 'hen (left, as 氵)', mnemonic: 'Flowing water - a stream with splashing drops' },
      { char: '火', meaning: 'fire', stroke_count: 4, position_hint: 'ashi (bottom, as 灬)', mnemonic: 'A campfire - flames leaping up from a base' },
      { char: '木', meaning: 'tree', stroke_count: 4, position_hint: 'hen (left)', mnemonic: 'A tree with branches spreading out and roots below' },
      { char: '金', meaning: 'gold', stroke_count: 8, position_hint: 'hen (left, as 釒)', mnemonic: 'Gold nuggets buried under a roof - treasure stored away' },
      { char: '土', meaning: 'earth', stroke_count: 3, position_hint: 'hen (left)', mnemonic: 'A cross in the ground - a plant sprouting from the earth' },
      { char: '山', meaning: 'mountain', stroke_count: 3, position_hint: 'kanmuri (top)', mnemonic: 'Three mountain peaks rising up' },
      { char: '川', meaning: 'river', stroke_count: 3, position_hint: 'various', mnemonic: 'Three flowing lines - a river with currents' },
      { char: '田', meaning: 'rice field', stroke_count: 5, position_hint: 'various', mnemonic: 'A field divided into four plots for growing rice' },
      { char: '目', meaning: 'eye', stroke_count: 5, position_hint: 'hen (left)', mnemonic: 'An eye turned sideways with the pupil and lid' },
      { char: '手', meaning: 'hand', stroke_count: 4, position_hint: 'hen (left, as 扌)', mnemonic: 'A hand with fingers spread out' },
      { char: '心', meaning: 'heart', stroke_count: 4, position_hint: 'ashi (bottom) or hen (left, as 忄)', mnemonic: 'A heart with its chambers - the seat of emotions' },
    ]

    for (const r of radicals) {
      const id = nanoid()
      radicalIds[r.char] = id
      database.run(
        `INSERT INTO jp_radicals (id, character, meaning, stroke_count, position_hint, mnemonic, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, r.char, r.meaning, r.stroke_count, r.position_hint, r.mnemonic, now]
      )
    }

    // ============================================================
    // KANJI (25 N5)
    // ============================================================

    const kanjiData = [
      { char: '一', meanings: ['one'], on: ['イチ', 'イツ'], kun: ['ひと', 'ひと.つ'], strokes: 1, jlpt: 5, grade: 1, mnemonic_m: 'A single horizontal line - the simplest number', mnemonic_r: 'Ichi - sounds like "itchy" - one itch', radicals: [] as string[] },
      { char: '二', meanings: ['two'], on: ['ニ', 'ジ'], kun: ['ふた', 'ふた.つ'], strokes: 2, jlpt: 5, grade: 1, mnemonic_m: 'Two horizontal lines stacked', mnemonic_r: 'Ni - "knee" - you have two knees', radicals: [] as string[] },
      { char: '三', meanings: ['three'], on: ['サン', 'ゾウ'], kun: ['み', 'み.つ', 'みっ.つ'], strokes: 3, jlpt: 5, grade: 1, mnemonic_m: 'Three horizontal lines - heaven, earth, and man', mnemonic_r: 'San - like "sun" - three suns in a row', radicals: [] as string[] },
      { char: '大', meanings: ['big', 'large', 'great'], on: ['ダイ', 'タイ'], kun: ['おお', 'おお.きい', 'おお.いに'], strokes: 3, jlpt: 5, grade: 1, mnemonic_m: 'A person stretching arms wide to show something big', mnemonic_r: 'Dai - "die" - something so big you could die', radicals: ['人'] },
      { char: '小', meanings: ['small', 'little'], on: ['ショウ'], kun: ['ちい.さい', 'こ', 'お'], strokes: 3, jlpt: 5, grade: 1, mnemonic_m: 'Small drops falling off a line - tiny things', mnemonic_r: 'Shou - "show" - show me something small', radicals: [] as string[] },
      { char: '中', meanings: ['middle', 'inside', 'center'], on: ['チュウ'], kun: ['なか', 'うち', 'あた.る'], strokes: 4, jlpt: 5, grade: 1, mnemonic_m: 'A line through the center of a box - hitting the middle', mnemonic_r: 'Chuu - a line going "through" the middle', radicals: ['口'] },
      { char: '上', meanings: ['up', 'above', 'upper'], on: ['ジョウ', 'ショウ', 'シャン'], kun: ['うえ', 'うわ', 'かみ', 'あ.げる', 'のぼ.る'], strokes: 3, jlpt: 5, grade: 1, mnemonic_m: 'A dash above a base line - something on top', mnemonic_r: 'Jou - "Joe" climbs up the mountain', radicals: [] as string[] },
      { char: '下', meanings: ['down', 'below', 'under'], on: ['カ', 'ゲ'], kun: ['した', 'しも', 'もと', 'さ.げる', 'くだ.る'], strokes: 3, jlpt: 5, grade: 1, mnemonic_m: 'A dash below a base line - something underneath', mnemonic_r: 'Ka - "ka-plunk" falling down', radicals: [] as string[] },
      { char: '人', meanings: ['person', 'people'], on: ['ジン', 'ニン'], kun: ['ひと'], strokes: 2, jlpt: 5, grade: 1, mnemonic_m: 'A person walking with two legs', mnemonic_r: 'Jin/Nin - a person (jin-gle all the way)', radicals: ['人'] },
      { char: '子', meanings: ['child', 'offspring'], on: ['シ', 'ス', 'ツ'], kun: ['こ'], strokes: 3, jlpt: 5, grade: 1, mnemonic_m: 'A baby with its head and outstretched arms', mnemonic_r: 'Shi/ko - "she" has a child', radicals: [] as string[] },
      { char: '女', meanings: ['woman', 'female'], on: ['ジョ', 'ニョ', 'ニョウ'], kun: ['おんな', 'め'], strokes: 3, jlpt: 5, grade: 1, mnemonic_m: 'A woman kneeling gracefully', mnemonic_r: 'Jo - "Joe-sephine" is a woman\'s name', radicals: [] as string[] },
      { char: '男', meanings: ['man', 'male'], on: ['ダン', 'ナン'], kun: ['おとこ'], strokes: 7, jlpt: 5, grade: 1, mnemonic_m: 'Strength (力) in the rice field (田) - a man works the fields', mnemonic_r: 'Dan - "Dan" is a man\'s name', radicals: ['田'] },
      { char: '日', meanings: ['day', 'sun', 'Japan'], on: ['ニチ', 'ジツ'], kun: ['ひ', 'か'], strokes: 4, jlpt: 5, grade: 1, mnemonic_m: 'The sun as a window to the sky', mnemonic_r: 'Nichi - "knee-chi" - the sun hits your knees', radicals: ['日'] },
      { char: '月', meanings: ['month', 'moon'], on: ['ゲツ', 'ガツ'], kun: ['つき'], strokes: 4, jlpt: 5, grade: 1, mnemonic_m: 'A crescent moon with markings', mnemonic_r: 'Getsu/Gatsu - "get-some" moonlight', radicals: ['月'] },
      { char: '山', meanings: ['mountain'], on: ['サン', 'セン'], kun: ['やま'], strokes: 3, jlpt: 5, grade: 1, mnemonic_m: 'Three peaks of a mountain range', mnemonic_r: 'San/yama - Mount Fuji-san', radicals: ['山'] },
      { char: '川', meanings: ['river', 'stream'], on: ['セン'], kun: ['かわ'], strokes: 3, jlpt: 5, grade: 1, mnemonic_m: 'Three currents flowing in a river', mnemonic_r: 'Sen/kawa - "send" water down the river', radicals: ['川'] },
      { char: '学', meanings: ['study', 'learning', 'science'], on: ['ガク'], kun: ['まな.ぶ'], strokes: 8, jlpt: 5, grade: 1, mnemonic_m: 'A child (子) under a roof studying with effort', mnemonic_r: 'Gaku - "gawk" at the books while studying', radicals: ['子'] },
      { char: '校', meanings: ['school', 'school building'], on: ['コウ', 'キョウ'], kun: [], strokes: 10, jlpt: 5, grade: 1, mnemonic_m: 'A tree (木) with intersecting paths - a school campus', mnemonic_r: 'Kou - "co-" as in co-education at school', radicals: ['木'] },
      { char: '先', meanings: ['previous', 'ahead', 'before'], on: ['セン'], kun: ['さき', 'ま.ず'], strokes: 6, jlpt: 5, grade: 1, mnemonic_m: 'Legs walking ahead of others - being first', mnemonic_r: 'Sen - the "sen-ior" goes first', radicals: [] as string[] },
      { char: '生', meanings: ['life', 'birth', 'grow', 'raw'], on: ['セイ', 'ショウ'], kun: ['い.きる', 'う.まれる', 'なま', 'は.える'], strokes: 5, jlpt: 5, grade: 1, mnemonic_m: 'A plant sprouting from the ground - new life', mnemonic_r: 'Sei - "say" hello to new life', radicals: ['土'] },
      { char: '食', meanings: ['eat', 'food', 'meal'], on: ['ショク', 'ジキ'], kun: ['た.べる', 'く.う'], strokes: 9, jlpt: 5, grade: 2, mnemonic_m: 'A person sitting at a table with a lid on the dish', mnemonic_r: 'Shoku - "shock" at how much you eat', radicals: [] as string[] },
      { char: '飲', meanings: ['drink'], on: ['イン', 'オン'], kun: ['の.む'], strokes: 12, jlpt: 5, grade: 3, mnemonic_m: 'Food radical plus a person opening their mouth to drink', mnemonic_r: 'In - drink "in" the water', radicals: [] as string[] },
      { char: '見', meanings: ['see', 'look', 'show'], on: ['ケン'], kun: ['み.る', 'み.える', 'み.せる'], strokes: 7, jlpt: 5, grade: 1, mnemonic_m: 'An eye (目) on legs - walking around to see things', mnemonic_r: 'Ken - "ken" you see me?', radicals: ['目'] },
      { char: '書', meanings: ['write', 'book', 'document'], on: ['ショ'], kun: ['か.く'], strokes: 10, jlpt: 5, grade: 2, mnemonic_m: 'A hand holding a brush writing on a surface', mnemonic_r: 'Sho - "show" me your writing', radicals: ['日'] },
      { char: '読', meanings: ['read', 'recite'], on: ['ドク', 'トク', 'トウ'], kun: ['よ.む'], strokes: 14, jlpt: 5, grade: 2, mnemonic_m: 'Words (言) being sold (売) - reading at a bookstore', mnemonic_r: 'Doku - "doc" reads documents', radicals: [] as string[] },
    ]

    for (let i = 0; i < kanjiData.length; i++) {
      const k = kanjiData[i]
      const id = nanoid()
      kanjiIds[k.char] = id
      database.run(
        `INSERT INTO jp_kanji (id, character, meanings, on_readings, kun_readings, stroke_count, jlpt_level, grade, mnemonic_meaning, mnemonic_reading, sort_order, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, k.char, JSON.stringify(k.meanings), JSON.stringify(k.on), JSON.stringify(k.kun), k.strokes, k.jlpt, k.grade, k.mnemonic_m, k.mnemonic_r, i, now]
      )
    }

    // ---- Kanji-component relationships ----
    for (const k of kanjiData) {
      for (const radChar of k.radicals) {
        if (radicalIds[radChar] && kanjiIds[k.char]) {
          database.run(
            `INSERT INTO jp_kanji_components (kanji_id, component_id, component_type)
             VALUES (?, ?, 'radical')`,
            [kanjiIds[k.char], radicalIds[radChar]]
          )
        }
      }
    }

    // ============================================================
    // VOCABULARY (30 N5)
    // ============================================================

    const vocabData = [
      { word: '一つ', reading: 'ひとつ', meanings: ['one thing', 'one'], pos: 'noun', jlpt: 5, kanji: ['一'] },
      { word: '大きい', reading: 'おおきい', meanings: ['big', 'large'], pos: 'i-adjective', jlpt: 5, kanji: ['大'] },
      { word: '小さい', reading: 'ちいさい', meanings: ['small', 'little'], pos: 'i-adjective', jlpt: 5, kanji: ['小'] },
      { word: '学校', reading: 'がっこう', meanings: ['school'], pos: 'noun', jlpt: 5, kanji: ['学', '校'] },
      { word: '先生', reading: 'せんせい', meanings: ['teacher', 'master', 'doctor'], pos: 'noun', jlpt: 5, kanji: ['先', '生'] },
      { word: '学生', reading: 'がくせい', meanings: ['student'], pos: 'noun', jlpt: 5, kanji: ['学', '生'] },
      { word: '日本', reading: 'にほん', meanings: ['Japan'], pos: 'proper noun', jlpt: 5, kanji: ['日', '本'] },
      { word: '日本語', reading: 'にほんご', meanings: ['Japanese language'], pos: 'noun', jlpt: 5, kanji: ['日'] },
      { word: '食べる', reading: 'たべる', meanings: ['to eat'], pos: 'ichidan verb', jlpt: 5, conjugation: 'ichidan', kanji: ['食'] },
      { word: '飲む', reading: 'のむ', meanings: ['to drink'], pos: 'godan verb', jlpt: 5, conjugation: 'godan-mu', kanji: ['飲'] },
      { word: '見る', reading: 'みる', meanings: ['to see', 'to look', 'to watch'], pos: 'ichidan verb', jlpt: 5, conjugation: 'ichidan', kanji: ['見'] },
      { word: '読む', reading: 'よむ', meanings: ['to read'], pos: 'godan verb', jlpt: 5, conjugation: 'godan-mu', kanji: ['読'] },
      { word: '書く', reading: 'かく', meanings: ['to write'], pos: 'godan verb', jlpt: 5, conjugation: 'godan-ku', kanji: ['書'] },
      { word: '上', reading: 'うえ', meanings: ['above', 'on top of', 'upper'], pos: 'noun', jlpt: 5, kanji: ['上'] },
      { word: '下', reading: 'した', meanings: ['below', 'under', 'beneath'], pos: 'noun', jlpt: 5, kanji: ['下'] },
      { word: '中', reading: 'なか', meanings: ['inside', 'middle', 'among'], pos: 'noun', jlpt: 5, kanji: ['中'] },
      { word: '人', reading: 'ひと', meanings: ['person', 'someone'], pos: 'noun', jlpt: 5, kanji: ['人'] },
      { word: '女の人', reading: 'おんなのひと', meanings: ['woman'], pos: 'noun', jlpt: 5, kanji: ['女', '人'] },
      { word: '男の人', reading: 'おとこのひと', meanings: ['man'], pos: 'noun', jlpt: 5, kanji: ['男', '人'] },
      { word: '子供', reading: 'こども', meanings: ['child', 'children'], pos: 'noun', jlpt: 5, kanji: ['子'] },
      { word: '山', reading: 'やま', meanings: ['mountain', 'hill'], pos: 'noun', jlpt: 5, kanji: ['山'] },
      { word: '川', reading: 'かわ', meanings: ['river', 'stream'], pos: 'noun', jlpt: 5, kanji: ['川'] },
      { word: '大学', reading: 'だいがく', meanings: ['university', 'college'], pos: 'noun', jlpt: 5, kanji: ['大', '学'] },
      { word: '大人', reading: 'おとな', meanings: ['adult', 'grown-up'], pos: 'noun', jlpt: 5, kanji: ['大', '人'] },
      { word: '一人', reading: 'ひとり', meanings: ['one person', 'alone'], pos: 'noun', jlpt: 5, kanji: ['一', '人'] },
      { word: '二人', reading: 'ふたり', meanings: ['two people', 'pair'], pos: 'noun', jlpt: 5, kanji: ['二', '人'] },
      { word: '生まれる', reading: 'うまれる', meanings: ['to be born'], pos: 'ichidan verb', jlpt: 5, conjugation: 'ichidan', kanji: ['生'] },
      { word: '先月', reading: 'せんげつ', meanings: ['last month'], pos: 'noun', jlpt: 5, kanji: ['先', '月'] },
      { word: '毎日', reading: 'まいにち', meanings: ['every day'], pos: 'noun', jlpt: 5, kanji: ['日'] },
      { word: '今日', reading: 'きょう', meanings: ['today'], pos: 'noun', jlpt: 5, kanji: ['日'] },
    ]

    for (let i = 0; i < vocabData.length; i++) {
      const v = vocabData[i]
      const id = nanoid()
      vocabIds[v.word] = id
      database.run(
        `INSERT INTO jp_vocabulary (id, word, reading, meanings, part_of_speech, jlpt_level, conjugation_class, sort_order, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, v.word, v.reading, JSON.stringify(v.meanings), v.pos, v.jlpt, (v as Record<string, unknown>).conjugation as string ?? null, i, now]
      )
    }

    // ---- Vocab-kanji relationships ----
    for (const v of vocabData) {
      for (const kChar of v.kanji) {
        if (kanjiIds[kChar] && vocabIds[v.word]) {
          database.run(
            `INSERT INTO jp_vocab_kanji (vocab_id, kanji_id)
             VALUES (?, ?)`,
            [vocabIds[v.word], kanjiIds[kChar]]
          )
        }
      }
    }

    // ============================================================
    // GRAMMAR (10 N5)
    // ============================================================

    const grammarData = [
      {
        pattern: 'は', meaning: 'Topic marker particle', formation: 'Noun + は',
        jlpt: 5,
        examples: [
          { jp: '私は学生です。', en: 'I am a student.', notes: 'Marks "I" as the topic' },
          { jp: 'これは本です。', en: 'This is a book.', notes: 'Marks "this" as the topic' },
        ],
        notes: 'Pronounced "wa" when used as a particle. Marks the topic of the sentence - what the sentence is about.',
      },
      {
        pattern: 'が', meaning: 'Subject marker particle', formation: 'Noun + が',
        jlpt: 5,
        examples: [
          { jp: '猫がいます。', en: 'There is a cat.', notes: 'Marks "cat" as the subject' },
          { jp: '誰が来ましたか。', en: 'Who came?', notes: 'Used with question words' },
        ],
        notes: 'Marks the grammatical subject. Used for new information, emphasis, or with certain predicates.',
      },
      {
        pattern: 'を', meaning: 'Object marker particle', formation: 'Noun + を + Verb',
        jlpt: 5,
        examples: [
          { jp: '本を読みます。', en: 'I read a book.', notes: 'Marks "book" as the direct object' },
          { jp: 'ご飯を食べます。', en: 'I eat rice/a meal.', notes: 'Marks "rice" as the direct object' },
        ],
        notes: 'Pronounced "o" in modern Japanese. Marks the direct object of a transitive verb.',
      },
      {
        pattern: 'に', meaning: 'Direction, time, or target particle', formation: 'Noun + に',
        jlpt: 5,
        examples: [
          { jp: '学校に行きます。', en: 'I go to school.', notes: 'Direction/destination' },
          { jp: '七時に起きます。', en: 'I wake up at 7 o\'clock.', notes: 'Point in time' },
        ],
        notes: 'Indicates direction, time point, location of existence, indirect object, and purpose.',
      },
      {
        pattern: 'で', meaning: 'Location of action / means particle', formation: 'Noun + で',
        jlpt: 5,
        examples: [
          { jp: '学校で勉強します。', en: 'I study at school.', notes: 'Location of action' },
          { jp: 'バスで行きます。', en: 'I go by bus.', notes: 'Means of transportation' },
        ],
        notes: 'Indicates where an action takes place or the means/method used to perform an action.',
      },
      {
        pattern: 'です・ます', meaning: 'Polite form (copula and verb ending)', formation: 'Noun + です / Verb stem + ます',
        jlpt: 5,
        examples: [
          { jp: '学生です。', en: 'I am a student.', notes: 'Polite copula' },
          { jp: '食べます。', en: 'I eat / I will eat.', notes: 'Polite verb form' },
        ],
        notes: 'The basic polite speech style. です follows nouns and adjectives. ます attaches to verb stems.',
      },
      {
        pattern: 'ない', meaning: 'Negative form', formation: 'Verb negative stem + ない',
        jlpt: 5,
        examples: [
          { jp: '食べない。', en: 'I don\'t eat.', notes: 'Casual negative' },
          { jp: '行かない。', en: 'I don\'t go.', notes: 'Godan verb negative' },
        ],
        notes: 'Plain negative form. Godan verbs change final -u to -a before adding ない. Ichidan verbs drop -ru.',
      },
      {
        pattern: 'た', meaning: 'Past tense', formation: 'Verb て-form with て→た',
        jlpt: 5,
        examples: [
          { jp: '食べた。', en: 'I ate.', notes: 'Ichidan verb past' },
          { jp: '読んだ。', en: 'I read (past).', notes: 'Godan verb past (む→んだ)' },
        ],
        notes: 'Plain past tense. Formed by changing the て-form ending: て→た, で→だ.',
      },
      {
        pattern: 'ている', meaning: 'Progressive or resulting state', formation: 'Verb て-form + いる',
        jlpt: 5,
        examples: [
          { jp: '食べている。', en: 'I am eating.', notes: 'Ongoing action' },
          { jp: '知っている。', en: 'I know.', notes: 'Resulting state' },
        ],
        notes: 'Expresses either an ongoing action (progressive) or a resulting state, depending on the verb type.',
      },
      {
        pattern: 'たい', meaning: 'Want to (do)', formation: 'Verb stem + たい',
        jlpt: 5,
        examples: [
          { jp: '食べたい。', en: 'I want to eat.', notes: 'Desire to eat' },
          { jp: '日本に行きたい。', en: 'I want to go to Japan.', notes: 'Desire to go' },
        ],
        notes: 'Expresses the speaker\'s desire. Only used for first person in statements. Conjugates like an i-adjective.',
      },
    ]

    for (let i = 0; i < grammarData.length; i++) {
      const g = grammarData[i]
      const id = nanoid()
      grammarIds[g.pattern] = id
      database.run(
        `INSERT INTO jp_grammar (id, pattern, meaning, formation, jlpt_level, examples, notes, sort_order, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, g.pattern, g.meaning, g.formation, g.jlpt, JSON.stringify(g.examples), g.notes, i, now]
      )
    }

    // ============================================================
    // SENTENCES (15 N5)
    // ============================================================

    const sentenceData = [
      { jp: '私は学生です。', en: 'I am a student.', difficulty: 1, vocabLinks: ['学生'] },
      { jp: '毎日学校に行きます。', en: 'I go to school every day.', difficulty: 2, vocabLinks: ['毎日', '学校'] },
      { jp: '日本語を勉強しています。', en: 'I am studying Japanese.', difficulty: 2, vocabLinks: ['日本語'] },
      { jp: '先生は大学で教えます。', en: 'The teacher teaches at the university.', difficulty: 2, vocabLinks: ['先生', '大学'] },
      { jp: '山が大きいです。', en: 'The mountain is big.', difficulty: 1, vocabLinks: ['山', '大きい'] },
      { jp: '川の水を飲みます。', en: 'I drink river water.', difficulty: 2, vocabLinks: ['川', '飲む'] },
      { jp: '子供が本を読んでいます。', en: 'The child is reading a book.', difficulty: 2, vocabLinks: ['子供', '読む'] },
      { jp: '男の人が食べています。', en: 'The man is eating.', difficulty: 2, vocabLinks: ['男の人', '食べる'] },
      { jp: '女の人が書いています。', en: 'The woman is writing.', difficulty: 2, vocabLinks: ['女の人', '書く'] },
      { jp: '大人は見ています。', en: 'The adult is watching.', difficulty: 2, vocabLinks: ['大人', '見る'] },
      { jp: '一人で学校に行きます。', en: 'I go to school alone.', difficulty: 2, vocabLinks: ['一人', '学校'] },
      { jp: '二人の学生が来ました。', en: 'Two students came.', difficulty: 2, vocabLinks: ['二人', '学生'] },
      { jp: '先月日本に生まれました。', en: 'I was born in Japan last month.', difficulty: 3, vocabLinks: ['先月', '日本', '生まれる'] },
      { jp: '今日は小さい川を見ました。', en: 'Today I saw a small river.', difficulty: 2, vocabLinks: ['今日', '小さい', '川', '見る'] },
      { jp: '日本語を読みたいです。', en: 'I want to read Japanese.', difficulty: 2, vocabLinks: ['日本語', '読む'] },
    ]

    for (const s of sentenceData) {
      const id = nanoid()
      sentenceIds[s.jp] = id
      database.run(
        `INSERT INTO jp_sentences (id, japanese, english, difficulty_score, source, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, s.jp, s.en, s.difficulty, 'seed', now]
      )

      // Link sentences to vocabulary
      for (const vocabWord of s.vocabLinks) {
        if (vocabIds[vocabWord] && sentenceIds[s.jp]) {
          database.run(
            `INSERT INTO jp_associations (id, source_id, source_type, target_id, target_type, category, relation, weight, bidirectional, created_at)
             VALUES (?, ?, 'word', ?, 'sentence', 'collocational', 'COLLOCATES_WITH', 1.0, 0, ?)`,
            [nanoid(), vocabIds[vocabWord], sentenceIds[s.jp], now]
          )
        }
      }
    }

    // ============================================================
    // ASSOCIATIONS
    // ============================================================

    const associations: {
      srcId: string; srcType: string
      tgtId: string; tgtType: string
      category: string; relation: string
      weight: number; bidir: boolean
    }[] = []

    // Semantic: antonyms
    if (vocabIds['大きい'] && vocabIds['小さい']) {
      associations.push({ srcId: vocabIds['大きい'], srcType: 'word', tgtId: vocabIds['小さい'], tgtType: 'word', category: 'semantic', relation: 'ANTONYM', weight: 1.0, bidir: true })
    }
    if (vocabIds['上'] && vocabIds['下']) {
      associations.push({ srcId: vocabIds['上'], srcType: 'word', tgtId: vocabIds['下'], tgtType: 'word', category: 'semantic', relation: 'ANTONYM', weight: 1.0, bidir: true })
    }
    if (vocabIds['大人'] && vocabIds['子供']) {
      associations.push({ srcId: vocabIds['大人'], srcType: 'word', tgtId: vocabIds['子供'], tgtType: 'word', category: 'semantic', relation: 'ANTONYM', weight: 1.0, bidir: true })
    }

    // Semantic: thematic (food/drink)
    if (vocabIds['食べる'] && vocabIds['飲む']) {
      associations.push({ srcId: vocabIds['食べる'], srcType: 'word', tgtId: vocabIds['飲む'], tgtType: 'word', category: 'semantic', relation: 'THEMATIC', weight: 0.9, bidir: true })
    }
    // Semantic: thematic (read/write)
    if (vocabIds['読む'] && vocabIds['書く']) {
      associations.push({ srcId: vocabIds['読む'], srcType: 'word', tgtId: vocabIds['書く'], tgtType: 'word', category: 'semantic', relation: 'THEMATIC', weight: 0.9, bidir: true })
    }

    // Orthographic: kanji sharing radicals (SHARED_RADICAL)
    // 見 and 目 share the 目 radical
    if (kanjiIds['見'] && kanjiIds['日']) {
      associations.push({ srcId: kanjiIds['見'], srcType: 'kanji', tgtId: kanjiIds['日'], tgtType: 'kanji', category: 'orthographic', relation: 'SHARED_RADICAL', weight: 0.6, bidir: true })
    }
    // 書 and 日 share the 日 radical
    if (kanjiIds['書'] && kanjiIds['日']) {
      associations.push({ srcId: kanjiIds['書'], srcType: 'kanji', tgtId: kanjiIds['日'], tgtType: 'kanji', category: 'orthographic', relation: 'SHARED_RADICAL', weight: 0.7, bidir: true })
    }
    // 学 and 子 share the 子 component
    if (kanjiIds['学'] && kanjiIds['子']) {
      associations.push({ srcId: kanjiIds['学'], srcType: 'kanji', tgtId: kanjiIds['子'], tgtType: 'kanji', category: 'orthographic', relation: 'CONTAINS_COMPONENT', weight: 0.8, bidir: false })
    }
    // 男 and 田 share the 田 radical
    if (kanjiIds['男'] && kanjiIds['田']) {
      associations.push({ srcId: kanjiIds['男'], srcType: 'kanji', tgtId: kanjiIds['田'], tgtType: 'kanji', category: 'orthographic', relation: 'SHARED_RADICAL', weight: 0.7, bidir: true })
    }

    // Collocational: compound words (COMPOUND_WORD)
    if (vocabIds['学校'] && kanjiIds['学']) {
      associations.push({ srcId: vocabIds['学校'], srcType: 'word', tgtId: kanjiIds['学'], tgtType: 'kanji', category: 'collocational', relation: 'COMPOUND_WORD', weight: 1.0, bidir: false })
    }
    if (vocabIds['学校'] && kanjiIds['校']) {
      associations.push({ srcId: vocabIds['学校'], srcType: 'word', tgtId: kanjiIds['校'], tgtType: 'kanji', category: 'collocational', relation: 'COMPOUND_WORD', weight: 1.0, bidir: false })
    }
    if (vocabIds['先生'] && kanjiIds['先']) {
      associations.push({ srcId: vocabIds['先生'], srcType: 'word', tgtId: kanjiIds['先'], tgtType: 'kanji', category: 'collocational', relation: 'COMPOUND_WORD', weight: 1.0, bidir: false })
    }
    if (vocabIds['先生'] && kanjiIds['生']) {
      associations.push({ srcId: vocabIds['先生'], srcType: 'word', tgtId: kanjiIds['生'], tgtType: 'kanji', category: 'collocational', relation: 'COMPOUND_WORD', weight: 1.0, bidir: false })
    }

    // Grammatical: ichidan verbs grouped (SAME_CONJUGATION)
    if (vocabIds['食べる'] && vocabIds['見る']) {
      associations.push({ srcId: vocabIds['食べる'], srcType: 'word', tgtId: vocabIds['見る'], tgtType: 'word', category: 'grammatical', relation: 'SAME_CONJUGATION', weight: 0.7, bidir: true })
    }
    if (vocabIds['食べる'] && vocabIds['生まれる']) {
      associations.push({ srcId: vocabIds['食べる'], srcType: 'word', tgtId: vocabIds['生まれる'], tgtType: 'word', category: 'grammatical', relation: 'SAME_CONJUGATION', weight: 0.7, bidir: true })
    }
    if (vocabIds['見る'] && vocabIds['生まれる']) {
      associations.push({ srcId: vocabIds['見る'], srcType: 'word', tgtId: vocabIds['生まれる'], tgtType: 'word', category: 'grammatical', relation: 'SAME_CONJUGATION', weight: 0.7, bidir: true })
    }

    // Grammatical: godan verbs grouped (SAME_CONJUGATION)
    if (vocabIds['読む'] && vocabIds['飲む']) {
      associations.push({ srcId: vocabIds['読む'], srcType: 'word', tgtId: vocabIds['飲む'], tgtType: 'word', category: 'grammatical', relation: 'SAME_CONJUGATION', weight: 0.8, bidir: true })
    }

    // Grammatical: vocab uses grammar pattern
    if (vocabIds['食べる'] && grammarIds['たい']) {
      associations.push({ srcId: vocabIds['食べる'], srcType: 'word', tgtId: grammarIds['たい'], tgtType: 'grammar', category: 'grammatical', relation: 'USES_GRAMMAR', weight: 0.6, bidir: false })
    }
    if (vocabIds['食べる'] && grammarIds['ている']) {
      associations.push({ srcId: vocabIds['食べる'], srcType: 'word', tgtId: grammarIds['ている'], tgtType: 'grammar', category: 'grammatical', relation: 'USES_GRAMMAR', weight: 0.6, bidir: false })
    }

    for (const a of associations) {
      database.run(
        `INSERT INTO jp_associations (id, source_id, source_type, target_id, target_type, category, relation, weight, bidirectional, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [nanoid(), a.srcId, a.srcType, a.tgtId, a.tgtType, a.category, a.relation, a.weight, a.bidir ? 1 : 0, now]
      )
    }

    // ============================================================
    // SRS CARDS
    // ============================================================

    // Meaning + reading cards for each kanji
    for (const k of kanjiData) {
      const kid = kanjiIds[k.char]
      if (!kid) continue

      // Meaning card
      database.run(
        `INSERT INTO jp_srs_cards (id, item_id, item_type, card_type, stability, difficulty, elapsed_days, scheduled_days, reps, lapses, state, due, implicit_boost, created_at)
         VALUES (?, ?, 'kanji', 'meaning', 0, 0, 0, 0, 0, 0, 0, ?, 0, ?)`,
        [nanoid(), kid, dueDate, now]
      )

      // Reading card
      database.run(
        `INSERT INTO jp_srs_cards (id, item_id, item_type, card_type, stability, difficulty, elapsed_days, scheduled_days, reps, lapses, state, due, implicit_boost, created_at)
         VALUES (?, ?, 'kanji', 'reading', 0, 0, 0, 0, 0, 0, 0, ?, 0, ?)`,
        [nanoid(), kid, dueDate, now]
      )
    }

    // Meaning cards for each vocabulary
    for (const v of vocabData) {
      const vid = vocabIds[v.word]
      if (!vid) continue

      database.run(
        `INSERT INTO jp_srs_cards (id, item_id, item_type, card_type, stability, difficulty, elapsed_days, scheduled_days, reps, lapses, state, due, implicit_boost, created_at)
         VALUES (?, ?, 'word', 'meaning', 0, 0, 0, 0, 0, 0, 0, ?, 0, ?)`,
        [nanoid(), vid, dueDate, now]
      )
    }

    // ============================================================
    // INITIAL PROGRESS
    // ============================================================

    const dimensions = ['vocabulary', 'kanji', 'grammar', 'reading', 'listening']
    for (const dim of dimensions) {
      let total = 0
      if (dim === 'vocabulary') total = vocabData.length
      else if (dim === 'kanji') total = kanjiData.length
      else if (dim === 'grammar') total = grammarData.length

      database.run(
        `INSERT INTO jp_progress (dimension, current_level, items_total, items_learning, items_known, items_mastered, daily_streak, updated_at)
         VALUES (?, 1, ?, 0, 0, 0, 0, ?)`,
        [dim, total, now]
      )
    }

    console.log(
      `[japanese-seed] Seeded: ${radicals.length} radicals, ${kanjiData.length} kanji, ` +
      `${vocabData.length} vocab, ${grammarData.length} grammar, ${sentenceData.length} sentences, ` +
      `${associations.length} associations, ${kanjiData.length * 2 + vocabData.length} SRS cards`
    )

  } catch (err) {
    console.error('[japanese-seed] Error seeding Japanese data:', err)
    throw err
  }
}
