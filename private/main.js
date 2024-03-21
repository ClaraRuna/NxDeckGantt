import Alpine from "alpinejs";
import login from "./login";
import init from "./init";

Alpine.data("login", login);
Alpine.data("init", init);

window.Alpine = Alpine;
Alpine.start();

const NC_URL = "https://nextcloud.clarusch.de";

document.addEventListener("alpine:init", () => {});
