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
        let endpoint = window.nextcloudLoginData.poll.endpoint;
        let token = window.nextcloudLoginData.poll.token;
        let res = pollNextcloudLoginEndpoint(window.nextcloudLoginData.poll.endpoint, window.nextcloudLoginData.poll.token)
            .then(function () {
                console.log(res)// Polling done, now do something else!
                console.log("sucess?")
            }).catch(function () {
                console.log("pollNextcloudLoginEndpoint did not succeed")
            });
    }
})

async function pollNextcloudLoginEndpoint(endpointUrl, token, interval = 1000) {
    return new Promise((resolve, reject) => {
        const poll = async () => {
            try {
                const response = await fetch(endpointUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: "token=" + token
                }); if (response.status === 200) {
                    resolve(response);
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
