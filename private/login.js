import conf from "./conf";

export default () => ({
  checkCredentials() {
    let credentials = this.getCredentials();
    fetch(conf.NC_URL + "/ocs/v1.php/...", {
      method: "GET",
      headers: {
        "OCS-APIREQUEST": "true",
        Authorization: "Basic " + credentials,
      },
    })
      .then(() => {
        console.log("checkCredentials successful");
        //hide login form but keep credentials
      })
      .catch(() => {
        window.alert("Could not log you in. Please check your credentials");
      });
  },
  logout() {
    document.getElementById("username").value = null;
    document.getElementById("password").value = null;
  },
});


export function getCredentials() {
  let username = document.getElementById("username").value;
  let password = document.getElementById("password").value;
  console.log(`credentials: ${username}:${password}`);
  return btoa(username + ":" + password);
}

async function pollNextcloudLoginEndpoint(endpointUrl, token, interval = 1000) {
  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        const response = await fetch(endpointUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: "token=" + token,
        });
        if (response.status === 200) {
          const jsonResponse = await response.json();
          resolve(jsonResponse); // Resolve with the parsed JSON
          //resolve(response);
        } else if (response.status === 404) {
          setTimeout(poll, interval);
        } else {
          reject(new Error(`Unexpected response status: ${response.status}`));
        }
      } catch (error) {
        reject(error);
      }
    };

    poll();
  });
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
