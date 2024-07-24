import conf from "./conf";
import {
  createTasks,
  filterScheduledTasks,
  filterUnscheduledTasks,
} from "./tasks";
import { createGantt } from "./gantt";
import { getCredentials } from "./login";
import { translate } from "./translations";

const zoomOptionTranslations = {
  en: ["Quarter Day", "Half Day", "Day", "Week", "Month", "Year"],
  de: ["Viertel Tag", "Halber Tag", "Tag", "Woche", "Monat", "Jahr"],
};

const defaultZoomMode = "Day";

export default () => ({
  toggle() {
    let deckNav = document.getElementById("DeckNav");
    let DeckSelection = document.getElementById("DeckSelection");
    let width = deckNav.offsetWidth;
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
  },
  init() {
    checkBaseUri();
    loggedOutView();
    setZoomSelectOptions(this.userLang);
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
              translate("wrongPassword", this.userLang)
          );
        }
        this.currentDeck = {};
        this.currentDeck.cards = [];
      })
      .catch((error) => {
        setErrorMessage(
          error,
            translate("wrongPassword", this.userLang)
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
          let zoomMode = getZoomLevelFromCookie(name) || "Day";
          createGantt(this.getScheduledTasks(), this.userLang, zoomMode);
          document.getElementById("ZoomSelect").value = zoomMode;
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
  setZoom(event) {
    const selectedValue = event.target.value;
    gantt.change_view_mode(selectedValue);
    document.cookie =
      "Deck." + this.currentDeck.name + ".zoom=" + selectedValue;
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
  document.getElementById("DeckSelection").classList.add("hidden");
  document.getElementById("Login").classList.remove("hidden");
  document.getElementById("LoadingOverlay").classList.add("hidden");
  document.getElementById("LoginText").innerText = translate("loginText", navigator.language || navigator.userLanguage);
}

export function setErrorMessage(response, customMessage = "") {
  let errorMessage = customMessage + "<br>" + "ErrorCode: " + response.status;
  if (response.message) {
    errorMessage += "<br>" + response.message;
  }
  document.getElementById("ErrorArea").innerHTML = errorMessage;
  document.getElementById("ErrorWrapper").classList.remove("hidden");
}

function hideError() {
  document.getElementById("ErrorWrapper").classList.add("hidden");
}

function checkBaseUri() {
  let url = conf.NC_URL + conf.BOARD_ENDPOINT;
  //make a dummy request with wrong credentials and check
  fetch(url, {
    method: "GET",
    headers: {
      Authorization: "Basic " + "dummycredentials",
    },
  }).catch(() => {
    setErrorMessage(
      [(status) => null],
        translate("wrongUri", navigator.language || navigator.userLanguage),
        conf.NC_URL
    );
  });
}

function setZoomSelectOptions(lang) {
  let zoomOptions =
    zoomOptionTranslations[lang] || zoomOptionTranslations["en"];

  let zoomSelect = document.getElementById("ZoomSelect");

  zoomOptions.map((value, index) => {
    const optionElement = document.createElement("option");
    optionElement.value = zoomOptionTranslations["en"][index];
    optionElement.textContent = value;
    zoomSelect.appendChild(optionElement);
  });

  zoomSelect.value = defaultZoomMode;
}

function getZoomLevelFromCookie(deckName) {
  const cookieName = "Deck." + deckName + ".zoom";
  const cookies = document.cookie.split(";");

  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i].trim();

    if (cookie.startsWith(cookieName + "=")) {
      return cookie.substring(cookieName.length + 1);
    }
  }
  return null;
}
