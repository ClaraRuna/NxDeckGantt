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
