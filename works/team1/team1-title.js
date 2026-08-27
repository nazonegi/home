(() => {
  "use strict";

  const dialog = document.getElementById("startConfirmDialog");
  const message = document.getElementById("startConfirmMessage");
  const character = document.getElementById("startConfirmCharacter");
  let destination = "";

  document.querySelectorAll(".role-card[data-role-name]").forEach(link => {
    link.addEventListener("click", event => {
      event.preventDefault();
      destination = link.href;
      character.src = link.dataset.characterImage;
      character.alt = link.dataset.roleName;
      message.textContent = `${link.dataset.roleName}としてゲームを始めます。\nこの担当でよろしいですか？`;
      dialog.showModal();
    });
  });

  dialog.addEventListener("close", () => {
    if (dialog.returnValue === "confirm" && destination) window.location.href = destination;
    destination = "";
  });

  dialog.addEventListener("click", event => {
    if (event.target === dialog) dialog.close("cancel");
  });
})();
