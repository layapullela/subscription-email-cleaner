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

  statusEl.textContent = 'Navigating to All Mail...';
  
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: navigateToAllMail,
  }, () => {
    statusEl.textContent = 'Loading senders...';
    const allSenders = {};
    collectAllSenders(tab.id, 1, allSenders);
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

function navigateToAllMail() {
  window.location.href = 'https://mail.google.com/mail/u/0/#all';
}

function collectAllSenders(tabId, page, allSenders) {
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    function: getSenders,
  }, async (results) => {
    if (results && results[0] && results[0].result) {
      updateSenders(allSenders, results[0].result);
      displaySenders(allSenders);
      const hasMoreEmails = await navigateToNextPage(tabId, page);
      console.log("on page", page);
      if (hasMoreEmails) {
        collectAllSenders(tabId, page + 1, allSenders);
      } else {
        document.getElementById('status').textContent = 'All senders collected';
      }
    }
  });
}

async function navigateToNextPage(tabId, page) {
  return new Promise((resolve) => {
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      function: async (page) => {
        const nextPageUrl = `https://mail.google.com/mail/u/0/#all/p${page}`;
        window.location.href = nextPageUrl;
        await new Promise(r => setTimeout(r, 2000)); // Wait for 2 seconds for the page to load
        const noMailMessage = document.querySelector('div[role="main"]').innerText.includes("You don't have any mail! Our servers are feeling unloved.");
        const hasEmails = document.querySelectorAll('span[email]').length > 0;
        return !noMailMessage && hasEmails;
      },
      args: [page]
    }, (results) => {
      resolve(results && results[0] && results[0].result);
    });
  });
}

function updateSenders(allSenders, newSenders) {
  for (const [email, count] of Object.entries(newSenders)) {
    allSenders[email] = (allSenders[email] || 0) + count;
  }
}

function displaySenders(senders) {
  const container = document.getElementById('senders-list');
  const statusEl = document.getElementById('status');
  
  if (Object.keys(senders).length === 0) {
    statusEl.textContent = 'No senders found';
    return;
  }

  statusEl.textContent = `Found ${Object.keys(senders).length} unique senders`;
  
  container.innerHTML = ''; // Clear previous senders
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

  console.log("length of senders", Object.keys(senders).length);
  
  return senders;
}

function cleanSubscriptionEmails() {
  console.log("Cleaning subscription emails...");
  // ...add your email cleaning logic here...
}
