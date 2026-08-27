(() => {
  "use strict";

  const LETTERS = ["た", "も", "お", "じ", "と", "ど", "ち", "ゅ", "う", "こ", "ふ", "し", "ま", "て", "ん"];
  const RUNNERS = [
    { id: "A", file: "a-tanuki.png", duration: 5 },
    { id: "B", file: "b-knight.png", duration: 0.5 },
    { id: "C", file: "c-dress.png", duration: 0.5 },
    { id: "D", file: "d-knife.png", duration: 0.3 }
  ];
  const CYCLE_SECONDS = 5;
  const CYCLE_MS = CYCLE_SECONDS * 1000;
  const pageSide = location.pathname.split("/").pop().replace(/\.html$/i, "") || "sideA";
  const assetRoot = `images/${pageSide}/`;
  const storageKey = `neginazo_team1_${pageSide}_q1`;
  const mazeStorageKey = `neginazo_team1_${pageSide}_q2`;
  const E = id => document.getElementById(id);
  let selected = new Set();
  let q1Solved = false;
  let q2Solved = false;
  let q3Solved = false;
  let q3Answer = "";
  let finalAnswer = "";
  let currentQuestion = 0;
  let mazePosition = [0, 0];
  let routeText = "";
  let cycleTimer;
  let lastConfig = { roundDurationSeconds: 60, blackCurtainEnabled: true, sizePulseStartSeconds: 0, speedUpStartSeconds: 30 };
  let clearConfig = {};
  let noticeConfig = {};
  let clockOffsetMs = 0;
  let lastRoundKey = null;
  let lastModel = null;
  let lastSprites = [];
  let lastFrameTime = performance.now();
  let curtainReveal = 0;
  let lastCurtainClick = 0;

  const MAZE_LETTERS = { "0,3": "み", "1,0": "く", "2,1": "う", "2,4": "し", "3,3": "た", "4,3": "よ" };
  const BLOCKED = new Set([
    "0,1|1,1", "1,0|2,0", "1,1|2,1", "1,3|2,3", "2,1|3,1", "3,2|4,2", "3,3|4,3",
    "1,2|1,3", "2,2|2,3", "4,0|4,1"
  ]);

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    window.trackGameEvent?.("game_start", "team1_sideA");
    buildGrid();
    restore();
    setupImages();
    startCycle();
    E("answerButton").addEventListener("click", checkAnswer);
    E("answerInput").addEventListener("keydown", event => { if (event.key === "Enter") checkAnswer(); });
    E("noticeButton").addEventListener("click", () => showNoticeConfirm("q1"));
    document.querySelectorAll(".progress-reset-button").forEach(button => button.addEventListener("click", showResetConfirm));
    E("laneFullscreenButton").addEventListener("click", openLaneFullscreen);
    E("laneFullscreenClose").addEventListener("click", closeLaneFullscreen);
    document.addEventListener("fullscreenchange", updateLaneFullscreen);
    E("spotFullscreenButton").addEventListener("click", openSpotFullscreen);
    E("spotFullscreenClose").addEventListener("click", closeSpotFullscreen);
    document.addEventListener("fullscreenchange", updateSpotFullscreen);
    E("q2NoticeButton").addEventListener("click", () => showNoticeConfirm("q2"));
    document.querySelectorAll("[data-move]").forEach(button => button.addEventListener("click", () => moveMaze(button.dataset.move)));
    E("mazeResetButton").addEventListener("click", resetMaze);
    E("q2AnswerButton").addEventListener("click", checkMazeAnswer);
    E("q2AnswerInput").addEventListener("keydown", event => { if (event.key === "Enter") checkMazeAnswer(); });
    E("q2AnswerInput").addEventListener("input", saveMaze);
    E("q3NoticeButton").addEventListener("click", () => showNoticeConfirm("q3"));
    E("finalNoticeButton").addEventListener("click", () => showNoticeConfirm("last"));
    E("lastAnswerButton").addEventListener("click", checkLastAnswer);
    E("lastAnswerInput").addEventListener("keydown", event => { if (event.key === "Enter") checkLastAnswer(); });
    E("finalAnswerButton").addEventListener("click", checkFinalAnswer);
    E("finalAnswerInput").addEventListener("keydown", event => { if (event.key === "Enter") checkFinalAnswer(); });
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
    updateQuestionNav();
    initLast();
    loadClearConfig();
    loadNoticeConfig();
    requestAnimationFrame(animateZodiac);
    window.setInterval(decayCurtain, 100);
  }

  function buildGrid() {
    LETTERS.forEach((letter, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "letter-cell";
      button.textContent = letter;
      button.dataset.index = index;
      button.setAttribute("aria-label", `${letter}のマス`);
      button.addEventListener("click", () => toggleCell(index));
      E("letterGrid").appendChild(button);
    });
  }

  function toggleCell(index) {
    if (selected.has(index)) selected.delete(index); else selected.add(index);
    renderGrid();
    save();
  }

  function renderGrid() {
    document.querySelectorAll(".letter-cell").forEach(button => {
      const isSelected = selected.has(Number(button.dataset.index));
      button.classList.toggle("is-black", isSelected);
      button.setAttribute("aria-pressed", String(isSelected));
    });
  }

  function setupImages() {
    RUNNERS.forEach(runner => {
      const image = document.querySelector(`[data-runner="${runner.id}"]`);
      image.src = `${assetRoot}${runner.file}`;
    });
  }

  function startCycle() {
    runCycle();
    cycleTimer = window.setInterval(runCycle, CYCLE_MS);
  }

  function runCycle() {
    RUNNERS.forEach(runner => {
      const latestStart = Math.max(0, CYCLE_SECONDS - runner.duration);
      const delaySeconds = runner.id === "A" ? 0 : Math.random() * latestStart;
      window.setTimeout(() => animateRunner(runner), delaySeconds * 1000);
    });
  }

  function animateRunner(runner) {
    const lane = E("imageLane");
    const image = document.querySelector(`[data-runner="${runner.id}"]`);
    const imageWidth = image.getBoundingClientRect().width || 72;
    image.getAnimations().forEach(animation => animation.cancel());
    image.animate(
      [
        { transform: `translateX(${lane.clientWidth + imageWidth}px)`, opacity: 1 },
        { transform: `translateX(${-imageWidth}px)`, opacity: 1 }
      ],
      { duration: runner.duration * 1000, easing: "linear", fill: "none" }
    );
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

  function checkAnswer() {
    const answer = normalize(E("answerInput").value);
    if (!["hit", "ひっと"].includes(answer)) {
      E("wrongMessage").textContent = "どうやら違うようだ。";
      return;
    }
    E("wrongMessage").textContent = "";
    setSubmittedAnswer("q1SubmittedAnswer", E("answerInput").value);
    q1Solved = true;
    save(true);
    updateQuestionNav();
    openModal('<h2 id="modalTitle">正解！</h2><p>Q1を解き明かした！</p><div class="modalactions"><button id="goQ2" type="button">Q2へ</button></div>');
    E("goQ2").addEventListener("click", () => { closeModal(); showQuestion(1); });
  }

  function normalize(value) {
    return String(value || "").trim().toLowerCase()
      .replace(/[Ａ-Ｚａ-ｚ０-９]/g, char => String.fromCharCode(char.charCodeAt(0) - 0xFEE0))
      .replace(/[ァ-ン]/g, char => String.fromCharCode(char.charCodeAt(0) - 0x60))
      .replace(/\s+/g, "");
  }

  async function loadNoticeConfig() {
    try {
      const response = await fetch("notice-config.json", { cache: "no-store" });
      if (response.ok) noticeConfig = await response.json();
    } catch { /* Use fallback notices. */ }
  }

  function showNoticeConfirm(question) {
    openModal('<h2 id="modalTitle">気づく</h2><img class="thinking-image" src="../../image/kanngaeru.png" alt="考えているなぞねぎ"><p class="noticecontent">なぞねぎが周囲をもう一度見回します。\n\n新しい発見があるかもしれません。\n\n「次へ」を押すと、なぞねぎが気づいた内容を確認できます。</p><div class="modalactions"><button id="showNotice" type="button">次へ</button></div>');
    E("showNotice").addEventListener("click", () => showNotice(question, 0));
  }

  function showNotice(question, index = 0) {
    const fallbacks = {
      q1: [{ type: "text", content: "まずは二人で、お互いの画面に流れる絵について話してみよう。" }],
      q2: [{ type: "text", content: "自分の迷路は相手の画面にあります。相手の案内を聞いて、上下左右のボタンを押そう。" }],
      last: [{ type: "text", content: "指定された動物が、それぞれ何匹いるか数えてみよう。" }]
    };
    const notices = noticeConfig.sideA?.[question] || fallbacks[question] || [];
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

  function openViewer(source) {
    if (!source) return;
    E("viewerImage").src = source.src;
    E("viewerImage").alt = source.alt;
    E("viewer").classList.remove("hidden");
  }

  function closeViewer() { E("viewer").classList.add("hidden"); }

  function showResetConfirm() {
    openModal('<h2 id="modalTitle">進捗リセット</h2><p>すべての問題の進捗と回答を最初の状態に戻しますか？</p><div class="modalactions"><button id="doReset" type="button">すべてリセットする</button><button id="cancelReset" type="button">キャンセル</button></div>');
    E("doReset").addEventListener("click", resetAllProgress);
    E("cancelReset").addEventListener("click", closeModal);
  }

  function resetAllProgress() {
    selected.clear();
    q1Solved = false;
    q2Solved = false;
    q3Solved = false;
    q3Answer = "";
    finalAnswer = "";
    currentQuestion = 0;
    mazePosition = [0, 0];
    routeText = "";
    E("answerInput").value = "";
    E("wrongMessage").textContent = "";
    E("q2AnswerInput").value = "";
    E("q2WrongMessage").textContent = "";
    E("lastAnswerInput").value = "";
    E("lastWrongMessage").textContent = "";
    E("finalAnswerInput").value = "";
    E("finalWrongMessage").textContent = "";
    E("negiSpotGrid").innerHTML = "";
    ["q1SubmittedAnswer", "q2SubmittedAnswer", "lastSubmittedAnswer", "finalSubmittedAnswer"].forEach(id => setSubmittedAnswer(id, ""));
    localStorage.removeItem(storageKey);
    localStorage.removeItem(mazeStorageKey);
    renderGrid();
    renderMazeState();
    showQuestion(0);
    closeModal();
  }

  function save(solved = q1Solved) {
    localStorage.setItem(storageKey, JSON.stringify({ selected: [...selected], answer: E("answerInput")?.value || "", solved }));
  }

  function restore() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (!saved) return;
      selected = new Set(saved.selected || []);
      q1Solved = Boolean(saved.solved);
      E("answerInput").value = saved.answer || "";
      if (q1Solved) setSubmittedAnswer("q1SubmittedAnswer", saved.answer || "");
      renderGrid();
    } catch { /* Ignore invalid saved data. */ }
  }

  function openModal(content) {
    E("modalContent").innerHTML = content;
    E("modal").classList.remove("hidden");
  }

  function closeModal() { E("modal").classList.add("hidden"); }

  function showQuestion(index) {
    if (index < 0 || index > 3 || (index === 1 && !q1Solved) || (index === 2 && !q2Solved) || (index === 3 && !q3Solved)) return;
    currentQuestion = index;
    E("question1").classList.toggle("hidden", index !== 0);
    E("q1AnswerCard").classList.toggle("hidden", index !== 0);
    E("question2").classList.toggle("hidden", index !== 1);
    E("q2AnswerCard").classList.toggle("hidden", index !== 1);
    E("questionLast").classList.toggle("hidden", index !== 2);
    E("lastAnswerCard").classList.toggle("hidden", index !== 2);
    E("questionFinal").classList.toggle("hidden", index !== 3);
    E("finalAnswerCard").classList.toggle("hidden", index !== 3);
    updateQuestionNav();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateQuestionNav() {
    const steps = [...document.querySelectorAll("[data-question]")];
    steps[1].disabled = !q1Solved;
    steps[2].disabled = !q2Solved;
    steps[3].disabled = !q3Solved;
    steps.forEach((button, index) => button.classList.toggle("current", index === currentQuestion));
    E("prevQuestionButton").disabled = currentQuestion === 0;
    E("nextQuestionButton").disabled = currentQuestion === 3 || (currentQuestion === 0 && !q1Solved) || (currentQuestion === 1 && !q2Solved) || (currentQuestion === 2 && !q3Solved);
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
    routeText += MAZE_LETTERS[`${next[0]},${next[1]}`] || "";
    renderMazeState();
    saveMaze();
  }

  function renderMazeState() {
    E("routeText").textContent = routeText;
    E("mazeMessage").textContent = "";
  }

  function checkMazeAnswer() {
    if (normalize(E("q2AnswerInput").value) !== "はたらく") {
      E("q2WrongMessage").textContent = "どうやらまちがっているようだ。";
      return;
    }
    E("q2WrongMessage").textContent = "";
    setSubmittedAnswer("q2SubmittedAnswer", E("q2AnswerInput").value);
    q2Solved = true;
    saveMaze();
    updateQuestionNav();
    openModal('<h2 id="modalTitle">正解！</h2><p>Q2を解き明かした！</p><div class="modalactions"><button id="goLast" type="button">Q3へ</button></div>');
    E("goLast").addEventListener("click", () => { closeModal(); showQuestion(2); });
  }

  function resetMaze() {
    mazePosition = [0, 0];
    routeText = "";
    localStorage.removeItem(mazeStorageKey);
    renderMazeState();
    saveMaze();
  }

  function saveMaze() {
    localStorage.setItem(mazeStorageKey, JSON.stringify({ position: mazePosition, routeText, answer: E("q2AnswerInput")?.value || "", solved: q2Solved }));
  }

  function restoreMaze() {
    try {
      const saved = JSON.parse(localStorage.getItem(mazeStorageKey));
      if (saved) {
        mazePosition = saved.position || [0, 0];
        routeText = saved.routeText || "";
        E("q2AnswerInput").value = saved.answer || "";
        q2Solved = Boolean(saved.solved);
        if (q2Solved) setSubmittedAnswer("q2SubmittedAnswer", saved.answer || "");
      }
    } catch { /* Ignore invalid saved data. */ }
    renderMazeState();
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
    } catch { /* Fall back to the device clock when offline. */ }
  }

  function updateLastRound() {
    const duration = Math.max(10, Number(lastConfig.roundDurationSeconds) || 60);
    const nowSeconds = (Date.now() + clockOffsetMs) / 1000;
    const roundKey = Math.floor(nowSeconds / duration);
    const remaining = duration - (nowSeconds - roundKey * duration);
    E("roundProgress").value = remaining;
    const shown = Math.max(0, Math.ceil(remaining));
    E("roundTimeText").textContent = `残り ${Math.floor(shown / 60)}:${String(shown % 60).padStart(2, "0")}`;
    if (roundKey === lastRoundKey) return;
    lastRoundKey = roundKey;
    lastModel = window.Team1Last.create(roundKey);
    renderLastRound();
  }

  function renderLastRound() {
    const side = lastModel[pageSide] || lastModel.sideA;
    const stage = E("zodiacStage");
    stage.innerHTML = "";
    lastSprites = [];
    const random = window.Team1Last.randomFrom(side.motionSeed);
    const sizeLevels = [36, 44, 52, 60, 68];
    const balancedSizes = side.tokens.map((_, index) => sizeLevels[index % sizeLevels.length]);
    const speedLevels = [0.024, 0.042, 0.060, 0.078, 0.096];
    const balancedSpeeds = side.tokens.map((_, index) => speedLevels[index % speedLevels.length]);
    for (let i = balancedSizes.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [balancedSizes[i], balancedSizes[j]] = [balancedSizes[j], balancedSizes[i]];
    }
    for (let i = balancedSpeeds.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [balancedSpeeds[i], balancedSpeeds[j]] = [balancedSpeeds[j], balancedSpeeds[i]];
    }
    side.tokens.forEach((animalIndex, index) => {
      const image = document.createElement("img");
      image.src = `images/zodiac/${lastModel.animals[animalIndex]}.png`;
      image.alt = lastModel.animalNames[animalIndex];
      image.className = "zodiac-sprite";
      const angle = random() * Math.PI * 2;
      const speed = balancedSpeeds[index];
      const sprite = {
        element: image,
        x: random(), y: random(),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: balancedSizes[index],
        sizePhase: random() * Math.PI * 2,
        sizePeriod: 0.8 + random() * 1.8,
        sizeMin: 0.72 + random() * 0.16,
        sizeMax: 1.12 + random() * 0.28,
        index
      };
      image.style.width = `${sprite.size}px`;
      image.style.zIndex = String(1 + Math.floor(random() * 20));
      stage.appendChild(image);
      lastSprites.push(sprite);
    });

    curtainReveal = 0;
    if (lastConfig.blackCurtainEnabled !== false) {
      const curtain = document.createElement("button");
      curtain.id = "zodiacCurtain";
      curtain.className = "zodiac-curtain";
      curtain.type = "button";
      curtain.textContent = "100";
      curtain.setAttribute("aria-label", "押して黒い覆いの透過度を下げる");
      curtain.addEventListener("click", revealCurtain);
      stage.appendChild(curtain);
      renderCurtain();
    }

    E("lastTargets").innerHTML = "";
    side.targetAnimalIndexes.forEach((animalIndex, index) => {
      const wrapper = document.createElement("div");
      wrapper.className = "last-target";
      wrapper.innerHTML = `<span>${side.targetPositions?.[index] || index + 1}</span><img src="images/zodiac/${lastModel.animals[animalIndex]}.png" alt="${lastModel.animalNames[animalIndex]}">`;
      E("lastTargets").appendChild(wrapper);
    });
    E("lastAnswerInput").value = "";
    E("lastWrongMessage").textContent = "";
  }

  function animateZodiac(now) {
    const delta = Math.min(0.05, Math.max(0, (now - lastFrameTime) / 1000));
    lastFrameTime = now;
    const stage = E("zodiacStage");
    const width = stage?.clientWidth || 1;
    const height = stage?.clientHeight || 1;
    const duration = Math.max(10, Number(lastConfig.roundDurationSeconds) || 60);
    const roundElapsed = lastRoundKey === null
      ? 0
      : (Date.now() + clockOffsetMs) / 1000 - lastRoundKey * duration;
    const configuredPulseStart = Number(lastConfig.sizePulseStartSeconds);
    const pulseStart = Number.isFinite(configuredPulseStart) ? configuredPulseStart : 0;
    const pulseElapsed = Math.max(0, roundElapsed - pulseStart);
    const pulseBlend = Math.min(1, pulseElapsed);
    const speedUpStart = Number(lastConfig.speedUpStartSeconds) || 30;
    const speedMultiplier = roundElapsed >= speedUpStart
      ? Math.max(1, Number(lastConfig.speedMultiplier) || 1.5)
      : 1;
    lastSprites.forEach(sprite => {
      sprite.x += sprite.vx * delta * speedMultiplier;
      sprite.y += sprite.vy * delta * speedMultiplier;
      if (sprite.x < 0) { sprite.x = 0; sprite.vx = Math.abs(sprite.vx); }
      if (sprite.x > 1) { sprite.x = 1; sprite.vx = -Math.abs(sprite.vx); }
      if (sprite.y < 0) { sprite.y = 0; sprite.vy = Math.abs(sprite.vy); }
      if (sprite.y > 1) { sprite.y = 1; sprite.vy = -Math.abs(sprite.vy); }
      const drawX = Math.round(sprite.x * Math.max(0, width - sprite.size));
      const drawY = Math.round(sprite.y * Math.max(0, height - sprite.size));
      const wave = 0.5 + 0.5 * Math.sin(sprite.sizePhase + pulseElapsed * Math.PI * 2 / sprite.sizePeriod);
      const targetScale = sprite.sizeMin + (sprite.sizeMax - sprite.sizeMin) * wave;
      const scale = pulseElapsed > 0 ? 1 + (targetScale - 1) * pulseBlend : 1;
      sprite.element.style.transform = `translate3d(${drawX}px, ${drawY}px, 0) scale(${scale.toFixed(3)})`;
    });
    requestAnimationFrame(animateZodiac);
  }

  function revealCurtain() {
    curtainReveal = Math.min(1, curtainReveal + 0.03);
    lastCurtainClick = performance.now();
    renderCurtain();
  }

  function decayCurtain() {
    if (curtainReveal <= 0 || performance.now() - lastCurtainClick < 100) return;
    curtainReveal = Math.max(0, curtainReveal - 0.02);
    renderCurtain();
  }

  function renderCurtain() {
    const curtain = E("zodiacCurtain");
    if (!curtain) return;
    const opacity = Math.max(0, Math.min(1, 1 - curtainReveal));
    curtain.style.backgroundColor = `rgba(0, 0, 0, ${opacity})`;
    curtain.textContent = String(Math.round(opacity * 100));
  }

  function checkLastAnswer() {
    const side = lastModel?.[pageSide] || lastModel?.sideA;
    const submittedAnswer = normalize(E("lastAnswerInput").value);
    if (!side || submittedAnswer !== side.answer) {
      const isAnswerFromAnotherTime = window.Team1Last?.answers?.some(answer => normalize(answer) === submittedAnswer);
      E("lastWrongMessage").textContent = isAnswerFromAnotherTime
        ? "その答えはもう正解ではないようだ。"
        : "どうやら違うようだ。";
      return;
    }
    E("lastWrongMessage").textContent = "";
    setSubmittedAnswer("lastSubmittedAnswer", E("lastAnswerInput").value);
    q3Solved = true;
    q3Answer = side.answer;
    renderNegiFinalCards();
    updateQuestionNav();
    openModal('<h2 id="modalTitle">正解！</h2><p>Q3を解き明かした！</p><div class="modalactions"><button id="goFinal" type="button">LASTへ</button></div>');
    E("goFinal").addEventListener("click", () => { closeModal(); showQuestion(3); });
  }

  function renderNegiFinalCards() {
    const characters = [...q3Answer];
    const useOpenedAnswer = characters.includes("い");
    const q3Character = useOpenedAnswer ? "い" : "く";
    const q3Position = characters.indexOf(q3Character) + 1;
    finalAnswer = useOpenedAnswer ? "ひらいた" : "ひらく";

    const fixedNumbers = new Map([
      ["A1", 1],
      ["B3", 2],
      [`C${q3Position}`, 3]
    ]);
    if (useOpenedAnswer) fixedNumbers.set("B2", 4);

    const random = window.Team1Last.randomFrom(window.Team1Last.hash(`team1:final-cards:${q3Answer}:${Date.now()}:${performance.now()}`));
    const grid = E("negiSpotGrid");
    grid.innerHTML = "";
    ["A", "B", "C"].forEach(rowName => {
      const fixedInRow = new Map();
      for (let column = 1; column <= 4; column++) {
        const coordinate = `${rowName}${column}`;
        if (fixedNumbers.has(coordinate)) fixedInRow.set(column, fixedNumbers.get(coordinate));
      }
      const availableNumbers = [1, 2, 3, 4].filter(number => ![...fixedInRow.values()].includes(number));
      for (let index = availableNumbers.length - 1; index > 0; index--) {
        const swapIndex = Math.floor(random() * (index + 1));
        [availableNumbers[index], availableNumbers[swapIndex]] = [availableNumbers[swapIndex], availableNumbers[index]];
      }

      for (let column = 1; column <= 4; column++) {
        const coordinate = `${rowName}${column}`;
        const number = fixedInRow.get(column) || availableNumbers.shift();
        const card = document.createElement("button");
        card.type = "button";
        card.className = "spot-tile flip-card";
        card.setAttribute("aria-label", `${coordinate}のカードをめくる`);
        card.setAttribute("aria-pressed", "false");
        card.innerHTML = `<span class="flip-card-inner"><span class="flip-card-face flip-card-front"><img src="images/last/${coordinate}.png" alt="${coordinate}"></span><span class="flip-card-face flip-card-back" aria-hidden="true">${number}</span></span>`;
        card.addEventListener("click", () => {
          const isFlipped = card.classList.toggle("is-flipped");
          card.setAttribute("aria-pressed", String(isFlipped));
        });
        grid.appendChild(card);
      }
    });
    E("finalAnswerInput").value = "";
    E("finalWrongMessage").textContent = "";
    setSubmittedAnswer("finalSubmittedAnswer", "");
  }

  function checkFinalAnswer() {
    if (!finalAnswer || normalize(E("finalAnswerInput").value) !== finalAnswer) {
      E("finalWrongMessage").textContent = "どうやら違うようだ。";
      return;
    }
    E("finalWrongMessage").textContent = "";
    setSubmittedAnswer("finalSubmittedAnswer", E("finalAnswerInput").value);
    window.trackGameEvent?.("game_clear", "team1_sideA");
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
    } catch { /* Use fallback copy if the JSON cannot be loaded. */ }
  }

  function escapeHTML(value) {
    return String(value || "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  }

  function showClear() {
    const ending = clearConfig.sideA || {};
    const image = ending.image || "images/sideA/clear-negi.png";
    const message = ending.message || "なぞねぎとして、二人で部屋から脱出した！";
    const postText = ending.postText || "『協力しないと出られない部屋からの脱出』をクリアしました！";
    const shareUrl = new URL(".", location.href).href;
    const postUrl = `https://x.com/intent/post?text=${encodeURIComponent(`${postText}\n${shareUrl}`)}`;
    openModal(`<div class="clear"><h1>CLEAR</h1><h2>脱出成功！</h2><p class="submitted">あなたの答え：${escapeHTML(E("finalAnswerInput").value)}</p><img class="clearimg" src="${escapeHTML(image)}" alt="なぞねぎのクリア画像"><p>${escapeHTML(message)}</p><a class="tweet" href="${postUrl}" target="_blank" rel="noopener noreferrer">クリアポスト</a><p class="thanks">THANK YOU FOR PLAYING</p><div class="clear-home-link"><a href="../../">なぞねぎ脱出へ</a></div></div>`);
  }
})();
