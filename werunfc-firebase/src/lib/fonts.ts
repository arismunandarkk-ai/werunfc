export function loadFonts() {
  if (document.querySelector('link[data-fonts]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap';
  link.setAttribute('data-fonts', '');
  document.head.appendChild(link);
}
