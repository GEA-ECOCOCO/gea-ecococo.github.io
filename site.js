// Transición entre páginas: barrido verde al salir
document.addEventListener('click', function (e) {
  var a = e.target.closest('a[href]');
  if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
  var href = a.getAttribute('href');
  if (!href || href.charAt(0) === '#' || /^(mailto:|tel:|https?:)/.test(href)) return;
  e.preventDefault();
  document.body.classList.add('saliendo');
  setTimeout(function () { window.location.href = href; }, 400);
});
// Al volver con el botón atrás, quitar el barrido
window.addEventListener('pageshow', function () { document.body.classList.remove('saliendo'); });
