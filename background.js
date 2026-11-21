chrome.runtime.onInstalled.addListener(async () => {
  for (const script of chrome.runtime.getManifest().content_scripts) {
    const tabs = await chrome.tabs.query({ url: script.matches });
    await Promise.all(tabs.map(async ({ id }) => {
      try {
        const target = { tabId: id, allFrames: script.all_frames ?? false };
        await chrome.scripting.insertCSS({ target, files: script.css });
        await chrome.scripting.executeScript({ target, files: script.js });
      } catch (error) {
        // A tab can close or navigate while the extension is being installed.
        console.debug('Could not attach to livestream tab', error);
      }
    }));
  }
});
