(() => {
  "use strict";

  const LETTERS = [
    "け", "し", "と", "れ",
    "ほ", "の", "あ", "さ",
    "な", "た", "こ", "た",
    "り", "き", "ん", "う",
    "め", "ま", "が", "い"
  ];

  // 「けがれたたましい」に対応する8マス。
  const SOUL_PATTERN = new Set([0, 18, 3, 9, 11, 17, 1, 19]);
  const filled = new Set();

  const area = document.getElementById("templeGridArea");
  const grid = document.getElementById("templeLetterGrid");

  if (!area || !grid) return;

  const cells = LETTERS.map((letter, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "temple-letter-cell";
    button.dataset.index = String(index);
    button.setAttribute("aria-label", `${letter}のマス`);
    button.setAttribute("aria-pressed", "false");

    const span = document.createElement("span");
    span.className = "temple-letter";
    span.textContent = letter;
    button.appendChild(span);

    button.addEventListener("click", () => {
      if (!isLastUnlocked()) return;

      if (filled.has(index)) filled.delete(index);
      else filled.add(index);

      renderCells();
    });

    grid.appendChild(button);
    return button;
  });

  function getLastIndex() {
    if (typeof gameData === "undefined" || !gameData?.questions) return -1;
    return gameData.questions.findIndex(question => question.id === "last");
  }

  function isLastUnlocked() {
    const lastIndex = getLastIndex();
    return lastIndex >= 0 && typeof unlockedIndex !== "undefined" && unlockedIndex >= lastIndex;
  }

  function isQ1Visible() {
    if (typeof gameData === "undefined" || !gameData?.questions) return false;
    if (typeof currentQuestionIndex === "undefined") return false;
    return gameData.questions[currentQuestionIndex]?.id === "q1";
  }

  function isExactSoulPattern() {
    if (filled.size !== SOUL_PATTERN.size) return false;
    return [...SOUL_PATTERN].every(index => filled.has(index));
  }

  function renderCells() {
    const unlocked = isLastUnlocked();
    const soulMatch = unlocked && isExactSoulPattern();

    // LAST未解禁時は必ず全マスを白にする。
    if (!unlocked && filled.size) filled.clear();

    cells.forEach((cell, index) => {
      const active = unlocked && filled.has(index);
      cell.classList.toggle("is-unlocked", unlocked);
      cell.classList.toggle("is-filled", active);cell.classList.toggle(
        "is-soul-match",
        soulMatch && !SOUL_PATTERN.has(index)
      );
      cell.disabled = !unlocked;
      cell.setAttribute("aria-pressed", active ? "true" : "false");
    });

  }

  function updateVisibility() {
    area.classList.toggle("is-visible", isQ1Visible());
    renderCells();
  }

  // 共通script.jsによる問題切替・解禁をDOM変化から検知する。
  const observer = new MutationObserver(updateVisibility);
  const questionLabel = document.getElementById("questionLabel");
  const stepNav = document.getElementById("stepNav");
  if (questionLabel) observer.observe(questionLabel, { childList: true, subtree: true });
  if (stepNav) observer.observe(stepNav, { childList: true, subtree: true });

  document.addEventListener("click", event => {
    if (event.target.closest("#prevButton, #nextButton, #stepNav, #answerButton")) {
      setTimeout(updateVisibility, 0);
    }
  });

  // data.json読み込み後の初期描画を待つ。
  const timer = window.setInterval(() => {
    if (typeof gameData !== "undefined" && gameData?.questions) {
      window.clearInterval(timer);
      updateVisibility();
    }
  }, 50);
})();
