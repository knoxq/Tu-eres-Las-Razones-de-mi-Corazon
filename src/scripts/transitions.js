export function setupViewTransitions() {
  const logo = document.getElementById('logo-trigger');
  const navHome = document.getElementById('nav-home');
  const navBook = document.getElementById('nav-book');
  const navCartas = document.getElementById('nav-cartas');

  if (logo) logo.addEventListener('click', () => window.location.href = '/');
  if (navHome) navHome.addEventListener('click', () => window.location.href = '/');
  if (navBook) navBook.addEventListener('click', () => window.location.href = '/libro');
  if (navCartas) navCartas.addEventListener('click', () => window.location.href = '/cartas');

  // Marcar nav-link activo según la ruta actual
  const currentPath = window.location.pathname;
  if (navHome) navHome.classList.toggle('active', currentPath === '/' || currentPath === '');
  if (navBook) navBook.classList.toggle('active', currentPath === '/libro');
  if (navCartas) navCartas.classList.toggle('active', currentPath === '/cartas');
}
