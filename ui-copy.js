const forestCopy = {
  ja: {
    privacySummary: "対応サイトのページURLとチャット上の投稿者名・識別子・バッジなどをブラウザ内で処理します。これらのデータは外部に送信しません。",
    footerTerms: "利用規約", footerPrivacy: "プライバシーポリシー", footerAuthorSite: "作者サイト",
    name: "匿名の森", optionsTitle: "匿名の森の設定", subtitle: "配信チャット匿名化",
    enabled: "匿名化をオンにする", display: "表示方法", marks: "マークで見分ける",
    anonymous: "完全匿名（マークなし）", extraThemes: "植物や天気などの絵文字も使う", overflow: "マークが足りなくなったら",
    combine: "絵文字を組み合わせる", number: "連番を付ける", reuse: "同じマークを再利用する",
    details: "詳細設定", sites: "対応サイト", appearance: "匿名表示", language: "表示言語", system: "Chromeの言語に合わせる",
    niconico: "ニコニコ生放送", twitcasting: "ツイキャス", save: "保存", saved: "設定を保存しました",
    saveError: "設定を保存できませんでした", loadError: "設定を読み込めませんでした",
    connected: "このタブに接続済み", disconnected: "このタブに未接続です。ページを再読み込みしてください",
    siteDisabled: "このサイトは詳細設定でオフになっています", example: "配信、楽しみにしてた！"
  },
  en: {
    privacySummary: "Page URLs on supported sites and chat data such as usernames, identifiers, and badges are processed in your browser. This data is never sent to external servers.",
    footerTerms: "Terms of Use", footerPrivacy: "Privacy Policy", footerAuthorSite: "Author Website",
    name: "Anonymous Forest", optionsTitle: "Anonymous Forest settings", subtitle: "Live Chat Anonymizer",
    enabled: "Anonymize chat", display: "Display mode", marks: "Show emoji marks",
    anonymous: "Fully anonymous (no marks)", extraThemes: "Include plants, weather and more", overflow: "When marks run out",
    combine: "Combine emoji", number: "Add numbers", reuse: "Reuse the same marks",
    details: "Advanced settings", sites: "Supported sites", appearance: "Anonymization", language: "Display language", system: "Match Chrome language",
    niconico: "Niconico Live", twitcasting: "TwitCasting", save: "Save", saved: "Settings saved",
    saveError: "Could not save settings", loadError: "Could not load settings",
    connected: "Connected to this tab", disconnected: "This tab is not connected. Reload the page",
    siteDisabled: "This site is off in advanced settings", example: "I’ve been looking forward to this stream!"
  }
};

function forestLanguage(preference) {
  return ['ja', 'en'].includes(preference)
    ? preference
    : (/^ja(?:-|$)/i.test(chrome.i18n.getUILanguage()) ? 'ja' : 'en');
}

function renderForestCopy(preference) {
  const language = forestLanguage(preference);
  const copy = forestCopy[language];
  document.documentElement.lang = language;
  for (const element of document.querySelectorAll('[data-message]')) {
    element.textContent = copy[element.dataset.message];
  }
  return copy;
}
