import Alpine from "alpinejs";
import login from "./login";
import init from "./init";
import deckSelection, {loadDeckData}  from "./deckSelection";

Alpine.data("login", login);
Alpine.data("init", init);
Alpine.data("deckSelection", deckSelection);
Alpine.store('decks', {
    init(){
        this.decks = loadDeckData();
    },
    decks: []
})

window.Alpine = Alpine;
Alpine.start();

document.addEventListener("alpine:init", () => {});
