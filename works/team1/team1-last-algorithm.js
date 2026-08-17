(() => {
  "use strict";

  const animals = ["rat", "ox", "tiger", "rabbit", "dragon", "snake", "horse", "sheep", "monkey", "rooster", "dog", "boar"];
  const animalNames = ["ねずみ", "うし", "とら", "うさぎ", "たつ", "へび", "うま", "ひつじ", "さる", "とり", "いぬ", "いのしし"];
  const answers = [
    [1,2,"かい"],[1,3,"かう"],[1,4,"かみ"],[1,5,"かこ"],[1,7,"かき"],[1,9,"かま"],[1,11,"かた"],
    [2,1,"いか"],[2,4,"いみ"],[2,6,"いと"],[2,7,"いき"],[2,9,"いま"],[2,10,"いし"],[2,11,"いた"],[2,12,"いえ"],
    [3,4,"うみ"],[3,7,"うき"],[3,9,"うま"],[3,10,"うし"],[3,11,"うた"],[3,12,"うえ"],
    [4,5,"みこ"],[4,7,"みき"],[4,12,"みえ"],
    [5,2,"こい"],[5,6,"こと"],[5,7,"こき"],[5,9,"こま"],[5,10,"こし"],[5,12,"こえ"],
    [6,2,"とい"],[6,3,"とう"],[6,4,"とみ"],[6,5,"とこ"],[6,7,"とき"],[6,10,"とし"],
    [7,1,"きか"],[7,4,"きみ"],[7,10,"きし"],[7,11,"きた"],
    [8,1,"はか"],[8,2,"はい"],[8,3,"はう"],[8,5,"はこ"],[8,6,"はと"],[8,7,"はき"],[8,9,"はま"],[8,10,"はし"],[8,11,"はた"],[8,12,"はえ"],
    [9,2,"まい"],[9,3,"まう"],[9,6,"まと"],[9,7,"まき"],[9,11,"また"],[9,12,"まえ"],
    [10,1,"しか"],[10,4,"しみ"],[10,6,"しと"],[10,7,"しき"],[10,9,"しま"],[10,11,"した"],
    [11,1,"たか"],[11,2,"たい"],[11,5,"たこ"],[11,7,"たき"],[11,9,"たま"],
    [12,2,"えい"],[12,4,"えみ"],[12,5,"えこ"],[12,6,"えと"],[12,7,"えき"],[12,9,"えま"],[12,10,"えし"]
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
    const chosenA = answers[Math.floor(random() * answers.length)];
    const otherAnswers = answers.filter(row => row[0] !== chosenA[0] || row[1] !== chosenA[1]);
    const chosenB = otherAnswers[Math.floor(random() * otherAnswers.length)];
    const animalForTotal = total => assignedTotals.indexOf(total);

    const makeSide = (name, chosen) => ({
      name,
      tokens: sideTokens[name],
      counts: animals.map((_, index) => sideTokens[name].filter(value => value === index).length),
      targetAnimalIndexes: [animalForTotal(chosen[0]), animalForTotal(chosen[1])],
      targetTotals: [chosen[0], chosen[1]],
      answer: chosen[2],
      motionSeed: hash(`team1:last:${roundKey}:${name}:motion`)
    });

    return {
      roundKey,
      animals,
      animalNames,
      assignedTotals,
      sideA: makeSide("sideA", chosenA),
      sideB: makeSide("sideB", chosenB)
    };
  }

  window.Team1Last = { animals, animalNames, answers, hash, randomFrom, create };
})();
