// contentScript.js

// ------------------- Configuration -------------------

// Updated XPaths for multipliers 1 to 5
const MULTIPLIER_XPATHS = [
    '//*[@id="main-content"]/div/div[1]/div[2]/div[2]/div/div/button[1]', // Multiplier 1
    '//*[@id="main-content"]/div/div[1]/div[2]/div[2]/div/div/button[2]', // Multiplier 2
    '//*[@id="main-content"]/div/div[1]/div[2]/div[2]/div/div/button[3]', // Multiplier 3
    '//*[@id="main-content"]/div/div[1]/div[2]/div[2]/div/div/button[4]', // Multiplier 4
    '//*[@id="main-content"]/div/div[1]/div[2]/div[2]/div/div/button[5]'  // Multiplier 5
];

// XPaths for the blue countdown bar
const BLUE_BAR_XPATH = '//*[@id="main-content"]/div/div[1]/div[2]/div[4]/div';

// XPaths for action buttons
const ACTION_BUTTONS = {
    space: '//*[@id="main-content"]/div/div[1]/div[1]/button', // Space key
    s: '//*[@id="main-content"]/div/div[1]/div[1]/label[1]/div/div[2]/button[2]', // 's' key
    a: '//*[@id="main-content"]/div/div[1]/div[1]/label[1]/div/div[2]/button[1]'  // 'a' key
};

// Initialize state variables
let lastMultipliers = [];
let sPressCount = 0;
let botInterval = null;

// User-configurable settings
let betSize = 0.01;
let requiredMultipliers = 4;

// Initialize timer variables for network issues
let lastChangeTime = null;
const NETWORK_THRESHOLD = 60000; // 30 seconds

// Initialize bet count
let betCount = 0;

// ------------------- Helper Functions -------------------

// Function to evaluate XPath and return the first matching element
function getElementByXpath(path) {
    return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}

// Function to read multiplier value from a button element
function readMultiplier(element) {
    if (element) {
        const text = element.innerText.trim().replace('x', '').replace('X', '').replace(' ', '');
        const multiplier = parseFloat(text);
        if (!isNaN(multiplier)) {
            return multiplier;
        }
    }
    return null;
}

// Function to check if the blue bar is present (visible)
function isBlueBarPresent() {
    const blueBar = getElementByXpath(BLUE_BAR_XPATH);
    if (blueBar) {
        // Additional checks can be added here if needed
        return true;
    }
    return false;
}

// Function to simulate button clicks
function clickButton(xpath) {
    const button = getElementByXpath(xpath);
    if (button) {
        // Create and dispatch a MouseEvent to ensure the game registers the click
        const event = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true
        });
        button.dispatchEvent(event);
        console.log(`Clicked button with XPath: ${xpath}`);
    } else {
        console.error(`Button not found for XPath: ${xpath}`);
    }
}

// Function to compare two arrays for equality
function arraysEqual(a, b) {
    if (a.length !== b.length) return false;
    for(let i = 0; i < a.length; i++) {
        if(a[i] !== b[i]) return false;
    }
    return true;
}

// Function to perform the main logic
function performAction() {
    let currentMultipliers = [];

    // Read multipliers 1 to 5
    MULTIPLIER_XPATHS.forEach((xpath, index) => {
        const element = getElementByXpath(xpath);
        if (element) {
            const multiplier = readMultiplier(element);
            if (multiplier !== null) {
                currentMultipliers.push(multiplier);
                console.log(`Multiplier ${index + 1}: ${multiplier}x`);
            } else {
                console.log(`Multiplier ${index + 1}: Failed to read.`);
            }
        } else {
            console.log(`Multiplier ${index + 1}: Element not found.`);
        }
    });

    // Ensure we have enough multipliers
    if (currentMultipliers.length < requiredMultipliers) {
        sendStatusUpdate("Not enough multipliers read. Skipping this iteration.");
        return; // Skip iteration if not enough multipliers
    }

    // Select the last 'requiredMultipliers' multipliers
    const selectedMultipliers = currentMultipliers.slice(-requiredMultipliers);

    // Check for duplicate multiplier sets
    if (arraysEqual(selectedMultipliers, lastMultipliers)) {
        // No change, update network timer
        sendStatusUpdate("Multipliers unchanged.");
        return;
    } else {
        lastMultipliers = [...selectedMultipliers];
        lastChangeTime = Date.now(); // Update the last change time
        console.log(`Multiplier set changed: ${selectedMultipliers}`);
    }

    // Update lastMultipliers
    // Check if all selected multipliers are below 2x
    const allBelow2 = selectedMultipliers.every(m => m < 2);

    // Check if blue bar is present
    const blueBarPresent = isBlueBarPresent();
    console.log(`Blue bar present: ${blueBarPresent}`);

    if (blueBarPresent) {
        if (allBelow2) {
            // Press 'space' and 's' based on bet size
            for (let i = 0; i < betSize; i++) {
                clickButton(ACTION_BUTTONS.space);
                clickButton(ACTION_BUTTONS.s);
                sPressCount += 1;
                betCount += 1; // Increment bet count
            }
            console.log(`Pressed 'space' and 's' for bet size: ${betSize}. Total 's' presses: ${sPressCount}`);
        } else {
            if (sPressCount > 0) {
                // Press 'a' the same number of times as 's' was pressed
                for (let i = 0; i < sPressCount; i++) {
                    clickButton(ACTION_BUTTONS.a);
                }
                console.log(`Pressed 'a' ${sPressCount} time(s).`);
                sPressCount = 0; // Reset the counter
            }
        }
    } else {
        console.log("Blue bar not present. Waiting for countdown.");
    }

    // Send status update
    sendStatusUpdate("Bot is running.");
    console.log("--------------------------------------------------");
}

// Function to handle network issues by checking multiplier changes
function handleNetworkIssues() {
    if (!lastChangeTime) return; // If the bot hasn't started, do nothing

    const currentTime = Date.now();
    const elapsed = currentTime - lastChangeTime;

    if (elapsed > NETWORK_THRESHOLD) {
        console.log("No multiplier change detected for 30 seconds. Reloading page...");
        window.location.reload();
    }
}

// Function to send status updates to the popup
function sendStatusUpdate(status) {
    let elapsedTime = '0s';
    if (startTime) {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        elapsedTime = `${elapsed}s`;
    }

    chrome.runtime.sendMessage({
        type: "updateStatus",
        status: status,
        bets: betCount,
        time: elapsedTime
    });
}

// ------------------- Control Functions -------------------

// Function to start the bot
function startBot(userBetSize, userRequiredMultipliers) {
    if (!botInterval) {
        betSize = parseFloat(userBetSize) || 0.01;
        requiredMultipliers = parseInt(userRequiredMultipliers) || 4;

        // Set the bet size on the webpage
        const betInput = getElementByXpath('//*[@id="main-content"]/div/div[1]/div[1]/label[1]/div/div[1]/input');
        if (betInput) {
            betInput.value = betSize;
            // Trigger input event to ensure the webpage registers the change
            const event = new Event('input', { bubbles: true });
            betInput.dispatchEvent(event);
            console.log(`Bet size set to: ${betSize}`);
        } else {
            console.error("Bet size input element not found.");
        }

        botInterval = setInterval(() => {
            performAction();
            handleNetworkIssues();
        }, 1000); // 1 second interval
        console.log("Bot started.");
        sendStatusUpdate("Bot started.");
    } else {
        console.log("Bot is already running.");
    }
}

// Function to stop the bot
function stopBot() {
    if (botInterval) {
        clearInterval(botInterval);
        botInterval = null;
        sPressCount = 0; // Reset counter
        lastMultipliers = [];
        betCount = 0; // Reset bet count
        lastChangeTime = null; // Reset network timer
        console.log("Bot stopped.");
        sendStatusUpdate("Bot stopped.");
    } else {
        console.log("Bot is not running.");
    }
}

// ------------------- Message Listener -------------------

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "startBot") {
        const userBetSize = request.betSize || 0.01;
        const userRequiredMultipliers = request.requiredMultipliers || 4;
        startBot(userBetSize, userRequiredMultipliers);
        sendResponse({status: `Bot started with bet size: ${betSize} and required multipliers: ${requiredMultipliers}`});
    }
    if (request.action === "stopBot") {
        stopBot();
        sendResponse({status: "Bot stopped."});
    }
});