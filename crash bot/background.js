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
    if (message.type === 'updateBadge') {
        chrome.action.setBadgeText({ text: message.text });
        chrome.action.setBadgeBackgroundColor({ color: '#4688F1' });
    }
    if (message.type === 'notify') {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon16.png',
            title: message.title,
            message: message.message,
            priority: 1
        });
    }
    if (message.type === 'updateStatus') {
        // Future enhancements can handle status updates here
    }
});
