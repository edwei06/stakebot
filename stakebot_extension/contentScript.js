// contentScript.js

// ------------------- Configuration -------------------

// XPaths for multipliers 2 to 5
const MULTIPLIER_XPATHS = [
    '//*[@id="main-content"]/div/div[1]/div[2]/div[2]/div/div/button[1]', // Multiplier 2
    '//*[@id="main-content"]/div/div[1]/div[2]/div[2]/div/div/button[2]', // Multiplier 3
    '//*[@id="main-content"]/div/div[1]/div[2]/div[2]/div/div/button[3]', // Multiplier 4
    '//*[@id="main-content"]/div/div[1]/div[2]/div[2]/div/div/button[4]'  // Multiplier 5
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
let lastFourMultipliers = [];
let sPressCount = 0;
let previousMultiplierSet = [];
let botInterval = null;

// Interval timing (in milliseconds)
const CHECK_INTERVAL = 1000; // 1 second

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

    // Read multipliers 2 to 5
    MULTIPLIER_XPATHS.forEach((xpath, index) => {
        const element = getElementByXpath(xpath);
        if (element) {
            const multiplier = readMultiplier(element);
            if (multiplier !== null) {
                currentMultipliers.push(multiplier);
                console.log(`Multiplier ${index + 2}: ${multiplier}x`);
            } else {
                console.log(`Multiplier ${index + 2}: Failed to read.`);
            }
        } else {
            console.log(`Multiplier ${index + 2}: Element not found.`);
        }
    });

    // Ensure we have at least 4 multipliers
    if (currentMultipliers.length < 4) {
        console.log("Not enough multipliers read. Skipping this iteration.");
        return;
    }

    // Check for duplicate multiplier sets
    if (arraysEqual(currentMultipliers, previousMultiplierSet)) {
        console.log("Multiplier set is identical to the previous one. No action taken.");
        return;
    } else {
        previousMultiplierSet = [...currentMultipliers];
    }

    // Update lastFourMultipliers
    lastFourMultipliers = currentMultipliers.slice(-4);
    console.log(`Last four multipliers: ${lastFourMultipliers}`);

    // Check if all last four multipliers are below 2x
    const allBelow2 = lastFourMultipliers.every(m => m < 2);

    // Check if blue bar is present
    const blueBarPresent = isBlueBarPresent();
    console.log(`Blue bar present: ${blueBarPresent}`);

    if (blueBarPresent) {
        if (allBelow2) {
            // Press 'space' and 's'
            clickButton(ACTION_BUTTONS.space);
            clickButton(ACTION_BUTTONS.s);
            sPressCount += 1;
            console.log(`Pressed 'space' and 's'. Total 's' presses: ${sPressCount}`);
        } else {
            if (sPressCount > 0) {
                // Press 'a' sPressCount times
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

    console.log("--------------------------------------------------");
}

// ------------------- Control Functions -------------------

// Function to start the bot
function startBot() {
    if (!botInterval) {
        botInterval = setInterval(performAction, CHECK_INTERVAL);
        console.log("Bot started.");
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
        console.log("Bot stopped.");
    } else {
        console.log("Bot is not running.");
    }
}

// ------------------- Message Listener -------------------

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "startBot") {
        startBot();
        sendResponse({status: "Bot started."});
    }
    if (request.action === "stopBot") {
        stopBot();
        sendResponse({status: "Bot stopped."});
    }
});
