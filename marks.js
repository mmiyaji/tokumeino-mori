function createForestMarks(animals, extras, random = Math.random) {
  function shuffle(items) {
    const shuffled = [...items];
    for (let index = shuffled.length - 1; index > 0; index--) {
      const other = Math.floor(random() * (index + 1));
      [shuffled[index], shuffled[other]] = [shuffled[other], shuffled[index]];
    }
    return shuffled;
  }

  const animalOrder = shuffle(animals);
  const expandedOrder = [...animalOrder, ...shuffle(extras)];
  const participants = new Map();

  return (identity, settings) => {
    if (!participants.has(identity)) participants.set(identity, participants.size);
    const index = participants.get(identity);
    const pool = settings.extraThemes ? expandedOrder : animalOrder;
    const emoji = pool[index % pool.length];
    const round = Math.floor(index / pool.length) + 1;
    if (round > 1 && settings.overflow === "combine") {
      // Each length uses all ordered combinations before moving to the next length.
      let position = index + 1;
      let mark = "";
      while (position > 0) {
        position -= 1;
        mark = pool[position % pool.length] + mark;
        position = Math.floor(position / pool.length);
      }
      return mark;
    }
    return round === 1 || settings.overflow === "reuse" ? emoji : `${emoji}${round}`;
  };
}

function createForestMarkButton(resolveAuthor) {
  const button = document.createElement('button');
  button.type = 'button';
  button.classList.add('forest-profile-button');
  const action = /^ja(?:-|$)/i.test(document.documentElement.lang) ? 'ユーザー情報を開く' : 'Open user details';
  button.title = action;
  button.addEventListener('click', event => {
    event.stopPropagation();
    const author = resolveAuthor();
    if (!author) return;

    // The chat's own handler opens the original card. Keep the mark's click position.
    const bounds = button.getBoundingClientRect();
    author.dispatchEvent(new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      composed: true,
      view: window,
      detail: event.detail,
      clientX: event.detail ? event.clientX : bounds.left + bounds.width / 2,
      clientY: event.detail ? event.clientY : bounds.top + bounds.height / 2
    }));
  });
  return button;
}

function setForestMarkLabel(mark, label) {
  if (mark.textContent === label) return;
  mark.textContent = label;
  if (mark instanceof HTMLButtonElement) mark.setAttribute('aria-label', label + ' ' + mark.title);
}
