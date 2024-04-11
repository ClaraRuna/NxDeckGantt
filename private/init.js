import conf from "./conf";
import {getCredentials} from "./login";

export default () => ({
  init() {
    //todo
    let auth = getCredentials();
    if (auth) {
      document.getElementById("Login").classList.add("hidden");
      document.getElementById("DeckSelection").classList.remove("hidden");
      document.getElementById("LogoutButton").classList.remove("hidden");
    } else {
      document.getElementById("Login").classList.remove("hidden");
    }
  },
});
