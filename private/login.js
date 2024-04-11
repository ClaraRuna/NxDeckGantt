import conf from "./conf";

export default () => ({
  logout() {
    document.getElementById("username").value = null;
    document.getElementById("password").value = null;
    loggedOutView();
  },
});

export function getCredentials() {
  let username = document.getElementById("username").value;
  let password = document.getElementById("password").value;
  return btoa(username + ":" + password);
}

export function loggedInView(){
  document.getElementById("Login").classList.add("hidden");
  document.getElementById("DeckSelection").classList.remove("hidden");
  document.getElementById("MainContent").classList.remove("hidden");

}

export function loggedOutView(){
  console.log("render logged out view")
  document.getElementById("Login").classList.remove("hidden");
  document.getElementById("DeckSelection").classList.add("hidden");
  document.getElementById("MainContent").classList.add("hidden");
}

function storeCredentials(loginName, password) {
  // Todo move to nice alert window in the dom
  window.alert(
    "A new client has been added. Please save the credentials: \n name: " +
      loginName +
      " \n password: " +
      password
  );
  document.getElementById("username").value = loginName;
  document.getElementById("password").value = password;
}
