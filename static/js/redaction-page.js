/* Page « Rédaction des rapports » : formulaire, brouillon local, téléchargements */

const CLE_BROUILLON = 's18_redaction_brouillon';
const $ = id => document.getElementById(id);

function brouillonVide() {
  return {
    type: 'vague', session: '', date: new Date().toISOString().slice(0, 10),
    signataire: 'Jean-Hugues RENAULT', qualite: 'Président de la section 18',
    champs: {}, rubriques: {}, avis: '',
  };
}

let d = brouillonVide();
try { d = Object.assign(d, JSON.parse(localStorage.getItem(CLE_BROUILLON) || '{}')); } catch (e) {}

function sauver() {
  try {
    localStorage.setItem(CLE_BROUILLON, JSON.stringify(d));
    $('etat').textContent = 'Brouillon enregistré dans ce navigateur à ' +
      new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) + '.';
  } catch (e) {
    $('etat').textContent = "Le brouillon ne peut pas être enregistré dans ce navigateur : pensez à télécharger le rapport.";
  }
}

function zoneTexte(id, titre, aide, valeur, lignes) {
  return `
    <div class="mb-3">
      <label class="form-label fw-semibold" for="r-${id}">${esc(titre)}
        ${aide ? `<span class="fw-normal text-muted small">(${esc(aide)})</span>` : ''}</label>
      <textarea class="form-control" id="r-${id}" data-rubrique="${id}" rows="${lignes}">${esc(valeur || '')}</textarea>
    </div>`;
}

function construire() {
  const t = TYPES[d.type];

  $('champs').innerHTML = t.champs.map(c => `
    <div class="${c.long ? 'col-12' : 'col-md-4'}">
      <label class="form-label fw-semibold" for="c-${c.id}">${esc(c.label)}</label>
      <input class="form-control" id="c-${c.id}" data-champ="${c.id}" value="${esc(d.champs[c.id] || '')}">
    </div>`).join('');

  let html = t.rubriques.map(r => zoneTexte(r.id, r.titre, r.aide, d.rubriques[r.id], 5)).join('');
  if (!t.sansAppreciations) {
    html += zoneTexte('appreciations', 'Appréciations générales et recommandations de la section', '',
                      d.rubriques.appreciations, 8);
  }
  $('rubriques').innerHTML = html;

  $('bloc-avis').innerHTML = t.avis ? `
    <label class="form-label fw-semibold">${esc(t.avis.question)}</label>
    ${t.avis.options.map((o, i) => `
      <div class="form-check">
        <input class="form-check-input" type="radio" name="avis" id="avis-${i}" value="${i}" ${String(d.avis) === String(i) ? 'checked' : ''}>
        <label class="form-check-label" for="avis-${i}">${esc(o)}</label>
      </div>`).join('')}` : '';
}

// ─── Initialisation ───────────────────────────────────────────────────────────

$('type').innerHTML = Object.entries(TYPES).map(([k, t]) => `<option value="${k}">${esc(t.nom)}</option>`).join('');
['type', 'session', 'date', 'signataire', 'qualite'].forEach(k => { $(k).value = d[k] || ''; });
construire();

loadList('data/sessions.json', 'sessions').then(sessions => {
  $('liste-sessions').innerHTML = sessions
    .filter(s => /^Session/.test(s.nom))
    .map(s => `<option value="${esc(s.nom)}">`).join('');
}).catch(() => {});

// Saisie : tout est recopié dans le brouillon, enregistré une demi-seconde après la dernière frappe
let minuteur = null;
document.getElementById('form-rapport').addEventListener('input', e => {
  const el = e.target;
  if (el.dataset.champ) d.champs[el.dataset.champ] = el.value;
  else if (el.dataset.rubrique) d.rubriques[el.dataset.rubrique] = el.value;
  else if (el.name === 'avis') d.avis = el.value;
  else if (el.id in d) d[el.id] = el.value;
  if (el.id === 'type') { d.avis = ''; construire(); }
  clearTimeout(minuteur);
  minuteur = setTimeout(sauver, 500);
});

// ─── Boutons ──────────────────────────────────────────────────────────────────

$('btn-pdf').addEventListener('click', () => {
  pdfMake.createPdf(docPdf(d)).download(nomFichier(d, 'pdf'));
});

$('btn-tex').addEventListener('click', () => {
  telecharger(docTex(d), nomFichier(d, 'tex'), 'application/x-tex;charset=utf-8');
});

$('btn-effacer').addEventListener('click', () => {
  if (!confirm('Effacer tout le contenu du formulaire ?')) return;
  try { localStorage.removeItem(CLE_BROUILLON); } catch (e) {}
  const type = d.type;
  d = brouillonVide();
  d.type = type;
  ['type', 'session', 'date', 'signataire', 'qualite'].forEach(k => { $(k).value = d[k] || ''; });
  construire();
  $('etat').textContent = 'Formulaire effacé.';
});
