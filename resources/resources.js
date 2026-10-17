(() => {
  const normalizeSearch = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase();
  const list = document.getElementById('resource-list');
  const entries = Array.from(list.children).map(element => ({
    element,
    title: element.querySelector('.resource-title').textContent,
    search: normalizeSearch(`${element.querySelector('.resource-name').textContent} ${element.dataset.searchAliases || ''} ${element.dataset.category}`),
    category: element.dataset.category,
    date: element.dataset.date,
  }));
  const search = document.getElementById('resource-search');
  const sort = document.getElementById('resource-sort');
  const categories = Array.from(document.querySelectorAll('.category'));
  const count = document.getElementById('result-count');
  const emptyState = document.getElementById('empty-state');
  const exploreHint = document.getElementById('explore-hint');
  const requestedCategory = location.hash.slice(1);
  const initialCategory = ['browse', 'use'].includes(requestedCategory) ? 'design' : requestedCategory;
  let category = categories.some(button => button.dataset.category === initialCategory) ? initialCategory : 'all';

  function render() {
    list.classList.toggle('cover-shelf', category === 'books' || category === 'watch');
    list.classList.toggle('watch-shelf', category === 'watch');
    const terms = normalizeSearch(search.value.trim()).split(/\s+/).filter(Boolean);
    let visible = 0;
    for (const entry of entries) {
      const matches = (category === 'all' || category === entry.category) && terms.every(term => entry.search.includes(term));
      entry.element.hidden = !matches;
      if (matches) visible++;
    }
    let number = 0;
    for (const element of list.children) {
      if (!element.hidden) {
        element.querySelector('.resource-number').textContent = String(++number).padStart(3, '0');
      }
    }
    for (const button of categories) {
      const active = button.dataset.category === category;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    }
    count.textContent = `${visible} ${visible === 1 ? 'entry' : 'entries'}${visible < entries.length ? ` / ${entries.length} total` : ''}`;
    emptyState.hidden = visible !== 0;
    exploreHint.hidden = category === 'watch' || category === 'read';
  }

  search.addEventListener('input', render);
  document.querySelector('.directory-toolbar').addEventListener('submit', event => event.preventDefault());
  categories.forEach(button => button.addEventListener('click', () => {
    category = button.dataset.category;
    history.replaceState(null, '', category === 'all' ? location.pathname + location.search : `#${category}`);
    render();
  }));
  list.querySelectorAll('.resource-cover img').forEach(image => {
    const showFallback = () => {
      image.hidden = true;
      image.parentElement.classList.remove('has-artwork');
    };
    image.addEventListener('error', showFallback);
    if (image.complete && !image.naturalWidth) showFallback();
  });
  sort.addEventListener('change', () => {
    const sorted = [...entries].sort((a, b) => {
      if (sort.value === 'curated') return 0;
      if (sort.value === 'alphabetical') return a.title.localeCompare(b.title);
      return sort.value === 'oldest' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date);
    });
    list.append(...sorted.map(entry => entry.element));
    render();
  });
  document.getElementById('clear-filters').addEventListener('click', () => {
    search.value = '';
    category = 'all';
    history.replaceState(null, '', location.pathname + location.search);
    render();
    search.focus();
  });
  render();
})();
