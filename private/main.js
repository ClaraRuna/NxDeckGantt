import Alpine from "alpinejs";
import login from "./login";
import init from "./init";
import decks, { loadDecks } from "./decks";

Alpine.data("login", login);
Alpine.data("init", init);
Alpine.data("decks", decks);
Alpine.store("decks", {
  init() {
    this.decks = loadDecks();
  },
  decks: [],
});

window.Alpine = Alpine;
Alpine.start();

document.addEventListener("alpine:init", () => {});
