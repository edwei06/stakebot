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
            chrome.storage.local.set({ isRunning: true, startTime: startTime });

            // Start running time updater
            intervalId = setInterval(() => {
                const elapsed = Date.now() - startTime;
                const hours = String(Math.floor(elapsed / 3600000)).padStart(2, '0');
                const minutes = String(Math.floor((elapsed % 3600000) / 60000)).padStart(2, '0');
                const seconds = String(Math.floor((elapsed % 60000) / 1000)).padStart(2, '0');
                const runningTime = `${hours}:${minutes}:${seconds}`;
                chrome.storage.local.set({ runningTime: runningTime });
            }, 1000);

            sendResponse({ status: "started" });
        } else {
            sendResponse({ status: "already_running" });
        }
    } else if (request.action === "stop") {
        if (isRunning) {
            isRunning = false;
            startTime = null;
            chrome.storage.local.set({ isRunning: false, startTime: null, runningTime: "00:00:00" });

            // Stop running time updater
            clearInterval(intervalId);
            intervalId = null;

            sendResponse({ status: "stopped" });
        } else {
            sendResponse({ status: "not_running" });
        }
    } else if (request.action === "getStatus") {
        sendResponse({ isRunning: isRunning, runningTime: formatRunningTime() });
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
