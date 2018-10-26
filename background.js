
(function() {
    const tabStorage = {};
    const networkFilters = {
        urls: [
            "*://*.reddit.com/*"
        ]
    };

    chrome.webRequest.onBeforeRequest.addListener((details) => {
        const { tabId, requestId } = details;
        if (!tabStorage.hasOwnProperty(tabId)) {
            return;
        }

        tabStorage[tabId].requests[requestId] = {
            requestId: requestId,
            url: details.url,
            startTime: details.timeStamp,
            status: 'pending'
        };
        // console.log(tabStorage[tabId].requests[requestId]);
    }, networkFilters);

    chrome.webRequest.onCompleted.addListener((details) => {
        const { tabId, requestId } = details;
        if (!tabStorage.hasOwnProperty(tabId) || !tabStorage[tabId].requests.hasOwnProperty(requestId)) {
            return;
        }

        const request = tabStorage[tabId].requests[requestId];

        Object.assign(request, {
            endTime: details.timeStamp,
            requestDuration: details.timeStamp - request.startTime,
            status: 'complete'
        });
        var req = tabStorage[tabId].requests[details.requestId] 
        var lookfor = "/api/vote"
        var url = req.url
        if(url.indexOf(lookfor) > -1) {
            var re = /dir=(.*)&id=(.*)&/g
            var match = re.exec(url)
            if(match) {
                var dir = match[1]

                if(dir != "0") {
                    var name = match[2]
                    send_voter(name, dir, logged_user)
                    console.log("name=%s, dir=%s, logged_user=%s", name, dir, logged_user)
                }
            }
        }

    }, networkFilters);

    chrome.webRequest.onErrorOccurred.addListener((details)=> {
        const { tabId, requestId } = details;
        if (!tabStorage.hasOwnProperty(tabId) || !tabStorage[tabId].requests.hasOwnProperty(requestId)) {
            return;
        }

        const request = tabStorage[tabId].requests[requestId];
        Object.assign(request, {
            endTime: details.timeStamp,           
            status: 'error',
        });
        // console.log(tabStorage[tabId].requests[requestId]);
    }, networkFilters);

    chrome.tabs.onActivated.addListener((tab) => {
        const tabId = tab ? tab.tabId : chrome.tabs.TAB_ID_NONE;
        if (!tabStorage.hasOwnProperty(tabId)) {
            tabStorage[tabId] = {
                id: tabId,
                requests: {},
                registerTime: new Date().getTime()
            };
        }
    });
    chrome.tabs.onRemoved.addListener((tab) => {
        const tabId = tab.tabId;
        if (!tabStorage.hasOwnProperty(tabId)) {
            return;
        }
        tabStorage[tabId] = null;
    });
}());


function get_age(created) {
    if(created) {
        var NOW = (new Date()).getTime()
        var age_days = (NOW - created) / 86400000
        var round = Math.round(age_days * 10)/10
        
        return round
    } else {
        return -1
    }
}

function send_voter(name, dir, logged_user) {
    var xhr = new XMLHttpRequest();
    var base_url = "https://script.google.com/macros/s/" + SCRIPT_ID + "/exec"
    var url = base_url + "?name=" + name + "&dir=" + dir + "&logged_user=" + logged_user 
    xhr.open('GET', url, true);
    xhr.onload = function () {
        var json = JSON.parse(this.responseText)
        console.log(json)
    };
    xhr.send();
}

var SCRIPT_ID = "AKfycby57drWo2Ovhp6NOzfUMBOMecpNugvHAbaN_YrJmPcaKKR5ZY0"

var logged_user;

chrome.runtime.onMessage.addListener(
        function(request, sender, sendResponse) {
            logged_user = request.logged_user
            console.log("logged_user: %s", request.logged_user)
        }
);
