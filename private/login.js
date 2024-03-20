import NC_URL from "./conf";

export default () => ({
    initNextcloudLogin() {
        const req = new XMLHttpRequest();
        req.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
                console.log(req.response)
                window.nextcloudLoginData = JSON.parse(req.response);
            }
        }
        req.open("POST", NC_URL + "/index.php/login/v2");
        req.send();
    },
    openNextcloudLogin() {
        window.open(window.nextcloudLoginData.login, "_blank");
        console.log("window.nextcloudLoginData.poll.endpoint: " + window.nextcloudLoginData.poll.endpoint)
        console.log("window.nextcloudLoginData.poll.token: " + window.nextcloudLoginData.poll.token)
        let res = pollNextcloudLoginEndpoint(window.nextcloudLoginData.poll.endpoint, window.nextcloudLoginData.poll.token)
            .then(function () {
                console.log(res)// Polling done, now do something else!
                console.log("sucess?")
            }).catch(function () {
                console.log("pollNextcloudLoginEndpoint did not succeed")
            });
    }
})

function pollNextcloudLoginEndpoint(endpoint, token, timeout = 10000, interval = 500) {
    var endTime = Number(new Date()) + timeout;

    var checkCondition = function (resolve, reject) {
        var result = postToNextcloudLoginEndpoint(endpoint, token);
        if (result) {
            resolve(result);
        }
        else if (Number(new Date()) < endTime) {
            setTimeout(checkCondition, interval, resolve, reject);
        }
        else {
            reject(new Error('timed out for ' + postToNextcloudLoginEndpoint + ': ' + arguments));
        }
    };

    return new Promise(checkCondition);
}

function postToNextcloudLoginEndpoint(endpoint, token) {
    const req = new XMLHttpRequest();
    req.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            console.log("ready and 200")
            return JSON.parse(req.response);
        } else {
            console.log("NC not rdy")
        }
    }
    req.open("POST", endpoint);
    req.setRequestHeader("token", token);
    req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    let params = "token=" + token;
    req.send(params);
}