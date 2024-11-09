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

// XPath for the blue countdown bar
const BLUE_BAR_XPATH = '//*[@id="main-content"]/div/div[1]/div[2]/div[4]/div';

// XPaths for action buttons
const ACTION_BUTTONS = {
    space: '//*[@id="main-content"]/div/div[1]/div[1]/button', // Space key
    s: '//*[@id="main-content"]/div/div[1]/div[1]/label[1]/div/div[2]/button[2]', // 's' key
    a: '//*[@id="main-content"]/div/div[1]/div[1]/label[1]/div/div[2]/button[1]'  // 'a' key
};

// XPath for bet size input
const BET_SIZE_XPATH = '//*[@id="main-content"]/div/div[1]/div[1]/label[1]/div/div[1]/input';

// Initialize state variables
let multipliersToCheck = 4; // Default value, can be updated via settings
let lastMultipliers = [];
let sPressCount = 0;
let betsMade = 0;
let profitTimes = 0;
let startTime = null;
let botInterval = null;
let networkInterval = null;
let lastMultiplierChangeTime = Date.now();
let isRunning = false;

// Load stored profitTimes and startTime on script start
chrome.storage.local.get(['profitTimes', 'startTime'], (result) => {
    if (result.profitTimes !== undefined) {
        profitTimes = result.profitTimes;
    }
    if (result.startTime && isRunning) {
        startTime = result.startTime;
    }
});

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
        button.click();
        console.log(`Clicked button with XPath: ${xpath}`);
    } else {
        console.log(`Button not found for XPath: ${xpath}`);
    }
}

// Function to input bet size
function setBetSize(betSize) {
    const inputField = getElementByXpath(BET_SIZE_XPATH);
    if (inputField) {
        inputField.value = betSize;
        // Dispatch input events to ensure the webpage registers the change
        inputField.dispatchEvent(new Event('input', { bubbles: true }));
        inputField.dispatchEvent(new Event('change', { bubbles: true }));
        console.log(`Bet size set to ${betSize}`);
    } else {
        console.log(`Bet size input field not found at XPath: ${BET_SIZE_XPATH}`);
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
    try {
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

        // Check if multipliers have changed
        const multipliersChanged = !arraysEqual(currentMultipliers, lastMultipliers);
        if (multipliersChanged) {
            lastMultiplierChangeTime = Date.now();
            lastMultipliers = [...currentMultipliers];
            console.log(`Multipliers updated: ${currentMultipliers}`);
            sendNotification('Multiplier Changed', `New multipliers: ${currentMultipliers.join(', ')}x`);
        } else {
            console.log('Multipliers have not changed since the last check.');
            // Do not proceed with actions if multipliers haven't changed
            return;
        }

        // Ensure we have enough multipliers to check
        if (currentMultipliers.length < multipliersToCheck) {
            console.log(`Not enough multipliers read to check (${multipliersToCheck} required).`);
            return;
        }

        // Update multipliers to check based on user input
        const multipliersToEvaluate = currentMultipliers.slice(0, multipliersToCheck);
        console.log(`Checking first ${multipliersToCheck} multipliers: ${multipliersToEvaluate}`);

        // Check if all specified multipliers are below 2x
        const allBelow2 = multipliersToEvaluate.every(m => m < 2);

        // Check if blue bar is present
        const blueBarPresent = isBlueBarPresent();
        console.log(`Blue bar present: ${blueBarPresent}`);

        if (blueBarPresent) {
            if (allBelow2) {
                // Press 'space' and 's'
                clickButton(ACTION_BUTTONS.space);
                clickButton(ACTION_BUTTONS.s);
                sPressCount += 1;
                betsMade += 1;
                profitTimes += 1; // Increment profitTimes when sPressCount > 0

                // Save updated profitTimes
                chrome.storage.local.set({ profitTimes: profitTimes }, () => {
                    console.log(`Profit Times updated to: ${profitTimes}`);
                });

                // Send notification for profit
                sendNotification('Profit Achieved', `Total Profit Times: ${profitTimes}`);

                console.log(`Pressed 'space' and 's'. Total 's' presses: ${sPressCount}, Bets Made: ${betsMade}, Profit Times: ${profitTimes}`);
                updateStatus();
            } else {
                if (sPressCount > 0) {
                    // Press 'a' sPressCount times
                    for (let i = 0; i < sPressCount; i++) {
                        clickButton(ACTION_BUTTONS.a);
                        betsMade += 1;
                    }
                    console.log(`Pressed 'a' ${sPressCount} time(s). Bets Made: ${betsMade}`);
                    sPressCount = 0; // Reset the counter
                    updateStatus();
                }
            }
        } else {
            console.log("Blue bar not present. Waiting for countdown.");
        }

        console.log("--------------------------------------------------");
    } catch (error) {
        console.error("Error in performAction:", error);
        sendNotification('Error', 'An unexpected error occurred.');
    }
}

// Function to check for network issues
function checkNetworkIssues() {
    const currentTime = Date.now();
    if (currentTime - lastMultiplierChangeTime > 60000) { // 60 seconds
        console.log("No multiplier change detected for 60 seconds. Reloading the page.");
        sendNotification('Network Issue', 'Reloading the page due to no multiplier changes.');
        location.reload();
    }
}

// Function to send notifications
function sendNotification(title, message) {
    chrome.runtime.sendMessage({ type: 'notify', title: title, message: message });
}

// Function to start the bot
function startBot(betSize, multipliersCount) {
    if (!isRunning) {
        setBetSize(betSize);
        multipliersToCheck = multipliersCount;
        isRunning = true;
        startTime = Date.now();
        chrome.storage.local.set({ startTime: startTime }, () => {
            console.log(`Start Time set to: ${startTime}`);
        });
        betsMade = 0;
        profitTimes = 0; // Initialize profitTimes
        sPressCount = 0;

        botInterval = setInterval(performAction, 10000); // 10 seconds
        networkInterval = setInterval(checkNetworkIssues, 10000); // Check every 10 seconds

        console.log("Bot started.");
        sendNotification('Bot Started', 'The game bot has been activated.');
        updateStatus();
    } else {
        console.log("Bot is already running.");
    }
}

// Function to stop the bot
function stopBot() {
    if (isRunning) {
        clearInterval(botInterval);
        clearInterval(networkInterval);
        botInterval = null;
        networkInterval = null;
        isRunning = false;
        sPressCount = 0;

        // Remove startTime from storage
        chrome.storage.local.remove(['startTime'], () => {
            console.log('Start Time removed from storage.');
        });

        console.log("Bot stopped.");
        sendNotification('Bot Stopped', 'The game bot has been deactivated.');
        updateStatus();
    } else {
        console.log("Bot is not running.");
    }
}

// Function to get running time in milliseconds
function getRunningTime() {
    if (!startTime) return 0;
    return Date.now() - startTime;
}

// Function to update status
function updateStatus() {
    chrome.runtime.sendMessage({
        type: 'updateBadge',
        text: isRunning ? `Bet: ${parseFloat(getBetSize()).toFixed(2)}` : 'Off'
    });
}

// Function to get current bet size from the webpage
function getBetSize() {
    const inputField = getElementByXpath(BET_SIZE_XPATH);
    if (inputField) {
        return parseFloat(inputField.value) || 0.01;
    }
    return 0.01;
}

// ------------------- Message Listener -------------------

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "startBot") {
        startBot(request.betSize, request.multipliersCount);
        sendResponse({ status: "Bot started." });
    }
    if (request.action === "stopBot") {
        stopBot();
        sendResponse({ status: "Bot stopped." });
    }
    if (request.action === "getStatus") {
        sendResponse({
            isRunning: isRunning,
            betsMade: betsMade,
            profitTimes: profitTimes,
            runningTime: getRunningTime(),
            multipliersToCheck: multipliersToCheck
        });
    }
});
