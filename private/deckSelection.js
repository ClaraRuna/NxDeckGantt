import conf from "./conf";
import {getAuthCookie} from "./auth";

export default () => ({
    toggle() {
        document.getElementById("DeckNav").classList.toggle("hidden");
    },
//for each deck load html https://alpinejs.dev/essentials/templating#looping-elements

});

export async function loadDeckData() {
    let credentials = getAuthCookie();
    let url = conf.NC_URL + conf.BOARD_ENDPOINT;

    let response = await fetch(url, {
        method: "GET",
        headers: {
            "Authorization": "Basic " + credentials,
        },
    });
    if (response.status === 200) {
        return await response.json();
    } else {
        return (new Error (`Unexpected response: ${response}`))
    }
}

