import Alpine from "alpinejs";
import login from "./login";
import init from "./init";

Alpine.data("login", login);
Alpine.data("init", init);

window.Alpine = Alpine;
Alpine.start();

const NC_URL = "https://nextcloud.clarusch.de";

function setCookie(cname, cvalue, exdays) {
  const d = new Date();
  d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
  let expires = "expires=" + d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
  return document.cookie[cname];
}

function getSessionToken() {
  return getCookie("ncSessionToken");
}

function reqListener() {
  console.log(this.responseText);
}

document.addEventListener("alpine:init", () => {
  Alpine.data("login", () => ({
    open: false,

    loginToNextcloud() {
      const req = new XMLHttpRequest();
      req.addEventListener("load", reqListener);
      req.setRequestHeader("OCS-APIREQUEST", true);
      req.open("GET", NC_URL + "/index.php/login/flow");
      req.send();
    },
  }));
});

function loginToNextcloud() {
  const req = new XMLHttpRequest();
  req.addEventListener("load", reqListener);
  req.setRequestHeader("OCS-APIREQUEST", true);
  req.open("GET", NC_URL + "/index.php/login/flow");
  req.send();
}
