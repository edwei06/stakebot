// content.js

// Function to get element by multiple XPaths
function getElementByMultipleXPaths(xpaths) {
    for (let xpath of xpaths) {
        const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        if (result.singleNodeValue) {
            return result.singleNodeValue;
        }
    }
    return null;
}

// Function to find the profit label dynamically
function findProfitLabel() {
    const spans = document.querySelectorAll('#svelte span');
    for (let span of spans) {
        const parentText = span.parentElement ? span.parentElement.innerText : '';
        if (parentText.includes('Profit')) {
            return span;
        }
    }
    return null;
}

// Function to retrieve settings from chrome.storage
function getSettings(callback) {
    chrome.storage.sync.get({
        profitThreshold: 1,
        minProfitThreshold: 0, // Default minimum profit
        betSize: 0.0001,
        autoClickInstantBet: false
    }, callback);
}

let intervalId = null;

// Function to set bet size
function setBetSize(betSize) {
    const betSizeInput = getElementByMultipleXPaths([
        '//*[@id="main-content"]/div/div[1]/div[1]/label[1]/div/div[1]/input',
        '//*[@id="main-content"]/div/div[2]/div[1]/label[1]/div/div[1]/input' // Add more XPaths as needed
    ]);
    if (betSizeInput) {
        betSizeInput.value = betSize;
        // Trigger input event if necessary
        betSizeInput.dispatchEvent(new Event('input', { bubbles: true }));
        console.log(`Bet size set to ${betSize}`);
    } else {
        console.log("Bet size input not found.");
    }
}

// NEW: Function to click the specified initial button
function clickInitialButton() {
    const initialButton = getElementByMultipleXPaths([
        '//*[@id="main-content"]/div/div[1]/div[1]/div[1]/div/div/button[3]',
        '//*[@id="main-content"]/div/div[1]/div[1]/div[1]/div/div/button[3]'
    ]);
    if (initialButton) {
        initialButton.click();
        console.log("Clicked the initial button at the start of the script.");
    } else {
        console.log("Initial button not found.");
    }
}

// Function to click the menu button to open bet settings
function openBetSettingsMenu() {
    const menuButton = getElementByMultipleXPaths([
        '//*[@id="main-content"]/div/div[2]/div[1]/div[1]/div[1]/button',
        '//*[@id="main-content"]/div/div[3]/div[1]/div[1]/div[1]/button' // Add more XPaths if necessary
    ]);
    if (menuButton) {
        menuButton.click();
        console.log("Clicked 'Bet Settings' menu button.");
    } else {
        console.log("Bet Settings menu button not found.");
    }
}

// Function to click the "Instant Bet" button if it's not already active
function clickInstantBetButton() {
    const buttons = document.querySelectorAll('button');
    for (const button of buttons) {
        // Trim whitespace and compare text
        if (button.innerText.trim() === "Instant Bet") {
            button.click();
            console.log("Clicked 'Instant Bet' button.");
            return;
        }
    }
    console.log("Instant Bet button not found.");
}


// Function to click the main menu button (for other functionalities)
function clickMenuButton() {
    const menuButton = getElementByMultipleXPaths([
        '//*[@id="main-content"]/div/div[2]/div[1]/div[3]/button',
        '//*[@id="main-content"]/div/div[3]/div[1]/div[3]/button' // Add more XPaths as needed
    ]);
    if (menuButton) {
        menuButton.click();
        console.log("Clicked the main menu button.");
    } else {
        console.log("Main menu button not found.");
    }
}

// Function to start the auto-bet script
function startAutoBet(settings) {
    if (intervalId) return; // Prevent multiple intervals
    
    clickInitialButton();
    // Set the bet size once when starting
    setBetSize(settings.betSize);

    // If autoClickInstantBet is enabled, perform the clicking actions
    if (settings.autoClickInstantBet) {
        openBetSettingsMenu();
        // Optionally, add a short delay to ensure the menu is open before clicking the button
        setTimeout(() => {
            clickInstantBetButton();
        }, 500); // 500ms delay; adjust as necessary
    }

    intervalId = setInterval(() => {
        const startButton = getElementByMultipleXPaths([
            '//*[@id="main-content"]/div/div[1]/div[1]/button',
            '//*[@id="main-content"]/div/div[2]/div[1]/button' // Add more XPaths as needed
        ]);

        // Attempt to find the profit label using both XPath and dynamic methods
        let profitLabel = getElementByMultipleXPaths([
            '//*[@id="svelte"]/div[3]/div[2]/div/div[2]/div[1]/div[1]/div/span[1]/span',
            '//*[@id="svelte"]/div[4]/div[2]/div/div[2]/div[1]/div[1]/div/span[1]/span'
        ]) || findProfitLabel();

        const balanceLabel = getElementByMultipleXPaths([
            '//*[@id="svelte"]/div[2]/div[3]/div[3]/div/div/div/div[2]/div/div/div/button/div/div/span[1]/span',
            '//*[@id="svelte"]/div[3]/div[3]/div[3]/div/div/div/div[2]/div/div/div/button/div/div/span[1]/span'
        ]);

        const betSizeLabel = getElementByMultipleXPaths([
            '//*[@id="main-content"]/div/div[1]/div[1]/label[1]/span/div[2]',
            '//*[@id="main-content"]/div/div[2]/div[1]/label[1]/span/div[2]'
        ]);

        // Click 'Start Autobet' button if labeled correctly
        if (startButton && startButton.innerText.trim() === "Start Autobet") {
            startButton.click();
            console.log("Clicked 'Start Autobet' button.");
        }

        // Retrieve numerical values from labels
        let profit = parseFloat(profitLabel ? profitLabel.innerText : '0');
        let balance = parseFloat(balanceLabel ? balanceLabel.innerText : '0');
        let betSize = parseFloat(betSizeLabel ? betSizeLabel.innerText : '0');

        // Check if profit exceeds maximum threshold
        if (profit > settings.profitThreshold) {
            console.log(`Profit of ${profit} exceeds threshold of ${settings.profitThreshold}. Stopping script.`);
            stopAutoBet("profit_threshold_reached");
            return;
        }

        // Check if profit is below minimum threshold
        if (profit < settings.minProfitThreshold) {
            console.log(`Profit of ${profit} is below minimum threshold of ${settings.minProfitThreshold}. Stopping script.`);
            stopAutoBet("min_profit_threshold_reached");
            return;
        }

        // Check if balance is less than bet size
        if (balance < betSize) {
            console.log(`Balance of ${balance} is less than bet size of ${betSize}. Stopping script.`);
            stopAutoBet("balance_insufficient");
            return;
        }

        // If profit label not found, click the main menu button
        if (!profitLabel) {
            clickMenuButton();
        }
    }, 1000); // Adjust the interval as needed (e.g., every 1 second)
}

// Function to stop the auto-bet script
function stopAutoBet(reason = "manual_stop") {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
        console.log("Auto-bet script stopped.");
    }

    // Additionally, check if the start button shows "Stop Autobet" and click it
    const startButton = getElementByMultipleXPaths([
        '//*[@id="main-content"]/div/div[1]/div[1]/button',
        '//*[@id="main-content"]/div/div[2]/div[1]/button' // Add more XPaths as needed
    ]);
    if (startButton && startButton.innerText.trim() === "Stop Autobet") {
        startButton.click();
        console.log("Clicked 'Stop Autobet' button to halt auto-betting on the webpage.");
    }

    // Inform the background script to update status
    chrome.runtime.sendMessage({ action: "stop", reason: reason }, (response) => {
        if (chrome.runtime.lastError) {
            console.error("Error sending stop message to background:", chrome.runtime.lastError.message);
        } else {
            console.log("Background script acknowledged stop action:", response.status);
        }
    });

    // Optional: Notify the user via notifications (if implemented)
    chrome.runtime.sendMessage({ action: "notify", message: `AutoBet stopped: ${reason.replace(/_/g, ' ')}` });
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "start") {
        getSettings((settings) => {
            startAutoBet(settings);
            // Inform the background script to update status
            chrome.runtime.sendMessage({ action: "start" }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error("Error sending start message to background:", chrome.runtime.lastError.message);
                } else {
                    console.log("Background script acknowledged start action:", response.status);
                }
            });
            sendResponse({ status: "started" });
        });
        return true; // Keep the message channel open for sendResponse
    } else if (request.action === "stop") {
        stopAutoBet("manual_stop");
        sendResponse({ status: "stopped" });
        return true; // Keep the message channel open for sendResponse
    }
});
