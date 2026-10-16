/* Fonctions communes aux pages du site */

function fmtDate(s) {
  if (!s) return '';
  return new Date(s.slice(0, 10) + 'T00:00:00')
    .toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function fmtJour(s) {
  if (!s) return '';
  return new Date(s.slice(0, 10) + 'T00:00:00')
    .toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

// Échappe le texte simple avant insertion dans le HTML
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

// Texte saisi dans l'éditeur (Markdown) → HTML nettoyé
function md(s) {
  if (!s) return '';
  return DOMPurify.sanitize(marked.parse(s));
}

// Identifiant d'ancre stable à partir d'un titre (ex. "Session d'automne 2026" → "session-d-automne-2026")
function slug(s) {
  return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// Lien vers un fichier déposé par l'éditeur (chemins relatifs au site)
function fileUrl(p) {
  return String(p || '').replace(/^\/+/, '');
}

// Charge un fichier data/*.json ; les fichiers gérés par l'éditeur ont la forme { "cle": [ ... ] }
function loadList(file, key) {
  return fetch(file, { cache: 'no-cache' })
    .then(r => r.json())
    .then(d => Array.isArray(d) ? d : (d[key] || []));
}
