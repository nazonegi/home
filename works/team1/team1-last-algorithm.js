(() => {
  "use strict";

  const animals = ["rat", "ox", "tiger", "rabbit", "dragon", "snake", "horse", "sheep", "monkey", "rooster", "dog", "boar"];
  const animalNames = ["ねずみ", "うし", "とら", "うさぎ", "たつ", "へび", "うま", "ひつじ", "さる", "とり", "いぬ", "いのしし"];
  const q1AnimalAliases = [
    ["ねずみ", "ね", "し"], ["うし"], ["とら"], ["うさぎ", "う"],
    ["たつ", "りゅう"], ["へび", "み"], ["うま"], ["ひつじ"],
    ["さる"], ["とり", "にわとり"], ["いぬ"], ["いのしし", "い"]
  ];

  const q1Homophones = [
    { answer: "はし", meanings: [
      { name: "箸", icon: "🥢", file: "hashi/hashi-chopsticks.png", decoys: ["🥄", "🍴", "🔪", "🫕", "🧹", "🧽", "🥣", "🍳"] },
      { name: "橋", icon: "🌉", file: "hashi/hashi-bridge.png", decoys: ["🏠", "🏫", "🏯", "⛩️", "🗼", "🏰", "🏭", "🚇"] }
    ] },
    { answer: "あめ", meanings: [
      { name: "飴", icon: "🍬", file: "ame/ame-candy.png", decoys: ["🍰", "🍩", "🍪", "🍫", "🍮", "🍨", "🧁", "🥞"] },
      { name: "雨", icon: "🌧️", file: "ame/ame-rain.png", decoys: ["☀️", "☁️", "🌨️", "⚡", "🌈", "🌪️", "🌫️", "💨"] }
    ] },
    { answer: "くも", meanings: [
      { name: "蜘蛛", icon: "🕷️", file: "kumo/kumo-spider.png", decoys: ["🪲", "🦋", "🐜", "🐝", "🐞", "🪰", "🦗", "🐛"] },
      { name: "雲", icon: "☁️", file: "kumo/kumo-cloud.png", decoys: ["☀️", "🌙", "⭐", "🌧️", "🌨️", "⚡", "🌈", "🌪️"] }
    ] },
    { answer: "はな", meanings: [
      { name: "花", icon: "🌼", file: "hana/hana-flower.png", decoys: ["🌳", "🍃", "🌵", "☘️", "🎋", "🌱", "🌿", "🪴"] },
      { name: "鼻", icon: "👃", file: "hana/hana-nose.png", decoys: ["👁️", "👂", "👄", "✋", "🦶", "🦷", "👅", "🤨"] }
    ] },
    { answer: "かき", meanings: [
      { name: "柿", icon: "🟠", file: "kaki/kaki-persimmon.png", decoys: ["🍎", "🍊", "🍌", "🍇", "🍑", "🍐", "🍓", "🍈"] },
      { name: "牡蠣", icon: "🦪", file: "kaki/kaki-oyster.png", decoys: ["🦐", "🦀", "🦑", "🐙", "🐚", "🐟", "🍥", "🪼"] }
    ] },
    { answer: "かみ", meanings: [
      { name: "紙", icon: "📄", file: "kami/kami-paper.png", decoys: ["✏️", "🧽", "📓", "✂️", "📏", "🖇️", "📌", "✉️"] },
      { name: "髪", icon: "💇", file: "kami/kami-hair.png", decoys: ["🎩", "👑", "🎀", "🧢", "👓", "🎧", "👒", "🪮"] }
    ] },
    { answer: "しか", meanings: [
      { name: "鹿", icon: "🦌", file: "shika/shika-deer.png", decoys: ["🐕", "🐈", "🐇", "🐻", "🦊", "🦝", "🐒", "🐗"] },
      { name: "歯科", icon: "🦷", file: "shika/shika-dentist.png", decoys: ["🏥", "🏫", "🏢", "🚒", "🏣", "🏦", "💊", "🏪"] }
    ] }
  ];

  const q1Marks = [
    { symbol: "!", answer: "かんたんふ", prompt: "同じ記号を入力！", aliases: ["かんたんふ", "びっくりまーく", "びっくり", "えくすくらめーしょんまーく"] },
    { symbol: "?", answer: "ぎもんふ", prompt: "同じ記号はなに？", aliases: ["ぎもんふ", "はてな", "くえすちょんまーく"] },
    { symbol: "。", answer: "くてん", prompt: "同じ記号を入力。", aliases: ["くてん", "まる"] }
  ];
  const q1MarkDecoys = ["#", "$", "%", "&", "*", "+", "-", "=", "@", "~", "^", "_", ":", ";", ",", ".", "/", "\\", "|", "<", ">", "(", ")", "[", "]", "{", "}", "○", "△", "□", "☆", "♡", "♧", "♢", "※", "〒", "→", "←", "↑", "↓", "∞", "≠", "÷", "×", "♪", "◎", "◆", "◇", "●", "▲", "■", "★", "♥", "♣", "♦", "⊕", "⊗", "≈", "≡", "≤", "≥", "√", "∴", "∵", "℃", "♂", "♀", "§"];

  const q2Runners = [
    { slug: "tanuki", name: "たぬき", kana: "た" }, { slug: "kokeshi", name: "こけし", kana: "こ" },
    { slug: "nine", name: "ないん", kana: "ん" }, { slug: "knight", name: "ないと", kana: "と" },
    { slug: "torii", name: "とりい", kana: "い" }, { slug: "shinai", name: "しない", kana: "し" },
    { slug: "kemushi", name: "けむし", kana: "け" }, { slug: "knife", name: "ないふ", kana: "ふ" },
    { slug: "mamushi", name: "まむし", kana: "ま" }, { slug: "straw", name: "ストロー", kana: "す" },
    { slug: "dress", name: "ドレス", kana: "ど" }, { slug: "trio", name: "トリオ", kana: "お" }
  ];
  const q2Answers = [
    { word: "CITY", answer: "してぃ", aliases: ["してぃ", "city"] },
    { word: "IDOL", answer: "あいどる", aliases: ["あいどる", "idol"] },
    { word: "DOLL", answer: "どーる", aliases: ["どーる", "doll"] },
    { word: "JULY", answer: "じゅらい", aliases: ["じゅらい", "july"] },
    { word: "COLD", answer: "こーるど", aliases: ["こーるど", "cold"] },
    { word: "COOL", answer: "くーる", aliases: ["くーる", "cool"] }
  ];
  const linkedAnswers = [
    { q2: "してぃ", q1: "かんたんふ", q3: "しゅうり", final: "しゅうてん", parts: { q2: "して", q1: "ん", q3: "ゅう" } },
    { q2: "してぃ", q1: "ぎもんふ", q3: "きゅうり", final: "しゅうてん", parts: { q2: "して", q1: "ん", q3: "ゅう" } },
    { q2: "してぃ", q1: "くてん", q3: "ひめくり", final: "しめくくり", parts: { q2: "し", q1: "く", q3: "めくり" } },
    { q2: "あいどる", q1: "かんたんふ", q3: "せいふく", final: "せいかい", parts: { q2: "い", q1: "か", q3: "せい" } },
    { q2: "あいどる", q1: "ぎもんふ", q3: "からあげ", final: "かいもん", parts: { q2: "い", q1: "もん", q3: "か" } },
    { q2: "あいどる", q1: "くてん", q3: "りょうり", final: "くりあ", parts: { q2: "あ", q1: "く", q3: "り" } },
    { q2: "どーる", q1: "かんたんふ", q3: "いくせい", final: "かいどく", parts: { q2: "ど", q1: "か", q3: "いく" } },
    { q2: "どーる", q1: "ぎもんふ", q3: "えんぴつ", final: "えんど", parts: { q2: "ど", q1: "ん", q3: "え" } },
    { q2: "どーる", q1: "くてん", q3: "みずいろ", final: "くろーず", parts: { q2: "ー", q1: "く", q3: "ろず" } },
    { q2: "じゅらい", q1: "かんたんふ", q3: "せいふく", final: "せいかい", parts: { q2: "い", q1: "か", q3: "せい" } },
    { q2: "じゅらい", q1: "ぎもんふ", q3: "からあげ", final: "かいもん", parts: { q2: "い", q1: "もん", q3: "か" } },
    { q2: "じゅらい", q1: "くてん", q3: "しゅうり", final: "しゅうてん", parts: { q2: "ゅ", q1: "てん", q3: "しう" } },
    { q2: "こーるど", q1: "かんたんふ", q3: "えんぴつ", final: "こたえ", parts: { q2: "こ", q1: "た", q3: "え" } },
    { q2: "こーるど", q1: "ぎもんふ", q3: "えんぴつ", final: "えんど", parts: { q2: "ど", q1: "ん", q3: "え" } },
    { q2: "こーるど", q1: "くてん", q3: "みずいろ", final: "くろーず", parts: { q2: "ー", q1: "く", q3: "ろず" } },
    { q2: "くーる", q1: "かんたんふ", q3: "ごうどう", final: "ごうかく", parts: { q2: "く", q1: "か", q3: "ごう" } },
    { q2: "くーる", q1: "ぎもんふ", q3: "げんかん", final: "ふくげん", parts: { q2: "く", q1: "ふん", q3: "げ" } },
    { q2: "くーる", q1: "くてん", q3: "かいだん", final: "かくてい", parts: { q2: "く", q1: "て", q3: "かい" } }
  ];

  const finalDifferenceLabels = {
    A1: "木のりんご",
    A2: "青い鳥の向き",
    A4: "風船",
    B1: "ベンチ",
    B2: "なぞねぎの鼻",
    B3: "赤いボール",
    B4: "なぞなすの鼻",
    C1: "花壇のテントウムシ",
    C2: "花壇のトンボ",
    C3: "紫の花",
    C4: "なぞなすの足元のあおむし"
  };
  const q2DotLetters = {
    C: [1, 1, 1, 1, 0, 0, 1, 1, 1], I: [0, 1, 0, 0, 1, 0, 0, 1, 0],
    T: [1, 1, 1, 0, 1, 0, 0, 1, 0], Y: [1, 0, 1, 0, 1, 0, 0, 1, 0],
    D: [1, 1, 0, 1, 0, 1, 1, 1, 0], O: [1, 1, 1, 1, 0, 1, 1, 1, 1],
    L: [1, 0, 0, 1, 0, 0, 1, 1, 1], J: [1, 1, 1, 0, 1, 0, 1, 1, 0],
    U: [1, 0, 1, 1, 0, 1, 1, 1, 1]
  };

  function hash(text) {
    let value = 2166136261;
    for (let i = 0; i < text.length; i++) {
      value ^= text.charCodeAt(i);
      value = Math.imul(value, 16777619);
    }
    return value >>> 0;
  }

  function randomFrom(seed) {
    let state = seed >>> 0;
    return () => {
      state += 0x6D2B79F5;
      let value = state;
      value = Math.imul(value ^ value >>> 15, value | 1);
      value ^= value + Math.imul(value ^ value >>> 7, value | 61);
      return ((value ^ value >>> 14) >>> 0) / 4294967296;
    };
  }

  function shuffle(values, random) {
    const result = [...values];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  function createQ1(roundKey) {
    const random = randomFrom(hash(`team1:q1:${roundKey}`));
    const animalAnswerIndex = Math.floor(random() * animals.length);
    const animalOthers = shuffle(animals.map((_, index) => index).filter(index => index !== animalAnswerIndex), random);
    const animalSide = indexes => shuffle([animalAnswerIndex, ...indexes], random);

    const homophone = q1Homophones[Math.floor(random() * q1Homophones.length)];
    const swapMeanings = random() >= 0.5;
    const makeHomophoneSide = meaningIndex => {
      const meaning = homophone.meanings[meaningIndex];
      const fileDirectory = meaning.file.includes("/") ? meaning.file.slice(0, meaning.file.lastIndexOf("/") + 1) : "";
      const fileSlug = meaning.file.slice(meaning.file.lastIndexOf("/") + 1).replace(/\.png$/i, "");
      return shuffle([
        { icon: meaning.icon, file: meaning.file, alt: meaning.name, target: true },
        ...meaning.decoys.map((icon, index) => ({
          icon,
          file: `${fileDirectory}${fileSlug}-decoy-${index + 1}.png`,
          alt: `同じジャンルの絵${index + 1}`,
          target: false
        }))
      ], random);
    };

    const mark = q1Marks[Math.floor(random() * q1Marks.length)];
    const forbiddenMarks = new Set(["!", "！", "?", "？", "。"]);
    const markOthers = shuffle(q1MarkDecoys.filter(symbol => !forbiddenMarks.has(symbol)), random);
    const makeMarkSide = symbols => shuffle(symbols, random);

    return {
      roundKey,
      stage1: {
        prompt: "同じ動物は？",
        answer: animalNames[animalAnswerIndex],
        aliases: q1AnimalAliases[animalAnswerIndex],
        sideA: animalSide(animalOthers.slice(0, 5)),
        sideB: animalSide(animalOthers.slice(5, 10)),
        motionSeed: { sideA: hash(`team1:q1:${roundKey}:1:A`), sideB: hash(`team1:q1:${roundKey}:1:B`) }
      },
      stage2: {
        prompt: "同じおとが答え！",
        answer: homophone.answer,
        aliases: [homophone.answer],
        sideA: makeHomophoneSide(swapMeanings ? 1 : 0),
        sideB: makeHomophoneSide(swapMeanings ? 0 : 1),
        motionSeed: { sideA: hash(`team1:q1:${roundKey}:2:A`), sideB: hash(`team1:q1:${roundKey}:2:B`) }
      },
      stage3: {
        prompt: mark.prompt,
        symbol: mark.symbol,
        answer: mark.answer,
        aliases: mark.aliases,
        sideA: makeMarkSide(markOthers.slice(0, 30)),
        sideB: makeMarkSide(markOthers.slice(30, 60)),
        motionSeed: { sideA: hash(`team1:q1:${roundKey}:3:A`), sideB: hash(`team1:q1:${roundKey}:3:B`) }
      }
    };
  }

  function createQ2(roundKey) {
    const random = randomFrom(hash(`team1:q2:${roundKey}`));
    const answer = q2Answers[Math.floor(random() * q2Answers.length)];
    const runnerIndexes = shuffle(q2Runners.map((_, index) => index), random).slice(0, 8);
    const sideRunnerIndexes = { sideA: runnerIndexes.slice(0, 4), sideB: runnerIndexes.slice(4, 8) };
    const selectedKana = runnerIndexes.map(index => q2Runners[index].kana);
    const fillerKana = [..."あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん"].filter(character => !selectedKana.includes(character));

    const makeMask = letters => {
      const mask = Array(18).fill(false);
      [...letters].forEach((letter, letterIndex) => {
        q2DotLetters[letter].forEach((filled, pixelIndex) => {
          const row = Math.floor(pixelIndex / 3);
          const column = pixelIndex % 3 + letterIndex * 3;
          mask[row * 6 + column] = Boolean(filled);
        });
      });
      return mask;
    };
    const makeGrid = sideName => {
      const otherName = sideName === "sideA" ? "sideB" : "sideA";
      const wordOffset = sideName === "sideA" ? 0 : 2;
      const letterMask = makeMask(answer.word.slice(wordOffset, wordOffset + 2));
      const mask = sideName === "sideB" ? letterMask.map(filled => !filled) : letterMask;
      const priority = [...sideRunnerIndexes[otherName], ...sideRunnerIndexes[sideName]].map(index => q2Runners[index].kana);
      const blackCount = mask.filter(Boolean).length;
      const blackLetters = priority.slice(0, blackCount);
      while (blackLetters.length < blackCount) blackLetters.push(selectedKana[Math.floor(random() * selectedKana.length)]);
      const shuffledBlackLetters = shuffle(blackLetters, random);
      let blackIndex = 0;
      const letters = mask.map(filled => filled
        ? shuffledBlackLetters[blackIndex++]
        : fillerKana[Math.floor(random() * fillerKana.length)]);
      return { runners: sideRunnerIndexes[sideName].map(index => q2Runners[index]), mask, letters };
    };

    return { roundKey, word: answer.word, answer: answer.answer, aliases: answer.aliases, sideA: makeGrid("sideA"), sideB: makeGrid("sideB") };
  }

  function createLinkedOutcome(q1Answer, q2Answer) {
    const rule = linkedAnswers.find(item => item.q1 === q1Answer && item.q2 === q2Answer);
    if (!rule) return null;
    const sourceAnswers = { q1: rule.q1, q2: rule.q2, q3: rule.q3 };
    const selected = [];
    Object.entries(rule.parts).forEach(([source, part]) => {
      const available = [...sourceAnswers[source]].map((character, index) => ({ character, position: index + 1, used: false }));
      [...part].forEach(character => {
        const match = available.find(item => !item.used && item.character === character && item.position <= 5);
        if (!match) throw new Error(`LASTの文字位置が見つかりません: ${source}:${character}`);
        match.used = true;
        selected.push({ source, character, position: match.position, number: 0 });
      });
    });
    [...rule.final].forEach((character, index) => {
      const match = selected.find(item => item.number === 0 && item.character === character);
      if (!match) throw new Error(`LASTの並びを作れません: ${rule.final}:${character}`);
      match.number = index + 1;
    });
    return {
      q1Answer: rule.q1,
      q2Answer: rule.q2,
      q3Answer: rule.q3,
      finalAnswer: rule.final,
      selected,
      positions: {
        q1: selected.filter(item => item.source === "q1").map(item => item.position),
        q2: selected.filter(item => item.source === "q2").map(item => item.position),
        q3: selected.filter(item => item.source === "q3").map(item => item.position)
      }
    };
  }

  function getFinalDifferenceHints(outcome) {
    if (!outcome) return [];
    const rowForSource = { q2: "A", q3: "B", q1: "C" };
    return outcome.selected
      .map(item => `${rowForSource[item.source]}${item.position}`)
      .sort((left, right) => left.localeCompare(right, "en", { numeric: true }))
      .map(coordinate => ({ coordinate, label: finalDifferenceLabels[coordinate] || coordinate }));
  }

  window.Team1Last = { animals, animalNames, q1Homophones, q1Marks, q2Runners, q2Answers, linkedAnswers, finalDifferenceLabels, hash, randomFrom, createQ1, createQ2, createLinkedOutcome, getFinalDifferenceHints };
})();
