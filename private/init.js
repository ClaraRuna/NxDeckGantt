import NC_URL from "./conf";

export default () => ({
  init() {
    console.log("init called");
    //check session cookie + username#
    let authCookie = getAuthCookie();
    if (authCookie) {
      document.getElementById("Login").classList.add("hidden");
    } else {
      document.getElementById("LogoutButton").classList.add("hidden");
    }
  },
});

function getAuthCookie() {
  return getCookie("ncAuth");
}

function getCookie(cname) {
  let name = cname + "=";
  let ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}
