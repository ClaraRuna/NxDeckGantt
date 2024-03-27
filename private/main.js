import Alpine from "alpinejs";
import login from "./login";
import init from "./init";
import decks from "./decks";

Alpine.data("login", login);
Alpine.data("init", init);

window.Alpine = Alpine;

document.addEventListener("alpine:init", () => {
    Alpine.store("decks", decks);
});

Alpine.start();
