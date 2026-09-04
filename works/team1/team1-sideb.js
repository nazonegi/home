(() => {
  "use strict";

  const pageSide = location.pathname.split("/").pop().replace(/\.html$/i, "") || "sideB";
  const storageKey = `neginazo_team1_${pageSide}_q1`;
  const mazeStorageKey = `neginazo_team1_${pageSide}_q2`;
  const q3StorageKey = `neginazo_team1_${pageSide}_q3`;
  const E = id => document.getElementById(id);
  let selected = new Set();
  let q1Solved = false;
  let q2Solved = false;
  let q3Solved = false;
  let q3Answer = "";
  let finalRule = null;
  let currentQuestion = 0;
  let mazePosition = [0, 4];
  let routeText = "";
  let lastConfig = { roundDurationSeconds: 60 };
  let clearConfig = {};
  let noticeConfig = {};
  let clockOffsetMs = 0;
  let lastRoundKey = null;
  let lastModel = null;
  let q2RoundKey = null;
  let q2Model = null;
  let restoredQ2Progress = null;
  let q2SolvedAnswer = "";
  let lastSprites = [];
  let q1RoundStage = 0;
  let restoredQ1Progress = null;
  let lastFrameTime = performance.now();
  let modalCloseAction = null;

  function getLinkedOutcome() {
    return window.Team1Last?.createLinkedOutcome(q3Answer, q2SolvedAnswer) || null;
  }

  function getLinkedOutcomeKey() {
    const outcome = getLinkedOutcome();
    return outcome ? `${outcome.q1Answer}|${outcome.q2Answer}` : "";
  }

  function resetQ3WhenOutcomeChanges(previousKey) {
    const currentKey = getLinkedOutcomeKey();
    if (!q2Solved || !previousKey || !currentKey || previousKey === currentKey) return false;
    q2Solved = false;
    mazePosition = [0, 4];
    routeText = "";
    finalRule = null;
    E("finalLengthHint").textContent = "";
    E("q2AnswerInput").value = "";
    E("q2WrongMessage").textContent = "";
    E("mazeMessage").textContent = "";
    setSubmittedAnswer("q2SubmittedAnswer", "");
    E("spotDifferenceRows").innerHTML = "";
    renderMazeState();
    saveMaze();
    return true;
  }

  function createFinalRule() {
    const outcome = getLinkedOutcome();
    if (!outcome) return null;
    return {
      answer: outcome.finalAnswer,
      positions: [outcome.positions.q2, outcome.positions.q3, outcome.positions.q1]
    };
  }

  function getMazeLetters() {
    const characters = [...(getLinkedOutcome()?.q3Answer || "はたらく")];
    return { "0,1": "み", "1,0": "ぎ", "1,2": characters[2], "2,4": characters[0], "3,3": "か", "4,1": "ら" };
  }
  const BLOCKED = new Set([
    "0,3|1,3", "1,3|2,3", "2,1|3,1", "3,0|4,0", "3,1|4,1",
    "1,0|1,1", "1,1|1,2", "2,1|2,2", "3,2|3,3", "2,3|2,4"
  ]);

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    window.trackGameEvent?.("game_start", "team1_sideB");
    buildGrid();
    restore();
    E("answerButton").addEventListener("click", checkAnswer);
    E("answerInput").addEventListener("keydown", event => { if (event.key === "Enter") checkAnswer(); });
    E("noticeButton").addEventListener("click", () => showNoticeConfirm("q2"));
    document.querySelectorAll(".progress-reset-button").forEach(button => button.addEventListener("click", showResetConfirm));
    E("laneFullscreenButton").addEventListener("click", openLaneFullscreen);
    E("laneFullscreenClose").addEventListener("click", closeLaneFullscreen);
    document.addEventListener("fullscreenchange", updateLaneFullscreen);
    E("q2NoticeButton").addEventListener("click", () => showNoticeConfirm("q3"));
    document.querySelectorAll("[data-move]").forEach(button => button.addEventListener("click", () => moveMaze(button.dataset.move)));
    E("mazeResetButton").addEventListener("click", resetMaze);
    E("q2AnswerButton").addEventListener("click", checkMazeAnswer);
    E("q2AnswerInput").addEventListener("keydown", event => { if (event.key === "Enter") checkMazeAnswer(); });
    E("q2AnswerInput").addEventListener("input", saveMaze);
    E("q3NoticeButton").addEventListener("click", () => showNoticeConfirm("q1"));
    E("finalNoticeButton").addEventListener("click", () => showNoticeConfirm("last"));
    E("lastAnswerButton").addEventListener("click", checkLastAnswer);
    E("lastAnswerInput").addEventListener("keydown", event => { if (event.key === "Enter") checkLastAnswer(); });
    E("finalAnswerButton").addEventListener("click", checkFinalAnswer);
    E("finalAnswerInput").addEventListener("keydown", event => { if (event.key === "Enter") checkFinalAnswer(); });
    E("spotFullscreenButton").addEventListener("click", openSpotFullscreen);
    E("spotFullscreenClose").addEventListener("click", closeSpotFullscreen);
    document.addEventListener("fullscreenchange", updateSpotFullscreen);
    document.querySelectorAll(".zoom-image-button, .route-node").forEach(button => button.addEventListener("click", () => openViewer(button.querySelector(".zoomable-image"))));
    E("viewerClose").addEventListener("click", closeViewer);
    E("viewer").addEventListener("click", event => { if (event.target === E("viewer")) closeViewer(); });
    E("prevQuestionButton").addEventListener("click", () => showQuestion(currentQuestion - 1));
    E("nextQuestionButton").addEventListener("click", () => showQuestion(currentQuestion + 1));
    document.querySelectorAll("[data-question]").forEach(button => button.addEventListener("click", () => showQuestion(Number(button.dataset.question))));
    E("modalClose").addEventListener("click", closeModal);
    E("modal").addEventListener("click", event => { if (event.target === E("modal")) closeModal(); });
    document.addEventListener("keydown", event => { if (event.key === "Escape") { closeModal(); closeViewer(); } });
    restoreMaze();
    restoreQ3();
    showQuestion(0);
    initLast();
    loadClearConfig();
    loadNoticeConfig();
    requestAnimationFrame(animateZodiac);
    window.addEventListener("resize", alignSpotGridLines);
  }

  function alignSpotGridLines() {
    const grids = document.querySelectorAll(".spot-difference-grid, .spot-code-grid");
    grids.forEach(grid => grid.style.removeProperty("--snapped-grid-width"));
    requestAnimationFrame(() => grids.forEach(grid => {
      const available = Math.floor(grid.getBoundingClientRect().width);
      if (available < 11) return;
      const snapped = Math.floor((available - 6) / 5) * 5 + 6;
      grid.style.setProperty("--snapped-grid-width", `${snapped}px`);
    }));
  }

  function buildGrid() {
    Array.from({ length: 18 }).forEach((_, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "letter-cell";
      button.textContent = "";
      button.dataset.index = index;
      button.setAttribute("aria-label", `${index + 1}番目のマス`);
      button.addEventListener("click", () => {
        if (selected.has(index)) selected.delete(index); else selected.add(index);
        renderGrid();
        save();
      });
      E("letterGrid").appendChild(button);
    });
  }

  function renderGrid() {
    document.querySelectorAll(".letter-cell").forEach(button => {
      const index = Number(button.dataset.index);
      if (q2Model) {
        const side = q2Model.sideB;
        button.textContent = side.letters[index] || "";
        button.setAttribute("aria-label", `${side.letters[index] || ""}のマス`);
      }
      const active = selected.has(index);
      button.classList.toggle("is-black", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function setupImages() {
    if (!q2Model) return;
    const images = [...document.querySelectorAll("#imageLane [data-runner]")];
    images.forEach(image => image.classList.remove("q2-runner"));
    q2Model.sideB.runners.forEach((runner, index) => {
      const image = document.querySelector(`[data-runner="${index}"]`);
      image.src = `images/q2/runners/${runner.slug}.png`;
      image.alt = runner.name;
      image.style.setProperty("--runner-index", index);
    });
    void E("imageLane").offsetWidth;
    images.forEach(image => image.classList.add("q2-runner"));
  }

  async function openLaneFullscreen() {
    const lane = E("imageLane");
    try {
      if (lane.requestFullscreen) await lane.requestFullscreen();
      lane.classList.add("is-mobile-expanded");
      if (screen.orientation && screen.orientation.lock) {
        try { await screen.orientation.lock("landscape"); } catch (_) { /* 非対応端末では拡大だけ行う */ }
      }
    } catch (_) {
      lane.classList.add("is-mobile-expanded");
    }
  }

  async function closeLaneFullscreen() {
    if (document.fullscreenElement && document.exitFullscreen) {
      try { await document.exitFullscreen(); } catch (_) { /* class removal is the fallback */ }
    }
    E("imageLane").classList.remove("is-mobile-expanded");
  }

  function updateLaneFullscreen() {
    const lane = E("imageLane");
    lane.classList.toggle("is-mobile-expanded", document.fullscreenElement === lane);
  }

  async function openSpotFullscreen() {
    const view = E("spotDifferenceView");
    try {
      if (view.requestFullscreen) await view.requestFullscreen();
      view.classList.add("is-expanded");
      if (screen.orientation && screen.orientation.lock) {
        try { await screen.orientation.lock("landscape"); } catch (_) { /* 拡大表示だけ継続する */ }
      }
    } catch (_) {
      view.classList.add("is-expanded");
    }
  }

  async function closeSpotFullscreen() {
    if (document.fullscreenElement === E("spotDifferenceView") && document.exitFullscreen) {
      try { await document.exitFullscreen(); } catch (_) { /* class removal is the fallback */ }
    }
    E("spotDifferenceView").classList.remove("is-expanded");
  }

  function updateSpotFullscreen() {
    const view = E("spotDifferenceView");
    view.classList.toggle("is-expanded", document.fullscreenElement === view);
  }

  function normalize(value) {
    return String(value || "").trim().toLowerCase()
      .replace(/[！-～]/g, char => String.fromCharCode(char.charCodeAt(0) - 0xFEE0))
      .replace(/[ァ-ヶ]/g, char => String.fromCharCode(char.charCodeAt(0) - 0x60))
      .replace(/\s+/g, "");
  }

  function checkAnswer() {
    if (!q2Model?.aliases.includes(normalize(E("answerInput").value))) {
      E("wrongMessage").textContent = "どうやらちがうようだ。";
      return;
    }
    const previousOutcomeKey = getLinkedOutcomeKey();
    E("wrongMessage").textContent = "";
    E("answerInput").value = q2Model.answer;
    q2SolvedAnswer = q2Model.answer;
    const answerChanged = resetQ3WhenOutcomeChanges(previousOutcomeKey);
    setSubmittedAnswer("q1SubmittedAnswer", q2Model.answer);
    q1Solved = true;
    save();
    updateQuestionNav();
    openModal(`<h2 id="modalTitle">正解！</h2><p>答えは「${q2Model.answer}」</p><p>Q2を解き明かした！</p>${answerChanged ? "<p>Q3の答えが変わったようだ！</p>" : ""}<div class="modalactions"><button id="goQ2" type="button">Q3へ</button></div>`, answerChanged ? () => showQuestion(2) : null);
    E("goQ2").addEventListener("click", () => { closeModal(); if (!answerChanged) showQuestion(2); });
  }

  function showResetConfirm() {
    openModal("<h2 id=\"modalTitle\">進捗リセット</h2><p>すべての問題の進捗と回答を最初の状態に戻しますか？</p><div class=\"modalactions\"><button id=\"doReset\" type=\"button\">すべてリセットする</button><button id=\"cancelReset\" type=\"button\">キャンセル</button></div>");
    E("doReset").addEventListener("click", resetAllProgress);
    E("cancelReset").addEventListener("click", closeModal);
  }

  function resetAllProgress() {
    selected.clear();
    q1Solved = false;
    q2Solved = false;
    q3Solved = false;
    q3Answer = "";
    q2SolvedAnswer = "";
    q1RoundStage = 0;
    restoredQ1Progress = null;
    finalRule = null;
    E("finalLengthHint").textContent = "";
    currentQuestion = 0;
    mazePosition = [0, 4];
    routeText = "";
    E("answerInput").value = "";
    E("wrongMessage").textContent = "";
    E("q2AnswerInput").value = "";
    E("q2WrongMessage").textContent = "";
    E("lastAnswerInput").value = "";
    E("lastWrongMessage").textContent = "";
    E("finalAnswerInput").value = "";
    E("finalWrongMessage").textContent = "";
    E("spotDifferenceRows").innerHTML = "";
    ["q1SubmittedAnswer", "q2SubmittedAnswer", "lastSubmittedAnswer", "finalSubmittedAnswer"].forEach(id => setSubmittedAnswer(id, ""));
    localStorage.removeItem(storageKey);
    localStorage.removeItem(mazeStorageKey);
    localStorage.removeItem(q3StorageKey);
    renderGrid();
    renderMazeState();
    if (lastModel) renderLastRound();
    showQuestion(0);
    closeModal();
  }

  async function loadNoticeConfig() {
    try {
      const response = await fetch("notice-config.json", { cache: "no-store" });
      if (response.ok) noticeConfig = await response.json();
    } catch (_) { /* Use fallback notices. */ }
  }

  function showNoticeConfirm(question) {
    openModal('<h2 id="modalTitle">気づく</h2><img class="thinking-image" src="../../image/kanngaeru_nasu.png" alt="考えているなぞなす"><p class="noticecontent">なぞなすが周囲をもう一度見回します。\n\n新しい発見があるかもしれません。\n\n「次へ」を押すと、なぞなすが気づいた内容を確認できます。</p><div class="modalactions"><button id="showNotice" type="button">次へ</button></div>');
    E("showNotice").addEventListener("click", () => showNotice(question, 0));
  }

  function showNotice(question, index = 0) {
    const fallbacks = {
      q1: [{ type: "text", content: "Q1は3問連続。二人の画面に共通するものを探そう。" }],
      q2: [{ type: "text", content: "二人の画面に流れる絵が示すひらがなのマスを黒くしよう。" }],
      q3: [{ type: "text", content: "自分の迷路は相手の画面にあります。相手の案内を聞いて、上下左右のボタンを押そう。" }],
      last: [{ type: "text", content: "お互いの絵を教えあって、違うところを確かめよう。" }]
    };
    const notices = [...(noticeConfig.sideB?.[question] || fallbacks[question] || [])];
    const outcome = getLinkedOutcome();
    const thirdQ1Answer = lastModel?.stage3?.answer || "";
    const q1HintAnswer = question === "q1" ? thirdQ1Answer : q3Answer;
    const q2HintAnswer = question === "q2" ? q2Model?.answer : q2SolvedAnswer;
    const differenceHint = window.Team1Last?.getFinalDifferenceHints(outcome)
      .map(item => `「${item.label}」`).join("、") || "？";
    notices.forEach((notice, noticeIndex) => {
      if (notice.type !== "text") return;
      notices[noticeIndex] = { ...notice, content: notice.content
        .split("{{Q1_ANSWER}}").join(q1HintAnswer || "？")
        .split("{{Q2_ANSWER}}").join(q2HintAnswer || "？")
        .split("{{Q3_ANSWER}}").join(outcome?.q3Answer || "？")
        .split("{{LAST_DIFFERENCES}}").join(differenceHint)
        .split("{{LAST_ANSWER}}").join(outcome?.finalAnswer || "？") };
    });
    if (!notices.length) return;
    const safeIndex = Math.max(0, Math.min(index, notices.length - 1));
    const notice = notices[safeIndex];
    const body = notice.type === "image"
      ? `<img class="noticeimg" src="${escapeHTML(notice.content)}" alt="気づいたこと">`
      : `<p class="noticecontent">${escapeHTML(notice.content)}</p>`;
    const count = notices.length > 1 ? ` ${safeIndex + 1}/${notices.length}` : "";
    const controls = notices.length > 1
      ? `<div class="modalactions"><button id="noticePrev" type="button" ${safeIndex === 0 ? "disabled" : ""}>戻る</button><button id="noticeNext" type="button" ${safeIndex === notices.length - 1 ? "disabled" : ""}>次へ</button></div>`
      : "";
    openModal(`<h2 id="modalTitle">気づく${count}</h2>${body}${controls}`);
    E("noticePrev")?.addEventListener("click", () => showNotice(question, safeIndex - 1));
    E("noticeNext")?.addEventListener("click", () => showNotice(question, safeIndex + 1));
  }

  function save() {
    localStorage.setItem(storageKey, JSON.stringify({ selected: [...selected], answer: q1Solved ? q2SolvedAnswer : E("answerInput").value, solved: q1Solved, roundKey: q2RoundKey }));
  }

  function restore() {
    try {
      const state = JSON.parse(localStorage.getItem(storageKey));
      if (!state) return;
      restoredQ2Progress = state;
      const isCurrentAnswer = window.Team1Last?.q2Answers?.some(item => item.answer === state.answer);
      q1Solved = Boolean(state.solved && isCurrentAnswer);
      q2SolvedAnswer = q1Solved ? (state.answer || "") : "";
      E("answerInput").value = q1Solved ? state.answer : "";
      if (q1Solved) setSubmittedAnswer("q1SubmittedAnswer", state.answer);
    } catch (_) { localStorage.removeItem(storageKey); }
  }

  function openModal(html, onClose = null) {
    modalCloseAction = onClose;
    E("modalContent").innerHTML = html;
    E("modal").classList.remove("hidden");
  }

  function closeModal() {
    E("modal").classList.add("hidden");
    const action = modalCloseAction;
    modalCloseAction = null;
    action?.();
  }

  async function openViewer(source) {
    if (!source) return;
    const viewer = E("viewer");
    E("viewerImage").src = source.src;
    E("viewerImage").alt = source.alt;
    viewer.classList.remove("hidden");
    viewer.classList.add("is-mobile-expanded");
    try {
      if (viewer.requestFullscreen) await viewer.requestFullscreen();
      if (screen.orientation?.lock) await screen.orientation.lock("landscape");
    } catch (_) { /* iPhone SafariではCSSによる横向き拡大を使用する */ }
  }

  async function closeViewer() {
    if (document.fullscreenElement === E("viewer") && document.exitFullscreen) {
      try { await document.exitFullscreen(); } catch (_) { /* 通常表示へ戻す処理は継続する */ }
    }
    E("viewer").classList.remove("is-mobile-expanded");
    E("viewer").classList.add("hidden");
  }

  function showQuestion(index) {
    if (index < 0 || index > 3 || (index === 1 && !q3Solved) || (index === 2 && !q1Solved) || (index === 3 && !q2Solved)) return;
    currentQuestion = index;
    E("questionLast").classList.toggle("hidden", index !== 0);
    E("question1").classList.toggle("hidden", index !== 1);
    E("q1AnswerCard").classList.toggle("hidden", index !== 1);
    E("question2").classList.toggle("hidden", index !== 2);
    E("q2AnswerCard").classList.toggle("hidden", index !== 2);
    E("questionFinal").classList.toggle("hidden", index !== 3);
    E("finalAnswerCard").classList.toggle("hidden", index !== 3);
    updateQuestionNav();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateQuestionNav() {
    const steps = [...document.querySelectorAll("[data-question]")];
    steps[1].disabled = !q3Solved;
    steps[2].disabled = !q1Solved;
    steps[3].disabled = !q2Solved;
    steps.forEach((button, index) => button.classList.toggle("current", index === currentQuestion));
    E("prevQuestionButton").disabled = currentQuestion === 0;
    E("nextQuestionButton").disabled = currentQuestion === 3 || (currentQuestion === 0 && !q3Solved) || (currentQuestion === 1 && !q1Solved) || (currentQuestion === 2 && !q2Solved);
  }

  function edgeKey(from, to) {
    const a = `${from[0]},${from[1]}`;
    const b = `${to[0]},${to[1]}`;
    return [a, b].sort().join("|");
  }

  function moveMaze(direction) {
    const delta = { up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1] }[direction];
    const next = [mazePosition[0] + delta[0], mazePosition[1] + delta[1]];
    if (next[0] < 0 || next[0] > 4 || next[1] < 0 || next[1] > 4) return;
    if (BLOCKED.has(edgeKey(mazePosition, next))) return;
    mazePosition = next;
    routeText += getMazeLetters()[`${next[0]},${next[1]}`] || "";
    renderMazeState();
    saveMaze();
  }

  function renderMazeState() {
    E("routeText").textContent = routeText;
    E("mazeMessage").textContent = "";
  }

  function checkMazeAnswer() {
    const outcome = getLinkedOutcome();
    if (!outcome || normalize(E("q2AnswerInput").value) !== outcome.q3Answer) {
      E("q2WrongMessage").textContent = "どうやらまちがっているようだ。";
      return;
    }
    E("q2WrongMessage").textContent = "";
    setSubmittedAnswer("q2SubmittedAnswer", E("q2AnswerInput").value);
    q2Solved = true;
    finalRule = createFinalRule();
    renderSpotDifference();
    saveMaze();
    updateQuestionNav();
    openModal(`<h2 id="modalTitle">正解！</h2><p>答えは「${outcome.q3Answer}」</p><p>Q3を解き明かした！</p><div class="modalactions"><button id="goLast" type="button">LASTへ</button></div>`);
    E("goLast").addEventListener("click", () => { closeModal(); showQuestion(3); });
  }

  function resetMaze() {
    mazePosition = [0, 4];
    routeText = "";
    localStorage.removeItem(mazeStorageKey);
    renderMazeState();
    saveMaze();
  }

  function saveMaze() {
    localStorage.setItem(mazeStorageKey, JSON.stringify({ position: mazePosition, routeText, answer: E("q2AnswerInput")?.value || "", solved: q2Solved, outcomeKey: getLinkedOutcomeKey() }));
  }

  function restoreMaze() {
    try {
      const saved = JSON.parse(localStorage.getItem(mazeStorageKey));
      if (saved) {
        mazePosition = saved.position || [0, 4];
        routeText = saved.routeText || "";
        E("q2AnswerInput").value = saved.answer || "";
        q2Solved = Boolean(saved.solved);
        if (q2Solved) setSubmittedAnswer("q2SubmittedAnswer", saved.answer || "");
      }
    } catch (_) { localStorage.removeItem(mazeStorageKey); }
    renderMazeState();
  }

  function saveQ3() {
    localStorage.setItem(q3StorageKey, JSON.stringify({
      solved: q3Solved,
      answer: q3Answer,
      submittedAnswer: q3Solved && q3Answer ? q3Answer : (E("lastAnswerInput")?.value || ""),
      outcomeKey: getLinkedOutcomeKey(),
      roundKey: lastRoundKey,
      stage: q1RoundStage
    }));
  }

  function restoreQ3() {
    try {
      const saved = JSON.parse(localStorage.getItem(q3StorageKey));
      if (!saved) return;
      if (!saved.solved) {
        restoredQ1Progress = saved;
        return;
      }
      if (!window.Team1Last?.q1Marks?.some(mark => mark.answer === saved.answer)) return;
      q3Solved = true;
      q1RoundStage = 2;
      q3Answer = saved.answer;
      E("lastAnswerInput").value = saved.answer;
      setSubmittedAnswer("lastSubmittedAnswer", saved.answer);
      const outcome = getLinkedOutcome();
      if (q2Solved && outcome && normalize(E("q2AnswerInput").value) !== outcome.q3Answer) {
        q2Solved = false;
        mazePosition = [0, 4];
        routeText = "";
        E("q2AnswerInput").value = "";
        setSubmittedAnswer("q2SubmittedAnswer", "");
        renderMazeState();
        saveMaze();
      }
      finalRule = createFinalRule();
      renderSpotDifference();
    } catch (_) {
      localStorage.removeItem(q3StorageKey);
    }
  }

  async function initLast() {
    await syncLastClock(true);
    const duration = Math.max(10, Number(lastConfig.roundDurationSeconds) || 60);
    E("roundProgress").max = duration;
    updateLastRound();
    window.setInterval(updateLastRound, 250);
    window.setInterval(() => syncLastClock(false), 60000);
  }

  async function syncLastClock(loadConfig) {
    const started = Date.now();
    try {
      const response = await fetch("last-config.json", { cache: "no-store" });
      const received = Date.now();
      if (response.ok && loadConfig) lastConfig = await response.json();
      const serverDate = Date.parse(response.headers.get("Date") || "");
      if (Number.isFinite(serverDate)) {
        clockOffsetMs = serverDate + 500 - ((started + received) / 2);
      }
    } catch (_) { /* Fall back to the device clock when offline. */ }
  }

  function updateLastRound() {
    const duration = Math.max(10, Number(lastConfig.roundDurationSeconds) || 60);
    const nowSeconds = (Date.now() + clockOffsetMs) / 1000;
    const roundKey = Math.floor(nowSeconds / duration);
    const remaining = duration - (nowSeconds - roundKey * duration);
    E("roundProgress").value = remaining;
    const shown = Math.max(0, Math.ceil(remaining));
    E("roundTimeText").textContent = `残り ${Math.floor(shown / 60)}:${String(shown % 60).padStart(2, "0")}`;
    const q2Duration = 120;
    const currentQ2RoundKey = Math.floor(nowSeconds / q2Duration);
    const q2Remaining = q2Duration - (nowSeconds - currentQ2RoundKey * q2Duration);
    const q2Shown = Math.max(0, Math.ceil(q2Remaining));
    E("q2RoundProgress").max = q2Duration;
    E("q2RoundProgress").value = q2Remaining;
    E("q2RoundTimeText").textContent = `残り ${Math.floor(q2Shown / 60)}:${String(q2Shown % 60).padStart(2, "0")}`;
    updateQ2Round(currentQ2RoundKey);
    if (roundKey === lastRoundKey) return;
    lastRoundKey = roundKey;
    lastModel = window.Team1Last.createQ1(roundKey);
    if (!q3Solved) {
      q1RoundStage = restoredQ1Progress?.roundKey === roundKey
        ? Math.max(0, Math.min(2, Number(restoredQ1Progress.stage) || 0))
        : 0;
      restoredQ1Progress = null;
      E("lastAnswerInput").value = "";
      E("lastWrongMessage").textContent = "";
      E("lastWrongMessage").classList.remove("is-correct");
      saveQ3();
    } else {
      q1RoundStage = 0;
      E("lastAnswerInput").value = "";
      E("lastWrongMessage").textContent = "";
      E("lastWrongMessage").classList.remove("is-correct");
    }
    renderLastRound();
  }

  function updateQ2Round(roundKey) {
    if (roundKey === q2RoundKey) return;
    q2RoundKey = roundKey;
    q2Model = window.Team1Last.createQ2(roundKey);
    selected = restoredQ2Progress?.roundKey === roundKey
      ? new Set(restoredQ2Progress.selected || [])
      : new Set();
    restoredQ2Progress = null;
    E("answerInput").value = "";
    E("wrongMessage").textContent = "";
    renderGrid();
    setupImages();
    if (!q1Solved) save();
  }

  function renderLastRound() {
    if (!lastModel) return;
    const challenge = lastModel[`stage${q1RoundStage + 1}`];
    const items = challenge.sideB;
    const stage = E("zodiacStage");
    stage.querySelectorAll(".q1-moving-sprite").forEach(element => element.remove());
    lastSprites = [];
    E("q1StagePrompt").textContent = challenge.prompt;
    E("q1StageStatus").textContent = `${q1RoundStage + 1} / 3`;
    const random = window.Team1Last.randomFrom(challenge.motionSeed.sideB);
    const baseSizeLevels = [108, 132, 156, 180, 204];
    const sizeLevels = window.matchMedia("(max-width: 700px)").matches
      ? baseSizeLevels.map(size => size / 2)
      : baseSizeLevels;
    const balancedSizes = items.map((_, index) => sizeLevels[index % sizeLevels.length]);
    shuffleWith(balancedSizes, random);

    items.forEach((item, index) => {
      const isImage = q1RoundStage === 0 || Boolean(item?.file);
      const element = isImage ? document.createElement("img") : document.createElement("span");
      if (q1RoundStage === 0) {
        element.src = `images/zodiac/${window.Team1Last.animals[item]}.png`;
        element.alt = window.Team1Last.animalNames[item];
      } else if (item?.file) {
        element.src = `images/q1/homophones/${item.file}`;
        element.alt = item.alt;
      } else {
        element.textContent = q1RoundStage === 1 ? item.icon : item;
        element.setAttribute("aria-label", q1RoundStage === 1 ? item.alt : `${item}の記号`);
      }
      element.className = `q1-moving-sprite ${isImage ? "zodiac-sprite" : "q1-emoji-sprite"}`;
      const angle = random() * Math.PI * 2;
      const speed = 0.0825;
      const sprite = {
        element,
        x: random(), y: random(),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: balancedSizes[index],
        sizePhase: random() * Math.PI * 2,
        sizePeriod: 0.8 + random() * 1.8,
        sizeMin: 0.78 + random() * 0.1,
        sizeMax: 1.12 + random() * 0.2,
        index
      };
      element.style.width = `${sprite.size}px`;
      element.style.height = `${sprite.size}px`;
      element.style.fontSize = `${Math.round(sprite.size * 0.78)}px`;
      element.style.zIndex = String(2 + Math.floor(random() * 20));
      stage.appendChild(element);
      lastSprites.push(sprite);
    });
  }

  function shuffleWith(values, random) {
    for (let i = values.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [values[i], values[j]] = [values[j], values[i]];
    }
  }

  function animateZodiac(now) {
    const delta = Math.min(0.05, Math.max(0, (now - lastFrameTime) / 1000));
    lastFrameTime = now;
    const stage = E("zodiacStage");
    const width = stage?.clientWidth || 1;
    const height = stage?.clientHeight || 1;
    const elapsed = performance.now() / 1000;
    lastSprites.forEach(sprite => {
      sprite.x += sprite.vx * delta;
      sprite.y += sprite.vy * delta;
      if (sprite.x < 0) { sprite.x = 0; sprite.vx = Math.abs(sprite.vx); }
      if (sprite.x > 1) { sprite.x = 1; sprite.vx = -Math.abs(sprite.vx); }
      if (sprite.y < 0) { sprite.y = 0; sprite.vy = Math.abs(sprite.vy); }
      if (sprite.y > 1) { sprite.y = 1; sprite.vy = -Math.abs(sprite.vy); }
      const drawX = Math.round(sprite.x * Math.max(0, width - sprite.size));
      const drawY = Math.round(sprite.y * Math.max(0, height - sprite.size));
      const wave = 0.5 + 0.5 * Math.sin(sprite.sizePhase + elapsed * Math.PI * 2 / sprite.sizePeriod);
      const targetScale = sprite.sizeMin + (sprite.sizeMax - sprite.sizeMin) * wave;
      sprite.element.style.transform = `translate3d(${drawX}px, ${drawY}px, 0) scale(${targetScale.toFixed(3)})`;
    });
    requestAnimationFrame(animateZodiac);
  }

  function checkLastAnswer() {
    updateLastRound();
    const rawAnswer = String(E("lastAnswerInput").value || "").trim();
    const submittedAnswer = normalize(rawAnswer);
    const challenge = lastModel?.[`stage${q1RoundStage + 1}`];
    E("lastWrongMessage").classList.remove("is-correct");
    if (!/^[ぁ-ゖァ-ヶー]+$/.test(rawAnswer)) {
      E("lastWrongMessage").textContent = "ひらがなで入力してください。";
      E("lastAnswerInput").value = "";
      E("lastAnswerInput").focus();
      return;
    }
    if (!challenge?.aliases.includes(submittedAnswer)) {
      E("lastWrongMessage").textContent = "どうやら違うようだ。";
      E("lastAnswerInput").value = "";
      E("lastAnswerInput").focus();
      return;
    }
    if (q1RoundStage < 2) {
      q1RoundStage += 1;
      E("lastAnswerInput").value = "";
      E("lastWrongMessage").classList.add("is-correct");
      E("lastWrongMessage").textContent = `正解！ 第${q1RoundStage + 1}問へ`;
      saveQ3();
      renderLastRound();
      E("lastAnswerInput").focus();
      return;
    }
    E("lastWrongMessage").textContent = "";
    E("lastWrongMessage").classList.remove("is-correct");
    setSubmittedAnswer("lastSubmittedAnswer", challenge.answer);
    q3Solved = true;
    const previousOutcomeKey = getLinkedOutcomeKey();
    q3Answer = challenge.answer;
    const answerChanged = resetQ3WhenOutcomeChanges(previousOutcomeKey);
    saveQ3();
    updateQuestionNav();
    openModal(`<h2 id="modalTitle">正解！</h2><p>答えは「${challenge.answer}」</p><p>Q1を解き明かした！</p>${answerChanged ? "<p>Q3の答えが変わったようだ！</p>" : ""}<div class="modalactions"><button id="goFinal" type="button">${answerChanged ? "Q3へ" : "Q2へ"}</button></div>`, answerChanged ? () => showQuestion(2) : null);
    E("goFinal").addEventListener("click", () => { closeModal(); if (!answerChanged) showQuestion(1); });
  }

  function renderSpotDifference() {
    const container = E("spotDifferenceRows");
    container.innerHTML = "";
    if (!finalRule) {
      E("finalLengthHint").textContent = "";
      return;
    }
    E("finalLengthHint").textContent = `答えは${[...finalRule.answer].length}文字`;
    const sourceQuestions = [2, 3, 1];
    ["A", "B", "C"].forEach((rowName, rowIndex) => {
      const row = document.createElement("div");
      row.className = "spot-code-row";
      const circle = document.createElement("img");
      const sourceQuestion = sourceQuestions[rowIndex];
      circle.className = `spot-source-circle source-q${sourceQuestion}`;
      circle.src = `images/last/q${sourceQuestion}-circle.png`;
      circle.alt = `Q${sourceQuestion}`;
      row.appendChild(circle);
      const imageRow = document.createElement("div");
      imageRow.className = "spot-code-grid";
      for (let column = 1; column <= 5; column++) {
        const tile = document.createElement("div");
        tile.className = "spot-tile";
        const image = document.createElement("img");
        const isDifference = finalRule.positions[rowIndex].includes(column);
        image.src = `images/last/${isDifference ? "e/" : ""}${rowName}${column}.png`;
        image.alt = `${rowName}${column}`;
        tile.appendChild(image);
        imageRow.appendChild(tile);
      }
      row.appendChild(imageRow);
      container.appendChild(row);
    });
    E("finalAnswerInput").value = "";
    E("finalWrongMessage").textContent = "";
    setSubmittedAnswer("finalSubmittedAnswer", "");
    alignSpotGridLines();
  }

  function checkFinalAnswer() {
    if (!finalRule || normalize(E("finalAnswerInput").value) !== finalRule.answer) {
      E("finalWrongMessage").textContent = "どうやら違うようだ。";
      return;
    }
    E("finalWrongMessage").textContent = "";
    setSubmittedAnswer("finalSubmittedAnswer", E("finalAnswerInput").value);
    window.trackGameEvent?.("game_clear", "team1_sideB");
    showClear();
  }

  function setSubmittedAnswer(id, value) {
    const element = E(id);
    const answer = String(value || "").trim();
    element.textContent = answer ? `あなたの答え：${answer}` : "";
    element.classList.toggle("hidden", !answer);
  }

  async function loadClearConfig() {
    try {
      const response = await fetch("clear-config.json", { cache: "no-store" });
      if (response.ok) clearConfig = await response.json();
    } catch (_) { /* Use fallback copy if the JSON cannot be loaded. */ }
  }

  function escapeHTML(value) {
    return String(value || "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  }

  function showClear() {
    const ending = clearConfig.sideB || {};
    const image = ending.image || "images/sideB/clear-nasu.png";
    const message = ending.message || "なぞなすとして、二人で部屋から脱出した！";
    const postText = ending.postText || "『協力しないと出られない部屋からの脱出』をクリアしました！";
    const shareUrl = new URL(".", location.href).href;
    const postUrl = `https://x.com/intent/post?text=${encodeURIComponent(`${postText}\n${shareUrl}`)}`;
    openModal(`<div class="clear"><h1>CLEAR</h1><h2>脱出成功！</h2><p class="submitted">あなたの答え：${escapeHTML(E("finalAnswerInput").value)}</p><img class="clearimg" src="${escapeHTML(image)}" alt="なぞなすのクリア画像"><p>${escapeHTML(message)}</p><a class="tweet" href="${postUrl}" target="_blank" rel="noopener noreferrer">クリアポスト</a><p class="thanks">THANK YOU FOR PLAYING</p><div class="clear-home-link"><a href="../../">なぞねぎ脱出へ</a></div></div>`);
  }
})();
