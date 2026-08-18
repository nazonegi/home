(() => {
  "use strict";

  const animals = ["rat", "ox", "tiger", "rabbit", "dragon", "snake", "horse", "sheep", "monkey", "rooster", "dog", "boar"];
  const animalNames = ["ねずみ", "うし", "とら", "うさぎ", "たつ", "へび", "うま", "ひつじ", "さる", "とり", "いぬ", "いのしし"];
  const kana = ["か", "い", "う", "み", "こ", "と", "き", "は", "ま", "し", "た", "え"];
  const answers = [
    "かいとう", "こうかい", "こうたい", "こうえい", "えいこう", "たいかい", "たいこう",
    "はいかい", "はいこう", "はいたい", "まいかい", "まいとし", "としうえ", "としした",
    "としこし", "うみうし", "しまうま", "いしかい", "しかいし", "いとまき", "たこいと",
    "たましい", "みみかき", "しきいし", "うたかた", "かたこと", "ときたま", "うきしま",
    "こいしい", "いとしい", "こまかい", "たたかい", "かいたい", "いきかた", "かきかた",
    "まきかた", "みえかた", "はえかた", "かえかた", "たきこみ", "まきこみ", "しみこみ",
    "かきたし", "かいたし"
  ];

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

  function create(roundKey) {
    const random = randomFrom(hash(`team1:last:${roundKey}`));
    const assignedTotals = shuffle(Array.from({ length: 12 }, (_, index) => index + 1), random);
    const tokens = [];
    assignedTotals.forEach((count, animalIndex) => {
      for (let i = 0; i < count; i++) tokens.push(animalIndex);
    });
    const shuffledTokens = shuffle(tokens, random);
    const sideTokens = { sideA: shuffledTokens.slice(0, 39), sideB: shuffledTokens.slice(39) };
    const answer = answers[Math.floor(random() * answers.length)];
    const answerTotals = [...answer].map(character => kana.indexOf(character) + 1);
    const animalForTotal = total => assignedTotals.indexOf(total);

    const makeSide = (name, positions) => ({
      name,
      tokens: sideTokens[name],
      counts: animals.map((_, index) => sideTokens[name].filter(value => value === index).length),
      targetPositions: positions.map(position => position + 1),
      targetAnimalIndexes: positions.map(position => animalForTotal(answerTotals[position])),
      targetTotals: positions.map(position => answerTotals[position]),
      answer,
      motionSeed: hash(`team1:last:${roundKey}:${name}:motion`)
    });

    return {
      roundKey,
      animals,
      animalNames,
      assignedTotals,
      sideA: makeSide("sideA", [1, 3]),
      sideB: makeSide("sideB", [0, 2])
    };
  }

  window.Team1Last = { animals, animalNames, answers, hash, randomFrom, create };
})();
