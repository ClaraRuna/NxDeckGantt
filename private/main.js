import Alpine from "alpinejs";
import login from "./login";
import init from "./init";
import decks, {loadDeck, loadDecks} from "./decks";
import {createTasks} from "./tasks";

Alpine.data("login", login);
Alpine.data("init", init);
Alpine.data("decks", decks);
Alpine.store("decks", {
    init() {
        this.decks = loadDecks();
    },
    openDeck(id) {
        loadDeck(id).then(deck => {
            this.currentDeck = deck;
        });
        console.log("Alpine.store(decks).currentDeck");
        console.log(this.currentDeck);
    },
    decks: [],
    currentDeck: []
});

window.Alpine = Alpine;
Alpine.start();

document.addEventListener("alpine:init", () => {
});
