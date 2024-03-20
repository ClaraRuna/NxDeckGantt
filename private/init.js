import NC_URL from "./conf";

export default () => ({
  init() {
    console.log("init called");
    //check session cookie + username#
    let sessionToken = getSessionToken();
    if (sessionToken) {
      document.getElementById("Login").classList.add("hidden");
    } else {
      document.getElementById("LogoutButton").classList.add("hidden");
    }
  },
});

function getSessionToken() {
  return getCookie("ncSessionToken");
}

function getCookie(cname) {
  return document.cookie[cname];
}
