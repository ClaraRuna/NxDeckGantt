import Alpine from "alpinejs";
import { getCredentials } from "./login";
import decks from "./decks";
import login from "./login";

Alpine.data("login", login);

window.Alpine = Alpine;

document.addEventListener("alpine:init", () => {
  Alpine.store("decks", decks);
});

Alpine.start();
