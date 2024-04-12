import conf from "./conf";
import { createTasks, getScheduledTasks, getUnscheduledTasks } from "./tasks";
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
    try {
      this.decks = loadDecks();
      this.decks.then(loggedInView);
      this.decks.catch(loggedOutView);
    } catch (error) {
      window.alert(error.message);
      loggedOutView();
    }
    this.currentDeck = {};
    this.currentDeck.cards = [];
    let deckNav = document.getElementById("DeckNav");
    let navTab = document.getElementById("NavTab");
    console.log("offsetWidth: " + deckNav.offsetWidth)
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
  let credentials = getCredentials();
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

function loadingView() {
  document.getElementById("Login").classList.add("hidden");
  document.getElementById("MainContent").classList.add("hidden");
}
function loggedInView() {
  document.getElementById("Login").classList.add("hidden");
  document.getElementById("MainContent").classList.remove("hidden");
}

function loggedOutView() {
  console.log("render logged out view");
  document.getElementById("Login").classList.remove("hidden");
  document.getElementById("MainContent").classList.add("hidden");
}
