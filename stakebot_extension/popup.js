// popup.js

let statusInterval = null;

// Function to format time in HH:MM:SS
function formatTime(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}

// Function to update status display
function updateStatus() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length === 0) return;
        chrome.tabs.sendMessage(tabs[0].id, { action: "getStatus" }, (response) => {
            if (chrome.runtime.lastError) {
                // Content script not available
                document.getElementById('botStatus').innerText = 'Stopped';
                document.getElementById('betsMade').innerText = '0';
                document.getElementById('profitTimes').innerText = '0';
                document.getElementById('runningTime').innerText = '00:00:00';
                document.getElementById('multipliersToCheck').innerText = '4'; // Default value
                return;
            }
            if (response) {
                document.getElementById('botStatus').innerText = response.isRunning ? 'Running' : 'Stopped';
                document.getElementById('betsMade').innerText = response.betsMade;
                document.getElementById('profitTimes').innerText = response.profitTimes;
                document.getElementById('runningTime').innerText = formatTime(response.runningTime);
                document.getElementById('multipliersToCheck').innerText = response.multipliersCount ; // Display multipliersCount
            }
        });
    });
}

// Function to handle start button click
document.getElementById('startBot').addEventListener('click', () => {
    const betSizeInput = parseFloat(document.getElementById('betSize').value);
    const multipliersCountInput = parseInt(document.getElementById('multipliersCount').value, 10);

    // Validate Bet Size Input
    if (isNaN(betSizeInput) || betSizeInput < 0.01) {
        displayMessage('Invalid bet size.', 'error');
        return;
    }

    // Validate Multipliers Count Input
    if (isNaN(multipliersCountInput) || multipliersCountInput < 1 || multipliersCountInput > 5) {
        displayMessage('Multipliers to check must be between 1 and 5.', 'error');
        return;
    }

    // Clear any previous messages
    clearMessage();

    // Save settings to Chrome storage
    chrome.storage.local.set({ betSize: betSizeInput, multipliersCount: multipliersCountInput }, () => {
        console.log(`Settings saved: Bet Size = ${betSizeInput}, Multipliers to Check = ${multipliersCountInput}`);
        
        // Send startBot message with settings to content script
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length === 0) {
                displayMessage('No active tab found.', 'error');
                return;
            }
            chrome.tabs.sendMessage(tabs[0].id, { action: "startBot", betSize: betSizeInput, multipliersCount: multipliersCountInput }, (response) => {
                if (chrome.runtime.lastError) {
                    displayMessage('Bot could not be started. Ensure you are on the game page.', 'error');
                    return;
                }
                if (response && response.status) {
                    displayMessage(response.status, 'success');
                }
            });
        });

        // Start updating the status
        if (statusInterval) clearInterval(statusInterval);
        statusInterval = setInterval(updateStatus, 1000); // Update every second
        updateStatus(); // Initial update
    });
});

// Function to handle stop button click
document.getElementById('stopBot').addEventListener('click', () => {
    // Send stopBot message to content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length === 0) {
            displayMessage('No active tab found.', 'error');
            return;
        }
        chrome.tabs.sendMessage(tabs[0].id, { action: "stopBot" }, (response) => {
            if (chrome.runtime.lastError) {
                displayMessage('Bot could not be stopped. Ensure you are on the game page.', 'error');
                return;
            }
            if (response && response.status) {
                displayMessage(response.status, 'success');
            }
        });
    });

    // Clear status interval
    if (statusInterval) {
        clearInterval(statusInterval);
        statusInterval = null;
    }

    // Reset status display
    document.getElementById('botStatus').innerText = 'Stopped';
    document.getElementById('betsMade').innerText = '0';
    document.getElementById('profitTimes').innerText = '0';
    document.getElementById('runningTime').innerText = '00:00:00';
    displayMessage('', ''); // Clear any messages
});

// Function to display messages with appropriate styling
function displayMessage(message, type) {
    const messageDiv = document.getElementById('message');
    messageDiv.innerText = message;
    messageDiv.className = ''; // Reset classes

    if (type === 'success') {
        messageDiv.classList.add('success');
    } else if (type === 'error') {
        messageDiv.classList.add('error');
    }
}

// Function to clear messages
function clearMessage() {
    const messageDiv = document.getElementById('message');
    messageDiv.innerText = '';
    messageDiv.className = '';
}

// Update status when popup is opened
document.addEventListener('DOMContentLoaded', () => {
    updateStatus();
});