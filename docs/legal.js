const preference = new URLSearchParams(location.search).get('lang') || navigator.language;
const locale = /^ja(?:-|$)/i.test(preference) ? 'ja' : 'en';

document.documentElement.lang = locale;
for (const article of document.querySelectorAll('article[lang]')) {
  article.hidden = article.lang !== locale;
  if (!article.hidden) {
    const name = locale === 'ja' ? '匿名の森' : 'Anonymous Forest';
    document.title = article.querySelector('h1').textContent + ' | ' + name;
  }
}
