/* Mode clair / sombre : appliqué dès le <head> pour éviter un flash au chargement.
   Choix mémorisé dans ce navigateur ; à défaut, on suit le réglage du système. */
(function () {
  var CLE = 's18_theme';
  var racine = document.documentElement;
  var choisi = null;
  try { choisi = localStorage.getItem(CLE); } catch (e) {}
  var systeme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  racine.setAttribute('data-bs-theme', choisi === 'dark' || choisi === 'light' ? choisi : systeme);

  function majBouton(b) {
    var sombre = racine.getAttribute('data-bs-theme') === 'dark';
    b.innerHTML = '<i class="bi bi-' + (sombre ? 'sun' : 'moon-stars') + '"></i>';
    b.title = sombre ? 'Passer en mode clair' : 'Passer en mode sombre';
    b.setAttribute('aria-label', b.title);
  }

  document.addEventListener('DOMContentLoaded', function () {
    var b = document.getElementById('btn-theme');
    if (!b) return;
    majBouton(b);
    b.addEventListener('click', function () {
      var t = racine.getAttribute('data-bs-theme') === 'dark' ? 'light' : 'dark';
      racine.setAttribute('data-bs-theme', t);
      try { localStorage.setItem(CLE, t); } catch (e) {}
      majBouton(b);
    });
  });
})();
