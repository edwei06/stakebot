// background.js

let isRunning = false;
let startTime = null;
let intervalId = null;

// Initialize status
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({ isRunning: false, startTime: null, runningTime: "00:00:00" });
});

// Listen for messages from content and popup scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "start") {
        if (!isRunning) {
            isRunning = true;
            startTime = Date.now();
            chrome.storage.local.set({ isRunning: true, startTime: startTime }, () => {
                console.log("Background: Script started.");
            });

            // Start running time updater
            intervalId = setInterval(() => {
                if (!isRunning || !startTime) return;
                const elapsed = Date.now() - startTime;
                const hours = String(Math.floor(elapsed / 3600000)).padStart(2, '0');
                const minutes = String(Math.floor((elapsed % 3600000) / 60000)).padStart(2, '0');
                const seconds = String(Math.floor((elapsed % 60000) / 1000)).padStart(2, '0');
                const runningTime = `${hours}:${minutes}:${seconds}`;
                chrome.storage.local.set({ runningTime: runningTime }, () => {
                    // Optional: Log running time updates
                });
            }, 1000);

            sendResponse({ status: "started" });
        } else {
            sendResponse({ status: "already_running" });
        }
    } else if (request.action === "stop") {
        if (isRunning) {
            isRunning = false;
            startTime = null;
            chrome.storage.local.set({ isRunning: false, startTime: null, runningTime: "00:00:00" }, () => {
                console.log(`Background: Script stopped. Reason: ${request.reason}`);
            });

            // Stop running time updater
            if (intervalId) {
                clearInterval(intervalId);
                intervalId = null;
            }

            sendResponse({ status: "stopped" });

            // Handle notifications if a notification message is received
            if (request.reason.includes("reached")) {
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: 'icons/icon.png',
                    title: 'AutoBet Stopped',
                    message: `AutoBet has been stopped: ${request.reason.replace(/_/g, ' ')}`,
                    priority: 2
                });
            }
        } else {
            sendResponse({ status: "not_running" });
        }
    } else if (request.action === "getStatus") {
        sendResponse({ isRunning: isRunning, runningTime: formatRunningTime() });
    } else if (request.action === "notify") {
        // Optional: Handle additional notifications
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon.png',
            title: 'AutoBet Notification',
            message: request.message,
            priority: 2
        });
    }
    return true; // Keep the message channel open for sendResponse
});

// Helper function to format running time
function formatRunningTime() {
    if (!isRunning || !startTime) return "00:00:00";
    const elapsed = Date.now() - startTime;
    const hours = String(Math.floor(elapsed / 3600000)).padStart(2, '0');
    const minutes = String(Math.floor((elapsed % 3600000) / 60000)).padStart(2, '0');
    const seconds = String(Math.floor((elapsed % 60000) / 1000)).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}
