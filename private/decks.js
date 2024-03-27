import conf from "./conf";
import { getAuthCookie } from "./auth";
import { createTasks } from "./tasks";

export default () => ({
  toggle() {
    document.getElementById("DeckNav").classList.toggle("hidden");
  },
  init() {
    this.decks = loadDecks();
    this.currentDeck = loadDeck(1);
  },
  openDeck(id) {
    console.log("openDeck");
    loadDeck(id).then((deck) => {
      console.log(deck);
      this.currentDeck = deck;
      console.log(this.currentDeck);
    });
  },
  getCurrentDeck() {
    console.log("getCurrentDeck");
    console.log(this.currentDeck);
    return this.currentDeck;
  },
  decks: [],
  currentDeck: [],
});

export async function loadDecks() {
  let credentials = getAuthCookie();
  let url = conf.NC_URL + conf.BOARD_ENDPOINT;

  let response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: "Basic " + credentials,
    },
  });
  if (response.status === 200) {
    return await response.json();
  } else {
    return new Error(`Unexpected response: ${response}`);
  }
}

export async function loadDeck(id) {
  let credentials = getAuthCookie();
  let url = conf.NC_URL + conf.BOARD_ENDPOINT + "/" + id + "/stacks";

  let response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: "Basic " + credentials,
    },
  });
  if (response.status === 200) {
    return createTasks(await response.json());
  } else {
    return new Error(`Unexpected response: ${response}`);
  }
}
