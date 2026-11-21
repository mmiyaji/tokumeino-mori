const form = document.querySelector('form');
const enabledControl = document.querySelector('#enabled');
const modeControl = document.querySelector('#mode');
const themesControl = document.querySelector('#extraThemes');
const overflowControl = document.querySelector('#overflow');
const markSettings = document.querySelector('#mark-settings');
const statusMessage = document.querySelector('#status');
const connection = document.querySelector('#connection');
let copy = renderForestCopy('system');

function updateControls() {
  modeControl.disabled = !enabledControl.checked;
  markSettings.disabled = modeControl.disabled || modeControl.value !== 'marks';
  document.body.dataset.previewMode = enabledControl.checked ? modeControl.value : 'off';
}

async function showConnection(settings) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const key = tab?.url && forestSiteKey(new URL(tab.url).hostname);
  if (!key) return;
  if (!settings[key]) {
    connection.textContent = copy.siteDisabled;
    return;
  }
  try {
    await chrome.tabs.sendMessage(tab.id, 'forest-chat-status', { frameId: 0 });
    connection.textContent = copy.connected;
  } catch {
    connection.textContent = copy.disconnected;
  }
}

async function initialize() {
  const settings = await chrome.storage.local.get(forestDefaults);
  copy = renderForestCopy(settings.language);
  document.title = copy.name;
  enabledControl.checked = forestEnabled(settings);
  enabledControl.disabled = false;
  modeControl.value = settings.mode === 'anonymous' ? 'anonymous' : 'marks';
  themesControl.checked = settings.extraThemes;
  overflowControl.value = settings.overflow;
  updateControls();
  await showConnection(settings);
}

form.addEventListener('change', async ({ target }) => {
  updateControls();
  try {
    await chrome.storage.local.set({
      [target.id]: target.type === 'checkbox' ? target.checked : target.value,
      ...(target === enabledControl && { mode: modeControl.value })
    });
    statusMessage.textContent = '';
  } catch {
    statusMessage.textContent = copy.saveError;
  }
});

document.querySelector('#details').addEventListener('click', async () => {
  try {
    await chrome.runtime.openOptionsPage();
  } catch {
    statusMessage.textContent = copy.loadError;
  }
});

initialize().catch(() => { statusMessage.textContent = copy.loadError; });
