const blueBoardRows = [
  ["び", "ぐ", { image: "blue/green-answer.svg", value: "GREENの答え", label: "GREENの答え" }, "ば", "ぐ", "め", "ん", "た", "ぎ"],
  ["そ", "わ", "ー", "じ", "ち", "か", { image: "blue/red-answer.svg", value: "REDの答え", label: "REDの答え" }, "お", "い"],
  ["あ", "な", "し", "ゃ", "が", { image: "blue/yellow-answer.svg", value: "YELLOWの答え", label: "YELLOWの答え" }, "す", "げ", "と"],
  ["ん", "ぱ", "た", "は", "う", "ね", "り", "よ", { image: "blue/i3.svg", value: "イラスト", label: "イラスト" }],
  ["る", "な", "ご", "ら", "に", "さ", "こ", "せ", "ぬ"],
  ["や", "も", { image: "blue/i1.svg", value: "イラスト", label: "イラスト" }, "ご", "を", "で", { image: "blue/i2.svg", value: "イラスト", label: "イラスト" }, "く", "う"]
];

function sendOnlylastAnalyticsEvent(eventName) {
  if (typeof gtag !== "function") return;
  gtag("event", eventName, { work_id: "onlylast" });
}

document.addEventListener("DOMContentLoaded", () => {
  if (E("answerButton")) sendOnlylastAnalyticsEvent("game_start");
});

const blueSpecialCells = new Set(["1,3", "2,7", "3,6", "4,9", "6,3", "6,7"]);
const blueBottomWalls = new Set(["1,3", "1,7", "4,2", "4,6", "5,5", "5,8"]);
const blueRightWalls = new Set(["2,3", "2,5", "3,1", "3,7", "3,8", "4,2"]);
let blueRoute = [];
let blueBoardReady = false;
let blueExpanded = false;
let yellowBoardReady = false;
let yellowExpanded = false;
let yellowRightUClicks = 0;
const yellowActiveEdges = new Set();

validate = function validateOnlylast() {
  if (!gameData.title || !gameData.questions?.length) {
    throw Error("設定エラー：data.jsonを確認してください。");
  }
};

const baseOnlylastRestore = restore;
restore = function restoreOnlylast() {
  baseOnlylastRestore();
  unlockedIndex = gameData.questions.length - 1;
};

nav = function navOnlylast() {
  E("stepNav").innerHTML = "";
  gameData.questions.forEach((question, index) => {
    const button = document.createElement("button");
    button.className = "dot"
      + (question.color ? ` dot-${question.color}` : "")
      + (index === currentQuestionIndex ? " current" : "");
    button.disabled = index === currentQuestionIndex;
    button.ariaLabel = `${question.label}へ移動`;
    button.onclick = () => move(index);
    E("stepNav").appendChild(button);
  });
  E("prevButton").disabled = currentQuestionIndex === 0;
  E("nextButton").disabled = currentQuestionIndex >= gameData.questions.length - 1;
};

check = function checkOnlylast() {
  const question = gameData.questions[currentQuestionIndex];
  const rawAnswer = E("answerInput").value;
  const normalizedAnswer = norm(rawAnswer);
  const isCorrect = (question.answers || []).map(norm).includes(normalizedAnswer);

  if (!isCorrect) {
    E("wrongMessage").textContent = "どうやら違うようだ。";
    return;
  }

  E("wrongMessage").textContent = "";
  submittedAnswers[question.id] = rawAnswer;
  save();
  renderAnswer();
  nav();

  const allSolved = gameData.questions.every(item => {
    const submitted = submittedAnswers[item.id];
    return submitted && (item.answers || []).map(norm).includes(norm(submitted));
  });

  if (allSolved) {
    sendOnlylastAnalyticsEvent("game_clear");
    clearModal();
    return;
  }

  modal(`<h2>正解！</h2><p>${esc(question.successMessage || "正解！")}</p><div class="modalactions"><button id="goNext">次へ</button></div>`);
  E("goNext").onclick = () => {
    closeModal();
    const nextUnsolved = gameData.questions.findIndex((item, index) =>
      index > currentQuestionIndex && !submittedAnswers[item.id]
    );
    const firstUnsolved = gameData.questions.findIndex(item => !submittedAnswers[item.id]);
    move(nextUnsolved >= 0
      ? nextUnsolved
      : firstUnsolved >= 0
        ? firstUnsolved
        : currentQuestionIndex);
  };
};

resetConfirm = function resetOnlylastConfirm() {
  modal('<h2>進捗リセット</h2><p>進捗をリセットしますか？</p><p>これまでの回答履歴が削除されます。</p><div class="modalactions"><button id="doReset">リセットする</button><button id="cancelReset">キャンセル</button></div>');
  E("doReset").onclick = () => {
    localStorage.removeItem(key());
    currentQuestionIndex = 0;
    unlockedIndex = gameData.questions.length - 1;
    submittedAnswers = {};
    resetYellowBoard();
    resetBlueRoute();
    closeModal();
    render();
  };
  E("cancelReset").onclick = closeModal;
};

const baseOnlylastRender = render;
render = function renderOnlylast() {
  const nextQuestionId = gameData.questions[currentQuestionIndex]?.id;
  if (yellowExpanded && nextQuestionId !== "yellow") closeYellowExpanded();
  if (blueExpanded && nextQuestionId !== "blue") closeBlueExpanded();
  baseOnlylastRender();
  const label = E("questionLabel");
  label.classList.remove("label-red", "label-yellow", "label-green", "label-blue");
  if (gameData.questions[currentQuestionIndex]?.color) {
    label.classList.add(`label-${gameData.questions[currentQuestionIndex].color}`);
  }
  const isYellow = nextQuestionId === "yellow";
  const isBlue = nextQuestionId === "blue";
  E("questionImage").classList.toggle("hidden", isYellow || isBlue);
  E("yellowPuzzle").classList.toggle("hidden", !isYellow);
  E("bluePuzzle").classList.toggle("hidden", !isBlue);
  if (isYellow && !yellowBoardReady) buildYellowBoard();
  if (isBlue && !blueBoardReady) buildBlueBoard();
};

const yellowCells = [
  {
    id: "first-i",
    column: "first",
    row: "top",
    chars: ["い"],
    edges: { top: "first-i-top", right: "first-i-u", bottom: "first-i-ri", left: "first-i-left" }
  },
  {
    id: "first-u",
    column: "first",
    row: "top",
    subcolumn: "right",
    chars: ["う"],
    edges: { top: "first-u-top", right: "first-u-right", bottom: "first-u-bottom", left: "first-i-u" }
  },
  {
    id: "first-ri",
    column: "first",
    row: "bottom",
    chars: ["り"],
    edges: { top: "first-i-ri", right: "first-ri-right", bottom: "first-ri-bottom", left: "first-ri-left" }
  },
  {
    id: "ka",
    column: "ka",
    row: "top",
    chars: ["か"],
    edges: { top: "ka-top", right: "ka-right", bottom: "ka-overlap", left: "ka-left" }
  },
  {
    id: "uri",
    column: "ka",
    row: "bottom",
    chars: ["う", "り"],
    edges: { top: "ka-overlap", right: "uri-right", bottom: "uri-bottom", left: "uri-left" }
  },
  {
    id: "tari",
    column: "tari",
    row: "bottom",
    chars: ["た", "り"],
    edges: { top: "tari-top", right: "tari-right", bottom: "tari-bottom", left: "tari-left" }
  },
  {
    id: "riu",
    column: "riu",
    row: "bottom",
    chars: ["り", "う"],
    edges: { top: "riu-top", right: "riu-right", bottom: "riu-bottom", left: "riu-left" }
  },
  {
    id: "upper-ri",
    column: "triple",
    row: "top",
    chars: ["り"],
    edges: { top: "upper-ri-top", right: "upper-ri-right", bottom: "upper-ri-triple", left: "upper-ri-left" }
  },
  {
    id: "tarii",
    column: "triple",
    row: "bottom",
    chars: ["た", "り", "い"],
    edges: { top: "upper-ri-triple", right: "tarii-right", bottom: "tarii-bottom", left: "tarii-left" }
  },
  {
    id: "right-u",
    column: "right-u",
    row: "bottom",
    chars: ["う"],
    clickable: true,
    edges: { top: "right-u-top", right: "right-u-right", bottom: "right-u-bottom", left: "right-u-left" }
  }
];

function buildYellowBoard() {
  const board = E("yellowBoard");
  board.innerHTML = `
    <div class="yellow-first-group"></div>
    <div class="yellow-column yellow-column-ka"></div>
    <div class="yellow-column yellow-column-tari"></div>
    <div class="yellow-column yellow-column-riu"></div>
    <div class="yellow-column yellow-column-triple"></div>
    <div class="yellow-image-column">
      <img src="images/yellow/e.svg" alt="e">
    </div>
    <div class="yellow-column yellow-column-right-u"></div>
  `;

  yellowCells.forEach(spec => {
    const cell = document.createElement("div");
    cell.className = `yellow-cell yellow-row-${spec.row}`;
    cell.dataset.cellId = spec.id;

    const content = document.createElement(spec.clickable ? "button" : "div");
    if (spec.clickable) content.type = "button";
    content.className = "yellow-cell-content";
    content.setAttribute("aria-label", spec.clickable ? "右端のう" : spec.chars.join("と"));

    const overlap = document.createElement("span");
    overlap.className = `yellow-overlap overlap-${spec.id}`;
    spec.chars.forEach((char, index) => {
      const span = document.createElement("span");
      span.textContent = char;
      span.style.setProperty("--overlap-index", index);
      overlap.appendChild(span);
    });
    content.appendChild(overlap);

    if (spec.clickable) content.addEventListener("click", countYellowRightU);
    cell.appendChild(content);

    Object.entries(spec.edges).forEach(([side, edgeId]) => {
      const edge = document.createElement("button");
      edge.type = "button";
      edge.className = `yellow-edge edge-${side}`;
      edge.dataset.edgeId = edgeId;
      edge.setAttribute("aria-label", `${spec.id}の${side}の枠線`);
      edge.addEventListener("click", event => {
        event.stopPropagation();
        toggleYellowEdge(edgeId);
      });
      cell.appendChild(edge);
    });

    if (spec.column === "first") {
      cell.classList.add(spec.subcolumn === "right" ? "first-u-cell" : spec.row === "top" ? "first-i-cell" : "first-ri-cell");
      board.querySelector(".yellow-first-group").appendChild(cell);
    } else {
      board.querySelector(`.yellow-column-${spec.column}`).appendChild(cell);
    }
  });

  yellowBoardReady = true;
  E("yellowResetButton").addEventListener("click", resetYellowBoard);
  E("yellowExpandButton").addEventListener("click", toggleYellowExpanded);
  E("yellowPuzzle").addEventListener("click", event => {
    if (yellowExpanded && event.target === E("yellowPuzzle")) closeYellowExpanded();
  });
  document.addEventListener("keydown", event => {
    if (yellowExpanded && event.key === "Escape") closeYellowExpanded();
  });
  renderYellowEdges();
}

function resetYellowBoard() {
  yellowActiveEdges.clear();
  yellowRightUClicks = 0;
  renderYellowEdges();
}

function toggleYellowExpanded() {
  if (yellowExpanded) {
    closeYellowExpanded();
    return;
  }
  yellowRightUClicks = 0;
  yellowExpanded = true;
  E("yellowPuzzle").classList.add("is-expanded");
  E("yellowExpandButton").textContent = "× 戻る";
  E("yellowExpandButton").setAttribute("aria-expanded", "true");
  document.body.classList.add("yellow-expanded-open");
}

function closeYellowExpanded() {
  yellowRightUClicks = 0;
  yellowExpanded = false;
  E("yellowPuzzle").classList.remove("is-expanded");
  E("yellowExpandButton").textContent = "拡大";
  E("yellowExpandButton").setAttribute("aria-expanded", "false");
  document.body.classList.remove("yellow-expanded-open");
}

function toggleYellowEdge(edgeId) {
  if (yellowActiveEdges.has(edgeId)) yellowActiveEdges.delete(edgeId);
  else yellowActiveEdges.add(edgeId);
  renderYellowEdges();
}

function renderYellowEdges() {
  document.querySelectorAll(".yellow-edge").forEach(edge => {
    edge.classList.remove("active");
  });
  yellowActiveEdges.forEach(edgeId => {
    const sharedEdges = document.querySelectorAll(`.yellow-edge[data-edge-id="${edgeId}"]`);
    sharedEdges[0]?.classList.add("active");
  });
}

function countYellowRightU() {
  yellowRightUClicks++;

  if (yellowRightUClicks < 8) return;

  yellowRightUClicks = 0;
  if (yellowExpanded) {
    closeYellowExpanded();
    setTimeout(showYellowPopup, 0);
    return;
  }
  showYellowPopup();
}

function showYellowPopup() {
  modal(`
    <div class="yellow-popup">
      <img src="images/yellow/click-8.svg" alt="8回クリックで見つけた画像">
      <div class="modalactions">
        <button id="closeYellowPopup" type="button">閉じる</button>
      </div>
    </div>
  `);
  E("closeYellowPopup").onclick = closeModal;
}

function buildBlueBoard() {
  const grid = E("blueGrid");
  grid.innerHTML = "";

  blueBoardRows.forEach((row, rowIndex) => {
    row.forEach((entry, colIndex) => {
      const rowNumber = rowIndex + 1;
      const colNumber = colIndex + 1;
      const key = `${rowNumber},${colNumber}`;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "blue-cell";
      button.dataset.row = rowNumber;
      button.dataset.col = colNumber;
      button.dataset.key = key;

      if (blueSpecialCells.has(key)) button.classList.add("blue-special");
      if (blueBottomWalls.has(key)) button.classList.add("wall-bottom");
      if (blueRightWalls.has(key)) button.classList.add("wall-right");

      if (typeof entry === "string") {
        button.dataset.letter = entry;
        button.textContent = entry;
        button.setAttribute("aria-label", `${rowNumber}行${colNumber}列 ${entry}`);
      } else {
        button.dataset.value = entry.value;
        button.innerHTML = `<img src="images/${entry.image}" alt="${entry.label}">`;
        button.setAttribute("aria-label", `${rowNumber}行${colNumber}列 ${entry.label}`);
      }

      if (blueBottomWalls.has(key)) {
        const wall = document.createElement("span");
        wall.className = "blue-wall blue-wall-bottom";
        wall.setAttribute("aria-hidden", "true");
        button.appendChild(wall);
      }
      if (blueRightWalls.has(key)) {
        const wall = document.createElement("span");
        wall.className = "blue-wall blue-wall-right";
        wall.setAttribute("aria-hidden", "true");
        button.appendChild(wall);
      }

      button.addEventListener("click", () => selectBlueCell(button));
      grid.appendChild(button);
    });
  });

  E("blueResetButton").addEventListener("click", resetBlueRoute);
  E("blueExpandButton").addEventListener("click", toggleBlueExpanded);
  E("bluePuzzle").addEventListener("click", event => {
    if (blueExpanded && event.target === E("bluePuzzle")) closeBlueExpanded();
  });
  document.addEventListener("keydown", event => {
    if (blueExpanded && event.key === "Escape") closeBlueExpanded();
  });
  blueBoardReady = true;
  renderBlueRoute();
}

function toggleBlueExpanded() {
  if (blueExpanded) {
    closeBlueExpanded();
    return;
  }
  blueExpanded = true;
  E("bluePuzzle").classList.add("is-expanded");
  E("blueExpandButton").textContent = "× 戻る";
  E("blueExpandButton").setAttribute("aria-expanded", "true");
  document.body.classList.add("blue-expanded-open");
}

function closeBlueExpanded() {
  blueExpanded = false;
  E("bluePuzzle").classList.remove("is-expanded");
  E("blueExpandButton").textContent = "拡大";
  E("blueExpandButton").setAttribute("aria-expanded", "false");
  document.body.classList.remove("blue-expanded-open");
}

function selectBlueCell(cell) {
  const row = Number(cell.dataset.row);
  const col = Number(cell.dataset.col);
  const key = cell.dataset.key;

  if (!blueRoute.length) {
    if (!blueSpecialCells.has(key)) {
      showBlueMessage("最初は水色のマスを選んでください。");
      return;
    }
  } else {
    if (blueRoute.some(step => step.key === key)) {
      showBlueMessage("一度通ったマスには戻れません。");
      return;
    }

    const previous = blueRoute.at(-1);
    const distance = Math.abs(previous.row - row) + Math.abs(previous.col - col);
    if (distance !== 1) {
      showBlueMessage("タテかヨコに隣り合うマスを選んでください。");
      return;
    }

    if (isBlueWallBlocked(previous.row, previous.col, row, col)) {
      showBlueMessage("太い線は横切れません。");
      return;
    }
  }

  if (blueRoute.length === 53 && !blueSpecialCells.has(key)) {
    showBlueMessage("ゴールは青マスでないといけません");
    return;
  }

  blueRoute.push({
    row,
    col,
    key,
    letter: cell.dataset.letter || "",
    value: cell.dataset.value || ""
  });
  cell.classList.add("selected");
  cell.dataset.order = blueRoute.length;
  showBlueMessage(`${blueRoute.length}マス目`);
  renderBlueRoute();
}

function isBlueWallBlocked(fromRow, fromCol, toRow, toCol) {
  if (fromRow === toRow) {
    const leftCol = Math.min(fromCol, toCol);
    return blueRightWalls.has(`${fromRow},${leftCol}`);
  }
  const upperRow = Math.min(fromRow, toRow);
  return blueBottomWalls.has(`${upperRow},${fromCol}`);
}

function renderBlueRoute() {
  const extracted = blueRoute
    .filter((_, index) => (index + 1) % 5 === 0)
    .map(step => step.letter || "？");

  E("blueExtractedLetters").textContent = extracted.length
    ? extracted.join("　")
    : "";
}

function resetBlueRoute() {
  blueRoute = [];
  document.querySelectorAll(".blue-cell.selected").forEach(cell => {
    cell.classList.remove("selected");
    delete cell.dataset.order;
  });
  showBlueMessage("ルートをリセットしました。");
  renderBlueRoute();
}

function showBlueMessage(message) {
  E("blueRouteMessage").textContent = message;
}
