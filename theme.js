const savedTheme = localStorage.getItem('stegarena-theme');
if (savedTheme === 'light' || savedTheme === 'dark') {
  document.documentElement.dataset.theme = savedTheme;
}
