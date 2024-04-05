import conf from "./conf";
import { getAuthCookie } from "./auth";
import { createTasks, getScheduledTasks, getUnscheduledTasks } from "./tasks";
import { createGantt } from "./gantt";

export default () => ({
  toggle() {
    let deckNav = document.getElementById("DeckNav");
    let DeckSelection = document.getElementById("DeckSelection");
    let width = deckNav.offsetWidth;
    if (!DeckSelection.style.transform){
      DeckSelection.style.transform = `translateX(-${width}px)`
    } else {
      DeckSelection.style.transform = ""
    }
  },
  close() {
    let deckNav = document.getElementById("DeckNav");
    let width = deckNav.offsetWidth;
    let DeckSelection = document.getElementById("DeckSelection");
    DeckSelection.style.transform = `translateX(-${width}px)`
    console.log(DeckSelection)
  },
  init() {
    this.decks = loadDecks();
    this.currentDeck = {};
    this.currentDeck.cards = [];
    let deckNav = document.getElementById("DeckNav");
    let navTab = document.getElementById("NavTab");
    navTab.style.left = deckNav.offsetWidth;
  },
  openDeck(id, name) {
    loadDeck(id).then((cards) => {
      this.currentDeck.name = name;
      this.currentDeck.cards = cards;
      this.currentDeck.id = id;
      createGantt(this.getScheduledTasks());
      this.close();
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
