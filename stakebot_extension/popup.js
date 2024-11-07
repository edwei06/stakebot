// popup.js

document.getElementById('startBot').addEventListener('click', () => {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {action: "startBot"}, (response) => {
            document.getElementById('status').innerText = response.status;
        });
    });
});

document.getElementById('stopBot').addEventListener('click', () => {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {action: "stopBot"}, (response) => {
            document.getElementById('status').innerText = response.status;
        });
    });
});
