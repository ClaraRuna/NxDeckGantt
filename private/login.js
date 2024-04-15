import conf from "./conf";

export default () => ({
});

export function getCredentials() {
  let username = document.getElementById("username").value;
  let password = document.getElementById("password").value;
  return btoa(username + ":" + password);
}
