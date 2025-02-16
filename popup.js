document.getElementById('clean-emails').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      function: cleanSubscriptionEmails
    });
  });
});

function cleanSubscriptionEmails() {
  // This function will contain the logic to clean subscription emails
  console.log("Cleaning subscription emails...");
  // ...add your email cleaning logic here...
}
