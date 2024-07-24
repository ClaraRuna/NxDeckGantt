import Alpine from "alpinejs";
import decks from "./decks";

window.Alpine = Alpine;

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("Body").style.display = null;
  let deckNav = document.getElementById("DeckNav");
  let navTab = document.getElementById("NavTab");
  let zoomSelect = document.getElementById("ZoomSelect");
});
document.addEventListener("alpine:init", () => {
  Alpine.store("decks", decks);
});

Alpine.start();
