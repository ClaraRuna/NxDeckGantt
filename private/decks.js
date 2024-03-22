import conf from "./conf";
import { getAuthCookie } from "./auth";


export default () => ({
  toggle() {
    document.getElementById("DeckNav").classList.toggle("hidden");
  },
  openDeck(id) {
    loadDeck(id).then(createTasks);
  },
  //for each deck load html https://alpinejs.dev/essentials/templating#looping-elements
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

async function loadDeck(id) {
  let credentials = getAuthCookie();
  let url = conf.NC_URL + conf.BOARD_ENDPOINT + "/" + id + "/stacks";

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
