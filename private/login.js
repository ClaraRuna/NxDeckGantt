import NC_URL from "./conf";

export default () => ({
  initNextcloudLogin() {
    const req = new XMLHttpRequest();
    req.onreadystatechange = function () {
      if (this.readyState == 4 && this.status == 200) {
        console.log(req.response);
        window.nextcloudLoginData = JSON.parse(req.response);
      }
    };
    req.open("POST", NC_URL + "/index.php/login/v2");
    req.send();
  },
  openNextcloudLogin() {
    window.open(window.nextcloudLoginData.login, "_blank");
    let endpoint = window.nextcloudLoginData.poll.endpoint;
    let token = window.nextcloudLoginData.poll.token;
    let res = pollNextcloudLoginEndpoint(
      window.nextcloudLoginData.poll.endpoint,
      window.nextcloudLoginData.poll.token
    )
      .then((response) => {
        storeCredentials(response.loginName, response.appPassword);
      })
      .catch((error) => {
        console.log("pollNextcloudLoginEndpoint did not succeed: " + error);
      });
  },
  saveCookieAndReload() {
    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value;
    console.log("username: " + username);
    console.log("password: " + password);
    console.log(NC_URL + "/ocs/v1.php/...");
    let credentials = btoa(username + ":" + password);
    const response = fetch(NC_URL + "/ocs/v1.php/...", {
      method: "GET",
      headers: {
        "OCS-APIREQUEST": "true",
        Authorization: "Basic " + credentials,
      },
    })
      .then((response) => {
        console.log("checkCredentials successful");
        document.cookie = "ncAuth=" + credentials + "; SameSite=Strict";
        window.location.reload();
      })
      .catch((error) => {
        window.alert("wrong credentials");
      });
  },
  logout() {
    document.cookie = "ncAuth=; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    window.location.reload();
  },
});

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
