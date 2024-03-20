import NC_URL from "./conf";

export default () => ({
  // ToDo check SSL, otherwise refuse
  nextcloudLogin() {
    window.open(window.nextcloudLoginData["login"], "_blank");
  },
  initGetNextcloudLoginData() {
    getNextcloudLoginData()
      .then(function (data) {
        let endpoint = data.poll.endpoint;
        let token = data.poll.token;
        /*                let loginData = getNextcloudLoginData(endpoint, token)
                console.log(getNextcloudLoginData(endpoint, token));*/
      })
      .catch(function (error) {
        window.alert(error);
      });
  },
  storeCredentialsAsCookie() {
    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value;
    let credentials = window.btoa(
      username + ":" + unescape(encodeURIComponent(password))
    );
  },
  loginToNextcloud() {
    const req = new XMLHttpRequest();
    req.onreadystatechange = function (){
        if (this.readyState == 4 && this.status == 200){
            console.log(req);
        }
    }
    req.open("GET", NC_URL + "/index.php/login/flow");
    req.setRequestHeader("OCS-APIREQUEST", true);
    req.send();
  }
});

function getNextcloudLoginData(endpoint, token) {
  let loginData = pollNextcloudLoginEndpoint(endpoint, token);
  return loginData;
}

function pollNextcloudLoginEndpoint(
  endpoint,
  token,
  timeout = 100000,
  interval = 100
) {
  var endTime = Number(new Date()) + timeout;

  var response = function (resolve, reject) {
    const req = new XMLHttpRequest();
    req.open("POST", endpoint);
    req.setRequestHeader("token", token);
    req.send();
    req.onload = function () {
      if (req.status === 200) {
        resolve(JSON.parse(req.response));
      } else if (Number(new Date()) < endTime) {
        setTimeout(response, interval, resolve, reject);
      } else {
        reject(new Error("Failed to get Login Data from Nextcloud"));
      }
    };
  };
  return new Promise(response);
}

function loginToNextcloud() {
    const req = new XMLHttpRequest();
    req.addEventListener("load", reqListener);
    req.setRequestHeader("OCS-APIREQUEST", true);
    req.open("GET", NC_URL + "/index.php/login/flow");
    req.send();
  }