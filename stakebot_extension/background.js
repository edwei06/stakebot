// background.js

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "stopBot") {
        // Logic to stop the bot can be implemented here if needed
        sendResponse({status: "Bot stopping not implemented in background."});
    }
    if (request.action === "startBot") {
        // Logic to start the bot can be implemented here if needed
        sendResponse({status: "Bot starting not implemented in background."});
    }
});
