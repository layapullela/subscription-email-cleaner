document.addEventListener('DOMContentLoaded', async () => {
  const statusEl = document.getElementById('status');
  const sendersListEl = document.getElementById('senders-list');
  const cleanEmailsBtn = document.getElementById('clean-emails');

  if (!statusEl || !sendersListEl || !cleanEmailsBtn) {
    console.error('Required elements are missing in the DOM');
    return;
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (!tab.url.includes('mail.google.com')) {
    statusEl.textContent = 'Please open Gmail to use this extension';
    return;
  }

  statusEl.textContent = 'Loading senders...';
  
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: getSenders,
  }, (results) => {
    if (results && results[0] && results[0].result) {
      displaySenders(results[0].result);
    }
  });

  cleanEmailsBtn.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        function: cleanSubscriptionEmails
      });
    });
  });
});

function displaySenders(senders) {
  const container = document.getElementById('senders-list');
  const statusEl = document.getElementById('status');
  
  if (Object.keys(senders).length === 0) {
    statusEl.textContent = 'No senders found';
    return;
  }

  statusEl.textContent = `Found ${Object.keys(senders).length} senders`;
  
  Object.entries(senders)
    .sort(([,a], [,b]) => b - a)
    .forEach(([sender, count]) => {
      const div = document.createElement('div');
      div.className = 'sender-item';
      div.innerHTML = `
        <span>${sender}</span>
        <span class="sender-count">${count}</span>
      `;
      container.appendChild(div);
    });
}

function getSenders() {
  const senders = {};
  const emailElements = document.querySelectorAll('span[email]');
  
  emailElements.forEach(el => {
    const email = el.getAttribute('email');
    senders[email] = (senders[email] || 0) + 1;
  });
  
  return senders;
}

function cleanSubscriptionEmails() {
  console.log("Cleaning subscription emails...");
  // ...add your email cleaning logic here...
}
