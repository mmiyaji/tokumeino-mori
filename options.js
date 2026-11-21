const form = document.querySelector('form');
const status = form.querySelector('[role="status"]');
const controls = [...form.querySelectorAll('input, select')];
const fieldsets = form.querySelectorAll('fieldset');
const save = form.querySelector('button');
let copy = renderForestCopy('system');
let initialValues;

function updatePolicyLinks(language) {
  for (const link of document.querySelectorAll('[data-message="footerTerms"], [data-message="footerPrivacy"]')) {
    const url = new URL(link.href);
    url.searchParams.set('lang', language);
    link.href = url.href;
  }
}

function setBusy(busy) {
  for (const fieldset of fieldsets) fieldset.disabled = busy;
  save.disabled = busy;
}

function readValues() {
  return Object.fromEntries(controls.map(control => [
    control.name, control.type === 'checkbox' ? control.checked : control.value
  ]));
}

form.addEventListener('input', () => { status.textContent = ''; });

form.addEventListener('submit', async event => {
  event.preventDefault();
  const values = readValues();
  const changes = Object.fromEntries(
    Object.entries(values).filter(([key, value]) => initialValues[key] !== value)
  );
  if (changes.enabled === true && initialValues.legacyOff && !changes.mode) changes.mode = values.mode;
  setBusy(true);
  try {
    await chrome.storage.local.set(changes);
    initialValues = values;
    copy = renderForestCopy(values.language);
    document.title = copy.optionsTitle;
    updatePolicyLinks(document.documentElement.lang);
    status.textContent = copy.saved;
  } catch {
    status.textContent = copy.saveError;
  } finally {
    setBusy(false);
  }
});

chrome.storage.local.get(forestDefaults).then(settings => {
  copy = renderForestCopy(settings.language);
  document.title = copy.optionsTitle;
  updatePolicyLinks(document.documentElement.lang);
  for (const control of controls) {
    const value = settings[control.name];
    if (control.name === 'enabled') control.checked = forestEnabled(settings);
    else if (control.type === 'checkbox') control.checked = value;
    else if (control.name === 'mode') control.value = value === 'anonymous' ? value : 'marks';
    else control.value = value;
  }
  initialValues = { ...readValues(), legacyOff: settings.mode === 'off' };
  setBusy(false);
}).catch(() => { status.textContent = copy.loadError; });
