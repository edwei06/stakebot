// popup.js

let betCount = 0;
let timerInterval = null;
let startTime = null;

// Update the popup with status, bets, and timer
function updatePopup(status, bets, time) {
    document.getElementById('status').innerText = status;
    document.getElementById('bets').innerText = `Total Bets: ${bets}`;
    document.getElementById('timer').innerText = `Elapsed Time: ${time}`;
}

// Listen for messages from the content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "updateStatus") {
        updatePopup(request.status, request.bets, request.time);
    }
});

// Start Bot Button
document.getElementById('startBot').addEventListener('click', () => {
    const betSize = parseFloat(document.getElementById('betSize').value) || 0.01;
    const requiredMultipliers = parseInt(document.getElementById('requiredMultipliers').value) || 4;

    // Validate inputs
    if (betSize < 0.01) {
        alert("Bet size must be at least 0.01");
        return;
    }
    if (requiredMultipliers < 1 || requiredMultipliers > 5) {
        alert("Required multipliers must be between 1 and 5");
        return;
    }

    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {action: "startBot", betSize: betSize, requiredMultipliers: requiredMultipliers}, (response) => {
            updatePopup(response.status, betCount, "0s");
            startTime = Date.now();
            if (timerInterval) clearInterval(timerInterval);
            timerInterval = setInterval(() => {
                const elapsed = Math.floor((Date.now() - startTime) / 1000);
                document.getElementById('timer').innerText = `Elapsed Time: ${elapsed}s`;
            }, 1000);
        });
    });
});

// Stop Bot Button
document.getElementById('stopBot').addEventListener('click', () => {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {action: "stopBot"}, (response) => {
            updatePopup(response.status, betCount, "0s");
            if (timerInterval) clearInterval(timerInterval);
            timerInterval = null;
            startTime = null;
        });
    });
});