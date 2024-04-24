import conf from "./conf";
import { createTasks, filterScheduledTasks, filterUnscheduledTasks } from "./tasks";
import { createGantt } from "./gantt";
import { getCredentials } from "./login";

export default () => ({
    toggle() {
        let deckNav = document.getElementById("DeckNav");
        let DeckSelection = document.getElementById("DeckSelection");
        let width = deckNav.offsetWidth;
        console.log("width:" + width);
        if (!DeckSelection.style.transform) {
            DeckSelection.style.transform = `translateX(-${width}px)`;
        } else {
            DeckSelection.style.transform = "";
        }
    },
    close() {
        let deckNav = document.getElementById("DeckNav");
        let width = deckNav.offsetWidth;
        let DeckSelection = document.getElementById("DeckSelection");
        DeckSelection.style.transform = `translateX(-${width}px)`;
        console.log(DeckSelection);
    },
    init() {
        loadingView();
        loadDecks().then((response) => {
            console.log("load decks");
            console.log("response: " + response);
            if (response.status === 401) {
                console.log("response == 401")
                loggedOutView();
            } else if (response.status === 200) {
                console.log("response == 200")
                this.decks = response.json();
                // todo trigger reload of decks in deck selection
                loggedInView();
                document.getElementById("LoadingOverlay").classList.remove("z-30");
                document.getElementById("LoadingOverlay").classList.remove("z-10");
            } else {
                console.log("Error view")
                loggedOutView();
            }
            this.currentDeck = {};
            this.currentDeck.cards = [];
        });
    },
    openDeck(id, name) {
        loadDeck(id)
            .then((cards) => {
                loggedInView();
                this.currentDeck.name = name;
                this.currentDeck.cards = cards;
                this.currentDeck.id = id;
                let scheduledTasks = this.getScheduledTasks();
                if (scheduledTasks.length > 0) {
                    createGantt(this.getScheduledTasks());
                }
            })
            .finally(() => {
                this.close();
            });
    }
    ,
    getCurrentDeckCards() {
        return this.currentDeck.cards;
    }
    ,
    getCurrentDeckName() {
        return this.currentDeck.name;
    }
    ,
    getUnscheduledTasks() {
        return filterUnscheduledTasks(this.currentDeck.cards);
    }
    ,
    getScheduledTasks() {
        return filterScheduledTasks(this.currentDeck.cards);
    }
    ,
    logIn,
    decks:
        [],
    currentDeck:
        {}
    ,
});

export async function loadDecks() {
    let credentials = getCredentials();
    let url = conf.NC_URL + conf.BOARD_ENDPOINT;

    let response = await fetch(url, {
        method: "GET",
        headers: {
            Authorization: "Basic " + credentials,
        },
    });
    return response;
}

export async function loadDeck(id) {
    loadingView();
    this.currentDeck = null;
    let credentials = getCredentials();
    let url = conf.NC_URL + conf.BOARD_ENDPOINT + "/" + id + "/stacks";

    let response = await fetch(url, {
        method: "GET",
        headers: {
            Authorization: "Basic " + credentials,
        },
    });
    if (response.status === 200) {
        return createTasks(await response.json(), id);
    } else {
        return new Error(`Unexpected response: ${response}`);
    }
}

function logIn() {
    loadingView()
    loadDecks().then(this.init());
}

function loadingView() {
    document.getElementById("Login").classList.add("hidden");
    document.getElementById("MainContent").classList.add("hidden");
    document.getElementById("LoadingOverlay").classList.remove("hidden");
}

function loggedInView() {
    document.getElementById("Login").classList.add("hidden");
    document.getElementById("MainContent").classList.remove("hidden");
    document.getElementById("LoadingOverlay").classList.add("hidden");
}

function loggedOutView() {
    console.log("render logged out view");
    document.getElementById("DeckSelection").classList.add("hidden");
    document.getElementById("Login").classList.remove("hidden");
    document.getElementById("LoadingOverlay").classList.add("hidden");
}
