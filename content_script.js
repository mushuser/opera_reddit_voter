var logged_user = get_loggeduser()
chrome.runtime.sendMessage({logged_user:logged_user}, function(response) {
});

function get_loggeduser() {
    var scripts = document.scripts
    
    for(var i in scripts) {
        var text = scripts[i].text
        var match = text.match(/logged\": \"(\w*)\"/)
        if(match) {
            var logged_user = match[1]
            return logged_user 
        }
    }

    return undefined
}
