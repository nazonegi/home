let gameData, currentQuestionIndex = 0, unlockedIndex = 0, currentNoticeIndex = 0, submittedAnswers = {}; const E = id => document.getElementById(id);
document.addEventListener("DOMContentLoaded", async () => { try { if (E("workList")) await home(); else { gameData = await (await fetch("data.json")).json(); validate(); if (E("titlePage")) title(); else game() } } catch (e) { document.body.insertAdjacentHTML("afterbegin", `<p class="ng">${esc(e.message)}</p>`) } }); const stars = n => "★".repeat(n) + "☆".repeat(5 - n);
async function home() { let works = await (await fetch("works.json")).json(); for (const x of works) { let d = await (await fetch(`works/${x.folder}/data.json`)).json(); E("workList").insertAdjacentHTML("beforeend", `<a class="work" href="works/${x.folder}/index.html"><img src="works/${x.folder}/images/${esc(d.titleImage)}"><div class="workbody"><h3>${esc(d.title)}</h3><div class="meta"><span>${stars(d.difficulty)}</span><span>${esc(d.time)}</span></div></div></a>`) } } function title() { document.title = gameData.title; E("gameTitle").textContent = gameData.title; E("intro").textContent = gameData.intro; E("difficulty").textContent = stars(gameData.difficulty); E("time").textContent = gameData.time; E("howToPlay").textContent = gameData.howToPlay; E("titleImage").src = `images/${gameData.titleImage}`; for (const n of gameData.notice || []) E("noticeList").insertAdjacentHTML("beforeend", `<li>${esc(n)}</li>`) }
function game() {
  restore(); document.title = gameData.title; E("answerButton").onclick = check; E("answerInput").onkeydown = e => { if (e.key === "Enter") check() }; E("noticeButton").onclick = noticeConfirm; E("prevButton").onclick = () => move(currentQuestionIndex - 1); E("nextButton").onclick = () => move(currentQuestionIndex + 1); E("progressResetButton").onclick = resetConfirm;

  E("modalClose").onclick = closeModal;

  E("modal").onclick = event => {
    if (event.target === E("modal")) {
      closeModal();
    }
  };

  E("questionImage").onclick = () => {
    E("viewerImage").src = E("questionImage").src;
    E("viewer").classList.remove("hidden");
  };

  E("viewerClose").onclick = () => {
    E("viewer").classList.add("hidden");
  };

  E("viewer").onclick = event => {
    if (event.target === E("viewer")) {
      E("viewer").classList.add("hidden");
    }
  }; document.onkeydown = e => { if (e.key === "Escape") { closeModal(); E("viewer").classList.add("hidden") } if (!E("modal").classList.contains("hidden") || ["INPUT", "TEXTAREA"].includes(e.target.tagName)) return; if (e.key === "ArrowLeft") move(currentQuestionIndex - 1); if (e.key === "ArrowRight") move(currentQuestionIndex + 1) }; render()
}
function key() { return `neginazo_${gameData.id || gameData.title}` } function save() { localStorage.setItem(key(), JSON.stringify({ version: gameData.version, currentQuestion: currentQuestionIndex, unlockedQuestion: unlockedIndex, answers: submittedAnswers })) } function restore() { try { let p = JSON.parse(localStorage.getItem(key())); if (!p || p.version !== gameData.version) return; unlockedIndex = Math.min(+p.unlockedQuestion || 0, gameData.questions.length - 1); currentQuestionIndex = Math.min(+p.currentQuestion || 0, unlockedIndex); submittedAnswers = p.answers || {} } catch { } }
function render() { let q = gameData.questions[currentQuestionIndex]; E("questionLabel").textContent = q.label; E("questionImage").src = `images/${q.image}`; E("answerInput").placeholder = q.placeholder || "答えをひらがなで入力"; E("answerInput").value = submittedAnswers[q.id] || ""; E("wrongMessage").textContent = ""; let v = submittedAnswers[q.id] || ""; E("lastAnswer").textContent = v ? `あなたの答え：${v}` : ""; E("lastAnswer").classList.toggle("hidden", !v); nav() }
function nav() { E("stepNav").innerHTML = ""; gameData.questions.forEach((q, i) => { if (i > unlockedIndex) return; let b = document.createElement("button"); b.className = "dot" + (i === currentQuestionIndex ? " current" : ""); b.disabled = i === currentQuestionIndex; b.ariaLabel = `${q.label}へ移動`; b.onclick = () => move(i); E("stepNav").appendChild(b) }); E("prevButton").disabled = currentQuestionIndex === 0; E("nextButton").disabled = currentQuestionIndex >= unlockedIndex } function move(i) { if (i < 0 || i > unlockedIndex) return; currentQuestionIndex = i; render() }
function check() { let q = gameData.questions[currentQuestionIndex], raw = E("answerInput").value, a = norm(raw); if (!(q.answers || []).map(norm).includes(a)) { E("wrongMessage").textContent = "どうやら違うようだ。"; return } E("wrongMessage").textContent = ""; if (q.id === "last") { submittedAnswers[q.id] = raw; renderAnswer(); clearModal(); return } let opened = currentQuestionIndex === unlockedIndex; if (opened) { submittedAnswers[q.id] = raw; unlockedIndex++; let old = currentQuestionIndex; currentQuestionIndex = unlockedIndex; save(); currentQuestionIndex = old; renderAnswer() } modal(`<h2>正解！</h2><p>${esc(q.successMessage || "正解！")}</p><div class="modalactions"><button id="goNext">次へ</button></div>`); E("goNext").onclick = () => { closeModal(); move(Math.min(currentQuestionIndex + 1, gameData.questions.length - 1)) }; nav() } function renderAnswer() { let q = gameData.questions[currentQuestionIndex], v = submittedAnswers[q.id] || ""; E("lastAnswer").textContent = v ? `あなたの答え：${v}` : ""; E("lastAnswer").classList.toggle("hidden", !v); E("answerInput").value = v }
function noticeConfirm() { modal(`<h2>気付く</h2><img class="thinking" src="images/${esc(gameData.supportThinkingImage || "thinking.svg")}"><p class="noticecontent">なぞねぎが周囲をもう一度見回します。\n\n新しい発見があるかもしれません。\n\n「次へ」を押すと、なぞねぎが気付いた内容を確認できます。</p><div class="modalactions"><button id="showNotice">次へ</button></div>`); E("showNotice").onclick = () => { currentNoticeIndex = 0; notice() } }
function notice() {
  const ns = gameData.questions[currentQuestionIndex].notices || [];

  if (!ns.length) {
    modal("<h2>気付く</h2><p>まだ何も見つけられなかったようです。</p>");
    return;
  }

  const n = ns[currentNoticeIndex];

  const body =
    n.type === "image"
      ? `<img class="noticeimg" src="images/${esc(n.content)}">`
      : `<p class="noticecontent">${esc(n.content)}</p>`;

  const prevButton =
    currentNoticeIndex > 0
      ? '<button id="pn">戻る</button>'
      : "";

  const nextButton =
    currentNoticeIndex < ns.length - 1
      ? '<button id="nn">次へ</button>'
      : "";

  modal(`
    <h2>気付いたこと ${currentNoticeIndex + 1}/${ns.length}</h2>
    ${body}
    <div class="modalactions">
      ${prevButton}
      ${nextButton}
    </div>
  `);

  const prev = E("pn");
  if (prev) {
    prev.onclick = () => {
      currentNoticeIndex--;
      notice();
    };
  }

  const next = E("nn");
  if (next) {
    next.onclick = () => {
      currentNoticeIndex++;
      notice();
    };
  }
}
function resetConfirm() { modal('<h2>進捗リセット</h2><p>進捗をリセットしますか？</p><p>これまでの解放状況と回答履歴が削除されます。</p><div class="modalactions"><button id="doReset">リセットする</button><button id="cancelReset">キャンセル</button></div>'); E("doReset").onclick = () => { localStorage.removeItem(key()); currentQuestionIndex = unlockedIndex = 0; submittedAnswers = {}; closeModal(); render() }; E("cancelReset").onclick = closeModal }
function clearModal() { let e = gameData.ending || {}, url = `https://twitter.com/intent/tweet?text=${encodeURIComponent((e.tweetText || "") + "\n" + location.href.replace(/game\.html.*$/, ""))}`; modal(`<div class="clear"><h1>CLEAR</h1><h2>クリア！脱出成功！</h2><img class="clearimg" src="images/${esc(e.image)}"><p>${esc(e.text)}</p><a class="tweet" target="_blank" rel="noopener" href="${url}">クリアポスト</a><p class="thanks">THANK YOU FOR PLAYING</p></div>`) }
function modal(h) { E("modalContent").innerHTML = h; E("modal").classList.remove("hidden") } function closeModal() { E("modal")?.classList.add("hidden") } function norm(v) { return String(v || "").trim().toLowerCase().replace(/[Ａ-Ｚａ-ｚ０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0)).replace(/[ァ-ン]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60)).replace(/\s+/g, "") } function validate() { if (!gameData.title || !gameData.questions?.length) throw Error("設定エラー：data.jsonを確認してください。"); if (gameData.questions.at(-1).id !== "last") throw Error("設定エラー：最後の問題の id は last にしてください。") } function esc(v) { return String(v ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;") }