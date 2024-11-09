// content.js

// Function to get element by XPath
function getElementByXPath(xpath) {
    const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    return result.singleNodeValue;
}

// Function to retrieve settings from chrome.storage
function getSettings(callback) {
    chrome.storage.sync.get({
        profitThreshold: 1,
        betSize: 0.0001
    }, callback);
}

let intervalId = null;

// Function to set bet size
function setBetSize(betSize) {
    const betSizeInput = getElementByXPath('//*[@id="main-content"]/div/div[1]/div[1]/label[1]/div/div[1]/input');
    if (betSizeInput) {
        betSizeInput.value = betSize;
        // Trigger input event if necessary
        betSizeInput.dispatchEvent(new Event('input', { bubbles: true }));
        console.log(`Bet size set to ${betSize}`);
    } else {
        console.log("Bet size input not found.");
    }
}

// Function to click the menu button
function clickMenuButton() {
    const menuButton = getElementByXPath('//*[@id="main-content"]/div/div[2]/div[1]/div[3]/button');
    if (menuButton) {
        menuButton.click();
        console.log("Clicked the menu button.");
    } else {
        console.log("Menu button not found.");
    }
}

// Function to start the auto-bet script
function startAutoBet(settings) {
    if (intervalId) return; // Prevent multiple intervals

    // Set the bet size once when starting
    setBetSize(settings.betSize);

    intervalId = setInterval(() => {
        const startButton = getElementByXPath('//*[@id="main-content"]/div/div[1]/div[1]/button');
        const profitLabel = getElementByXPath('//*[@id="svelte"]/div[3]/div[2]/div/div[2]/div[1]/div[1]/div/span[1]/span');
        const balanceLabel = getElementByXPath('//*[@id="svelte"]/div[2]/div[3]/div[3]/div/div/div/div[2]/div/div/div/button/div/div/span[1]/span');
        const betSizeLabel = getElementByXPath('//*[@id="main-content"]/div/div[1]/div[1]/label[1]/span/div[2]');

        // Click 'Start Autobet' button if labeled correctly
        if (startButton && startButton.innerText === "Start Autobet") {
            startButton.click();
            console.log("Clicked 'Start Autobet' button.");
        }

        // Retrieve numerical values from labels
        let profit = parseFloat(profitLabel ? profitLabel.innerText : '0');
        let balance = parseFloat(balanceLabel ? balanceLabel.innerText : '0');
        let betSize = parseFloat(betSizeLabel ? betSizeLabel.innerText : '0');

        // Check if profit exceeds threshold
        if (profit > settings.profitThreshold) {
            stopAutoBet();
            console.log(`Profit of ${profit} exceeds threshold of ${settings.profitThreshold}. Stopping script.`);
            return;
        }

        // Check if balance is less than bet size
        if (balance < betSize) {
            stopAutoBet();
            console.log(`Balance of ${balance} is less than bet size of ${betSize}. Stopping script.`);
            return;
        }

        // If profit label not found, click the menu button
        if (!profitLabel) {
            clickMenuButton();
        }
    }, 1000); // Adjust the interval as needed (e.g., every 1 second)
}

// Function to stop the auto-bet script
function stopAutoBet() {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
        console.log("Auto-bet script stopped.");
    }
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "start") {
        getSettings((settings) => {
            startAutoBet(settings);
            // Inform the background script to update status
            chrome.runtime.sendMessage({ action: "start" });
            sendResponse({ status: "started" });
        });
        return true; // Keep the message channel open for sendResponse
    } else if (request.action === "stop") {
        stopAutoBet();
        // Inform the background script to update status
        chrome.runtime.sendMessage({ action: "stop" });
        sendResponse({ status: "stopped" });
        return true; // Keep the message channel open for sendResponse
    }
});
