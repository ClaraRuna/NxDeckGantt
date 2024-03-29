import conf from "./conf";
import { getAuthCookie } from "./auth";

export default () => ({
  init() {
    let authCookie = getAuthCookie();
    if (authCookie) {
      document.getElementById("Login").classList.add("hidden");
      document.getElementById("DeckSelection").classList.remove("hidden");
      document.getElementById("LogoutButton").classList.remove("hidden");
    } else {
      document.getElementById("Login").classList.remove("hidden");
    }
  },
});
