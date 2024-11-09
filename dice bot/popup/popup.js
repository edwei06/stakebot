// popup/popup.js

document.addEventListener('DOMContentLoaded', () => {
    const profitInput = document.getElementById('profitThreshold');
    const betSizeInput = document.getElementById('betSize');
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const statusText = document.getElementById('statusText');
    const runningTime = document.getElementById('runningTime');

    // Load saved settings
    chrome.storage.sync.get({
        profitThreshold: 1,
        betSize: 0.0001
    }, (items) => {
        profitInput.value = items.profitThreshold;
        betSizeInput.value = items.betSize;
    });

    // Save settings on input change
    function saveSettings() {
        const profit = parseFloat(profitInput.value) || 1;
        const betSize = parseFloat(betSizeInput.value) || 0.0001;
        chrome.storage.sync.set({
            profitThreshold: profit,
            betSize: betSize
        }, () => {
            console.log('Settings saved');
        });
    }

    profitInput.addEventListener('change', saveSettings);
    betSizeInput.addEventListener('change', saveSettings);

    // Start AutoBet
    startBtn.addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length === 0) {
                statusText.textContent = "No active tab.";
                statusText.style.color = "#ff0000";
                return;
            }

            chrome.tabs.sendMessage(tabs[0].id, { action: "start" }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error("Error starting script:", chrome.runtime.lastError.message);
                    statusText.textContent = "Error starting script.";
                    statusText.style.color = "#ff0000";
                } else {
                    if (response.status === "started") {
                        statusText.textContent = "Running";
                        statusText.style.color = "#00ff00";
                    } else if (response.status === "already_running") {
                        statusText.textContent = "Already Running";
                        statusText.style.color = "#ffff00";
                    } else {
                        statusText.textContent = "Failed to Start";
                        statusText.style.color = "#ff0000";
                    }
                }
            });
        });
    });

    // Stop AutoBet
    stopBtn.addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length === 0) {
                statusText.textContent = "No active tab.";
                statusText.style.color = "#ff0000";
                return;
            }

            chrome.tabs.sendMessage(tabs[0].id, { action: "stop" }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error("Error stopping script:", chrome.runtime.lastError.message);
                    statusText.textContent = "Error stopping script.";
                    statusText.style.color = "#ff0000";
                } else {
                    if (response.status === "stopped") {
                        statusText.textContent = "Stopped";
                        statusText.style.color = "#ff0000";
                    } else if (response.status === "not_running") {
                        statusText.textContent = "Not Running";
                        statusText.style.color = "#ffff00";
                    } else {
                        statusText.textContent = "Failed to Stop";
                        statusText.style.color = "#ff0000";
                    }
                }
            });
        });
    });

    // Function to update status from background
    function updateStatus() {
        chrome.runtime.sendMessage({ action: "getStatus" }, (response) => {
            if (chrome.runtime.lastError) {
                console.error("Error retrieving status:", chrome.runtime.lastError.message);
                statusText.textContent = "Error retrieving status.";
                statusText.style.color = "#ff0000";
                return;
            }

            if (response) {
                if (response.isRunning) {
                    statusText.textContent = "Running";
                    statusText.style.color = "#00ff00";
                } else {
                    statusText.textContent = "Stopped";
                    statusText.style.color = "#ff0000";
                }
                runningTime.textContent = response.runningTime || "00:00:00";
            }
        });
    }

    // Initial status update
    updateStatus();

    // Listen for storage changes to update status in real-time
    chrome.storage.onChanged.addListener((changes, area) => {
        if (area === "local") {
            if (changes.isRunning || changes.runningTime) {
                updateStatus();
            }
        }
    });

    // Set up an interval to periodically update the status
    setInterval(updateStatus, 1000);
});
