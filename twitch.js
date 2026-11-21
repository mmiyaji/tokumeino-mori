(() => {
  if (globalThis.forestChatAttached) return;
  globalThis.forestChatAttached = true;

  chrome.runtime.onMessage.addListener((message, sender, respond) => {
    if (message === 'forest-chat-status') respond(true);
  });

  const rowSelector = ':is(.chat-line__message, [data-a-target="chat-line-message"], .seventv-user-message):not(.seventv-user-card *, .viewer-card-positioner *)';
  const authorSelector = '[data-a-target="chat-message-username"], .chat-author__display-name, .seventv-chat-user-username';
  const pinSelector = '.pinned-chat__pinned-by';
  const surfaceSelector = `${rowSelector}, ${pinSelector}`;
  const markSelector = '.tokumeino-mori-mark';
  const broadcasterBadge = '[data-badge="broadcaster"], img[alt="Broadcaster"], img[alt="配信者"]';
  let settings = { ...forestDefaults };
  let scope;
  let assignMark;
  let frame = null;

  function channelScope() {
    const path = location.pathname.toLowerCase().split('/').filter(Boolean);
    if (['popout', 'embed'].includes(path[0]) && path[2] === 'chat') return path[1] || '';
    return path[0] === 'videos' ? path.slice(0, 2).join('/') : path[0] || '';
  }

  function normalizeName(name) {
    const text = name?.trim().toLowerCase() || '';
    return text.match(/\(([a-z0-9_]+)\)$/)?.[1] || text;
  }

  function updateAttribution(surface, anchor, identity, owner, clickable = false) {
    const mark = surface.querySelector(`:scope ${markSelector}`);
    if (surface.hasAttribute('data-forest-owner') !== owner) {
      surface.toggleAttribute('data-forest-owner', owner);
    }
    if (!anchor || !identity || owner) {
      mark?.remove();
      return;
    }
    const label = assignMark(identity, settings);
    const replacement = mark || (clickable
      ? createForestMarkButton(() => surface.querySelector(authorSelector))
      : document.createElement('span'));
    replacement.classList.add('tokumeino-mori-mark');
    if (replacement.nextSibling !== anchor) anchor.before(replacement);
    setForestMarkLabel(replacement, label);
  }

  function render() {
    frame = null;
    if (!document.documentElement) return;
    const channel = channelScope();
    if (channel !== scope) {
      scope = channel;
      assignMark = createForestMarks(forestEmoji.animals, forestEmoji.extras);
    }
    document.documentElement.dataset.forestMode = settings.mode;

    for (const row of document.querySelectorAll(rowSelector)) {
      const author = row.querySelector(authorSelector);
      if (author && author.closest(rowSelector) !== row) continue;
      const anchor = author?.closest('.chat-line__username-container, .seventv-chat-user') || author;
      const login = author?.closest('[data-a-user]')?.getAttribute('data-a-user')
        || author?.parentElement.querySelector('.chat-author__intl-login')?.textContent?.trim().replace(/^\(|\)$/g, '')
        || author?.textContent;
      const identity = normalizeName(login);
      const owner = Boolean(identity && (identity === channel
        || anchor?.querySelector(broadcasterBadge)));
      updateAttribution(row, anchor, identity, owner, true);
    }

    for (const pin of document.querySelectorAll(pinSelector)) {
      const attribution = pin.querySelector('p');
      const label = attribution?.textContent?.trim() || '';
      const name = label.match(/^(.+?)\s*さんがピン留め/u)?.[1]
        || label.match(/^pinned by\s+(.+)$/i)?.[1]
        || label.match(/^(.+?)\s+pinned (?:this|a message)$/i)?.[1];
      const identity = normalizeName(name || label);
      const owner = Boolean(identity && (identity === channel || attribution?.querySelector(broadcasterBadge)));
      updateAttribution(pin, attribution, identity, owner);
    }
  }

  function scheduleRender() {
    if (!forestEnabled(settings) || !settings.twitchEnabled || frame !== null) return;
    frame = requestAnimationFrame(render);
  }

  const observer = new MutationObserver(records => {
    if (records.some(record => {
      const target = record.target.nodeType === Node.ELEMENT_NODE ? record.target : record.target.parentElement;
      if (record.type === 'characterData') return target?.closest(`${authorSelector}, ${pinSelector}`) && !target.closest(markSelector);
      if (record.type === 'attributes') return target?.closest(rowSelector);
      if (target?.closest(surfaceSelector) && !target.closest(markSelector)) return true;
      return [...record.addedNodes].some(node => node.nodeType === Node.ELEMENT_NODE
        && (node.matches(surfaceSelector) || node.querySelector(surfaceSelector)));
    })) scheduleRender();
  });

  function applySettings() {
    if (forestEnabled(settings) && settings.twitchEnabled) {
      observer.observe(document, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['data-a-user'] });
      scheduleRender();
      return;
    }
    observer.disconnect();
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    if (document.documentElement) document.documentElement.dataset.forestMode = 'off';
  }

  window.addEventListener('popstate', scheduleRender);
  window.navigation?.addEventListener('currententrychange', scheduleRender);

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    for (const key of Object.keys(forestDefaults)) {
      if (changes[key]) settings[key] = changes[key].newValue ?? forestDefaults[key];
    }
    applySettings();
  });
  chrome.storage.local.get(forestDefaults).then(value => {
    settings = value;
    applySettings();
  });
})();
