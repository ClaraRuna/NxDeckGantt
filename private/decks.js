import conf from "./conf";
import {
  createTasks,
  filterScheduledTasks,
  filterUnscheduledTasks,
} from "./tasks";
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
    loggedOutView();
  },
  loadDecks() {
    let credentials = getCredentials();
    let url = conf.NC_URL + conf.BOARD_ENDPOINT;

    fetch(url, {
      method: "GET",
      headers: {
        Authorization: "Basic " + credentials,
      },
    })
      .then((response) => {
        if (response.status === 401) {
          loggedOutView();
        } else if (response.status === 200) {
          this.decks = response.json();
          loggedInView();
          document.getElementById("LoadingOverlay").classList.remove("z-30");
          document.getElementById("LoadingOverlay").classList.remove("z-10");
        } else {
          loggedOutView();
        }
        if (response.status !== 200) {
          setErrorMessage(
            response,
            "Could not log you in, are your username and password correct?"
          );
        }
        this.currentDeck = {};
        this.currentDeck.cards = [];
      })
      .catch((error) => {
        setErrorMessage(
          [(status) => null],
          error +
            "<br> This might happen when the API Endpoint of the nextcloud is not reachable. The configured endpoint is: <a class='underline' href='" +
            conf.NC_URL +
            conf.BOARD_ENDPOINT +
            "'>" +
            conf.NC_URL +
            conf.BOARD_ENDPOINT +
            "</a>"
        );
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
          createGantt(this.getScheduledTasks(), this.userLang);
        }
      })
      .finally(() => {
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
    return filterUnscheduledTasks(this.currentDeck.cards);
  },
  getScheduledTasks() {
    return filterScheduledTasks(this.currentDeck.cards);
  },
  getDecks() {
    return this.decks;
  },
  logIn() {
    this.hideError();
    this.loadDecks();
  },
  hideError,
  currentDeck: {},
  userLang: navigator.language || navigator.userLanguage,
});

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
    setErrorMessage(response, "Could not load Decks");
  }
}

function loadingView() {
  document.getElementById("Login").classList.add("hidden");
  document.getElementById("MainContent").classList.add("hidden");
  document.getElementById("LoadingOverlay").classList.remove("hidden");
  hideError();
}

function loggedInView() {
  document.getElementById("Login").classList.add("hidden");
  document.getElementById("DeckSelection").classList.remove("hidden");
  document.getElementById("MainContent").classList.remove("hidden");
  document.getElementById("LoadingOverlay").classList.add("hidden");
}

function loggedOutView() {
  console.log("render logged out view");
  document.getElementById("DeckSelection").classList.add("hidden");
  document.getElementById("Login").classList.remove("hidden");
  document.getElementById("LoadingOverlay").classList.add("hidden");
}

export function setErrorMessage(response, customMessage = "") {
  let errorMessage = customMessage + "<br>" + "ErrorCode: " + response.status;
  if (response.message) {
    errorMessage += "<br>response.message";
  }
  document.getElementById("ErrorArea").innerHTML = errorMessage;
  document.getElementById("ErrorWrapper").classList.remove("hidden");
}

function hideError() {
  document.getElementById("ErrorWrapper").classList.add("hidden");
}
