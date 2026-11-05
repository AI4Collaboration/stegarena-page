const root = document.documentElement;
const themeButton = document.querySelector('#theme-toggle');
const menuButton = document.querySelector('.menu-toggle');
const mobileNav = document.querySelector('#mobile-nav');
const filters = [...document.querySelectorAll('[data-filter]')];
const rows = [...document.querySelectorAll('[data-result-row]')];
const resultCount = document.querySelector('[data-result-count]');

function updateThemeButton() {
  const label = root.dataset.theme === 'dark' ? 'Light' : 'Dark';
  themeButton.textContent = label;
  themeButton.setAttribute('aria-label', `Switch to ${label.toLowerCase()} mode`);
  themeButton.setAttribute('title', `Switch to ${label.toLowerCase()} mode`);
  document.querySelector('meta[name="theme-color"]').content = root.dataset.theme === 'dark' ? '#000000' : '#faf8f3';
}

updateThemeButton();
themeButton.addEventListener('click', () => {
  root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('stegarena-theme', root.dataset.theme);
  updateThemeButton();
});

function setMenu(open) {
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  menuButton.textContent = open ? 'Close' : 'Menu';
  mobileNav.hidden = !open;
}

menuButton.addEventListener('click', () => setMenu(mobileNav.hidden));
mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !mobileNav.hidden) {
    setMenu(false);
    menuButton.focus();
  }
});
window.matchMedia('(min-width: 1251px)').addEventListener('change', event => {
  if (event.matches) setMenu(false);
});

filters.forEach(button => button.addEventListener('click', () => {
  const selection = button.dataset.filter;
  filters.forEach(filter => filter.setAttribute('aria-pressed', String(filter === button)));
  rows.forEach(row => { row.hidden = selection !== 'all' && row.dataset.group !== selection; });
  const visible = rows.filter(row => !row.hidden);
  const confirmed = visible.filter(row => row.dataset.confirmed === 'true').length;
  resultCount.textContent = `${visible.length} runs · ${confirmed} complete transmission${confirmed === 1 ? '' : 's'}`;
}));

function revealDetail() {
  const target = document.getElementById(location.hash.slice(1));
  if (target instanceof HTMLDetailsElement) target.open = true;
}

document.querySelectorAll('[data-detail-link]').forEach(link => link.addEventListener('click', () => {
  const detail = document.getElementById(link.hash.slice(1));
  detail.open = true;
}));
window.addEventListener('hashchange', revealDetail);
revealDetail();
