import conf from "./conf";
import { getAuthCookie } from "./auth";
import { createTasks, getScheduledTasks, getUnscheduledTasks } from "./tasks";
import { createGantt } from "./gantt";

export default () => ({
  toggle() {
    document.getElementById("DeckNav").classList.toggle("hidden");
  },
  close() {
    document.getElementById("DeckNav").classList.add("hidden");
  },
  init() {
    this.decks = loadDecks();
    this.currentDeck = {};
    this.currentDeck.cards = [];
  },
  openDeck(id, name) {
    loadDeck(id).then((cards) => {
      this.currentDeck.name = name;
      this.currentDeck.cards = cards;
      this.currentDeck.id = id;
      createGantt(this.getScheduledTasks());
    });
  },
  getCurrentDeckCards() {
    return this.currentDeck.cards;
  },
  getCurrentDeckName() {
    return this.currentDeck.name;
  },
  getUnscheduledTasks() {
    return getUnscheduledTasks(this.currentDeck.cards);
  },
  getScheduledTasks() {
    let scheduledTasks = getScheduledTasks(this.currentDeck.cards);
    return scheduledTasks;
  },
  decks: [],
  currentDeck: {},
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
    return createTasks(await response.json(), id);
  } else {
    return new Error(`Unexpected response: ${response}`);
  }
}
