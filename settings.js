var forestDefaults = {
  enabled: null,
  mode: "marks",
  extraThemes: true,
  overflow: "combine",
  language: "system",
  twitchEnabled: true,
  youtubeEnabled: true,
  niconicoEnabled: true,
  twitcastingEnabled: true,
  kickEnabled: true
};

function forestEnabled(settings) {
  return settings.enabled ?? (settings.mode !== 'off');
}

function forestSiteKey(hostname) {
  if (hostname === 'twitch.tv' || hostname.endsWith('.twitch.tv')) return 'twitchEnabled';
  return {
    'www.youtube.com': 'youtubeEnabled',
    'live.nicovideo.jp': 'niconicoEnabled',
    'twitcasting.tv': 'twitcastingEnabled',
    'kick.com': 'kickEnabled',
    'www.kick.com': 'kickEnabled'
  }[hostname];
}
