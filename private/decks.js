import conf from "./conf";
import { getAuthCookie } from "./auth";
import { createTasks, getScheduledTasks, getUnscheduledTasks } from "./tasks";

export default () => ({
  toggle() {
    document.getElementById("DeckNav").classList.toggle("hidden");
  },
  close(){
    document.getElementById("DeckNav").classList.add("hidden");
  },
  init() {
    this.decks = loadDecks();
    this.currentDeck = {};
    this.currentDeck.cards = [];
  },
  openDeck(id, name) {
    console.log("openDeck");
    loadDeck(id).then((cards) => {
      this.currentDeck.name = name;
      this.currentDeck.cards = cards;
      console.log(this.currentDeck);
    });
  },
  getCurrentDeckCards() {
    console.log("getCurrentDeck");
    console.log(this.currentDeck);
    return this.currentDeck.cards;
  },
  getCurrentDeckName(){
    return this.currentDeck.name;
  },
  getUnscheduledTasks(){
    //let unscheduledTasks = getUnscheduledTasks(this.getCurrentDeckCards());
    let unscheduledTasks = getUnscheduledTasks(this.currentDeck.cards);
    console.log(unscheduledTasks);
    return unscheduledTasks;
  },
  getScheduledTasks(){
    let scheduledTasks = getScheduledTasks(this.currentDeck.cards);
    console.log(scheduledTasks);
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
    return createTasks(await response.json());
  } else {
    return new Error(`Unexpected response: ${response}`);
  }
}
