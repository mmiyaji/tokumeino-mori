(() => {
  if (globalThis.forestLivestreamAttached) return;
  globalThis.forestLivestreamAttached = true;

  const site = forestSiteKey(location.hostname);
  if (!site) return;
  chrome.runtime.onMessage.addListener((message, sender, respond) => {
    if (message === 'forest-chat-status') respond(true);
  });
  if (site === 'youtubeEnabled' && location.pathname !== '/live_chat') return;

  const adapters = {
    youtubeEnabled: {
      rows: 'yt-live-chat-text-message-renderer, yt-live-chat-paid-message-renderer, yt-live-chat-paid-sticker-renderer, yt-live-chat-membership-item-renderer',
      author: '#author-name',
      hidden: 'yt-live-chat-author-chip, #author-photo, #author-badges',
      owner: (row, author) => row.getAttribute('author-type') === 'owner' || author.getAttribute('type') === 'owner'
        || Boolean(row.querySelector('yt-live-chat-author-badge-renderer[type="owner"]'))
    },
    twitcastingEnabled: {
      rows: '.tw-comment-item',
      author: '.tw-comment-item-name',
      profile: true,
      identity: row => row.querySelector('.tw-comment-item-screen-id')?.textContent,
      hidden: '.tw-comment-item-name-wrapper, .tw-comment-item-icon',
      owner: (row, author, identity) => identity === (location.pathname.split('/')[1] || '').toLowerCase()
    },
    kickEnabled: {
      rows: '#chatroom-messages [data-index]',
      author: 'button[data-prevent-expand]',
      profile: true,
      anchor: author => author.parentElement,
      hidden: '[data-testid^="chat-badge"]',
      owner: (row, author, identity) => identity === (location.pathname.split('/')[1] || '').toLowerCase()
    },
    niconicoEnabled: {
      rows: '.ga-ns-comment-panel [role="row"][data-comment-type]',
      author: '.comment-user-name, .comment-author-name, [data-user-name]',
      identity: row => row.getAttribute('data-user-id'),
      hidden: '.comment-user-icon, .comment-author-icon, .comment-user-badge',
      owner: row => row.matches('[data-comment-type="operator"], [data-comment-type="owner"]')
    }
  };

  const adapter = adapters[site];
  if (!adapter) return;

  let settings;
  let frame = null;
  let scope;
  let assignMark;

  function render() {
    frame = null;
    const currentScope = site === 'youtubeEnabled' ? new URLSearchParams(location.search).get('v') : location.pathname;
    if (currentScope !== scope) {
      scope = currentScope;
      assignMark = createForestMarks(forestEmoji.animals, forestEmoji.extras);
    }
    document.documentElement.dataset.forestLivestreamMode = settings.mode;

    for (const row of document.querySelectorAll(adapter.rows)) {
      const author = row.querySelector(adapter.author);
      const mark = row.querySelector('.forest-livestream-mark');
      const identity = (author && (adapter.identity?.(row) || author.textContent))
        ?.trim().toLowerCase().replace(/^@/, '');
      const owner = Boolean(identity && adapter.owner(row, author, identity));
      if (row.hasAttribute('data-forest-livestream-owner') !== owner) {
        row.toggleAttribute('data-forest-livestream-owner', owner);
      }
      const hidden = new Set();
      let anchor;
      if (identity && !owner) {
        const identities = [...row.querySelectorAll(adapter.hidden)];
        anchor = adapter.anchor?.(author) || identities.find(node => node.contains(author)) || author;
        for (const element of [anchor, ...identities]) hidden.add(element);
      }
      for (const element of row.querySelectorAll('[data-forest-livestream-hidden]')) {
        if (!hidden.has(element)) element.removeAttribute('data-forest-livestream-hidden');
      }
      for (const element of hidden) element.setAttribute('data-forest-livestream-hidden', '');

      if (!anchor) {
        mark?.remove();
        continue;
      }
      const label = assignMark(identity, settings);
      const replacement = mark || (adapter.profile
        ? createForestMarkButton(() => row.querySelector(adapter.author))
        : document.createElement('span'));
      replacement.classList.add('forest-livestream-mark');
      if (replacement.nextSibling !== anchor) anchor.before(replacement);
      setForestMarkLabel(replacement, label);
    }
  }

  function schedule() {
    if (!settings || !forestEnabled(settings) || !settings[site] || frame !== null) return;
    frame = requestAnimationFrame(render);
  }

  const observer = new MutationObserver(records => {
    if (records.some(record => {
      const element = record.target.nodeType === Node.ELEMENT_NODE ? record.target : record.target.parentElement;
      return (element?.closest(adapter.rows) && !element.closest('.forest-livestream-mark'))
        || [...record.addedNodes].some(node => node.nodeType === Node.ELEMENT_NODE
          && (node.matches(adapter.rows) || node.querySelector(adapter.rows)));
    })) schedule();
  });

  async function apply() {
    settings = await chrome.storage.local.get(forestDefaults);
    if (forestEnabled(settings) && settings[site]) {
      observer.observe(document, { childList: true, characterData: true, subtree: true,
        attributes: true, attributeFilter: ['author-type', 'type', 'data-user-id'] });
      schedule();
    } else {
      observer.disconnect();
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      document.documentElement?.removeAttribute('data-forest-livestream-mode');
    }
  }

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && [site, 'enabled', 'mode', 'extraThemes', 'overflow'].some(key => key in changes)) void apply();
  });
  window.navigation?.addEventListener('currententrychange', schedule);
  void apply();
})();
