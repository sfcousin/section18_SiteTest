/* Page « Rédaction des rapports » : formulaire, brouillon local, téléchargements, import d'un .tex */

const CLE_BROUILLON = 's18_redaction_brouillon';
const SIGNATAIRE = 'M. Jean-Hugues RENAULT';
const QUALITE = 'Président de la section 18';
const $ = id => document.getElementById(id);

function brouillonVide() {
  return {
    type: 'vague', date: new Date().toISOString().slice(0, 10),
    signataire: SIGNATAIRE, qualite: QUALITE,
    champs: {}, rubriques: {}, avis: '', conclusion: '',
  };
}

let d = brouillonVide();
try { d = Object.assign(d, JSON.parse(localStorage.getItem(CLE_BROUILLON) || '{}')); } catch (e) {}
if (!TYPES[d.type]) d.type = 'vague';

function sauver(message) {
  try {
    localStorage.setItem(CLE_BROUILLON, JSON.stringify(d));
    $('etat').textContent = message || ('Brouillon enregistré dans ce navigateur à ' +
      new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) + '.');
  } catch (e) {
    $('etat').textContent = 'Le brouillon ne peut pas être enregistré dans ce navigateur : pensez à télécharger le rapport.';
  }
}

function zoneTexte(id, titre, aide, consigne, valeur, lignes) {
  return `
    <div class="mb-3">
      <label class="form-label fw-semibold" for="r-${id}">${esc(titre)}
        ${aide ? `<span class="fw-normal text-muted small">(${esc(aide)})</span>` : ''}</label>
      <textarea class="form-control" id="r-${id}" data-rubrique="${id}" rows="${lignes}"
                placeholder="${esc(consigne || '')}">${esc(valeur || '')}</textarea>
    </div>`;
}

function radios(nom, question, options, valeur) {
  return `
    <label class="form-label fw-semibold">${esc(question)}</label>
    ${options.map((o, i) => `
      <div class="form-check">
        <input class="form-check-input" type="radio" name="${nom}" id="${nom}-${i}" value="${i}" ${String(valeur) === String(i) ? 'checked' : ''}>
        <label class="form-check-label" for="${nom}-${i}">${esc(o)}</label>
      </div>`).join('')}`;
}

function construire() {
  const t = TYPES[d.type];

  $('bloc-signature').hidden = !!t.sansSignature;

  $('champs').innerHTML = t.champs.map(c => `
    <div class="${c.long ? 'col-12' : 'col-md-4'}">
      <label class="form-label fw-semibold" for="c-${c.id}">${esc(c.label)}</label>
      ${c.calcule
        ? `<input class="form-control" id="c-${c.id}" readonly tabindex="-1" placeholder="calculé d'après la date de naissance">`
        : `<input class="form-control" id="c-${c.id}" data-champ="${c.id}" type="${c.type || 'text'}" value="${esc(d.champs[c.id] ?? c.defaut ?? '')}">`}
    </div>`).join('');
  majAge();

  let html = '';
  t.rubriques.forEach(r => {
    html += zoneTexte(r.id, r.titre || r.consigne, r.aide, r.consigne, d.rubriques[r.id], r.puce ? 3 : 5);
    if (t.avis && t.avis.apres === r.id) html += '<div class="mb-3">' + radios('avis', t.avis.question, t.avis.options, d.avis) + '</div>';
  });
  if (!t.sansAppreciations) {
    html += zoneTexte('appreciations', 'Appréciations générales et recommandations de la section', '',
                      t.consigneAppreciations || '', d.rubriques.appreciations, 8);
  }
  $('rubriques').innerHTML = html;

  $('bloc-conclusion').innerHTML = t.conclusion
    ? radios('conclusion', t.conclusion.phrase.replace('{}', '…'), t.conclusion.choix, d.conclusion) : '';
  $('bloc-avis').innerHTML = t.avis && !t.avis.apres
    ? radios('avis', [t.avis.titre, t.avis.question].filter(Boolean).join(' — '), t.avis.options, d.avis) : '';
}

// Âge recalculé à partir de la date de naissance et de la date du rapport
function majAge() {
  const el = $('c-age');
  if (el) el.value = ageAuRapport(d);
}

function remplirEnTete() {
  ['type', 'date', 'signataire', 'qualite'].forEach(k => { $(k).value = d[k] || ''; });
}

// Valeurs par défaut des champs du type choisi (ex. « Président de la section » pour un GDR)
function appliquerDefauts() {
  const t = TYPES[d.type];
  if (!d.qualite || d.qualite === QUALITE || d.qualite === 'Président de la section') d.qualite = t.qualite || QUALITE;
  t.champs.forEach(c => { if (c.defaut && !d.champs[c.id]) d.champs[c.id] = c.defaut; });
}

// ─── Initialisation ───────────────────────────────────────────────────────────

$('type').innerHTML = Object.entries(TYPES).map(([k, t]) => `<option value="${k}">${esc(t.nom)}</option>`).join('');
appliquerDefauts();
remplirEnTete();
construire();

// Saisie : tout est recopié dans le brouillon, enregistré une demi-seconde après la dernière frappe
let minuteur = null;
$('form-rapport').addEventListener('input', e => {
  const el = e.target;
  if (el.dataset.champ) d.champs[el.dataset.champ] = el.value;
  else if (el.dataset.rubrique) d.rubriques[el.dataset.rubrique] = el.value;
  else if (el.name === 'avis' || el.name === 'conclusion') d[el.name] = el.value;
  else if (el.id in d) d[el.id] = el.value;
  if (el.dataset.champ === 'naissance' || el.id === 'date') majAge();
  if (el.id === 'type') {
    d.avis = ''; d.conclusion = '';
    appliquerDefauts(); remplirEnTete(); construire();
  }
  clearTimeout(minuteur);
  minuteur = setTimeout(sauver, 500);
});

// ─── Boutons ──────────────────────────────────────────────────────────────────

function occupe(bouton, promesse) {
  const texte = bouton.innerHTML;
  bouton.disabled = true;
  bouton.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Préparation…';
  return promesse.catch(err => {
    console.error(err);
    alert('La génération a échoué : ' + err.message);
  }).finally(() => { bouton.disabled = false; bouton.innerHTML = texte; });
}

$('btn-pdf').addEventListener('click', () => occupe($('btn-pdf'),
  creerPdf(d).then(pdf => pdf.download(nomFichier(d, 'pdf')))));

$('btn-tex').addEventListener('click', () => occupe($('btn-tex'),
  zipTex(d).then(blob => telecharger(blob, nomFichier(d, 'zip')))));

$('btn-effacer').addEventListener('click', () => {
  if (!confirm('Effacer tout le contenu du formulaire ?')) return;
  try { localStorage.removeItem(CLE_BROUILLON); } catch (e) {}
  const type = d.type;
  d = brouillonVide();
  d.type = type;
  appliquerDefauts(); remplirEnTete(); construire();
  $('etat').textContent = 'Formulaire effacé.';
});

// ─── Import d'un .tex (ou du .zip téléchargé ici) ─────────────────────────────

$('fichier-tex').addEventListener('change', async e => {
  const fichier = e.target.files[0];
  e.target.value = '';
  if (!fichier) return;
  const retour = $('import-etat');
  try {
    let source;
    if (/\.zip$/i.test(fichier.name)) {
      const zip = await JSZip.loadAsync(fichier);
      const tex = Object.values(zip.files).find(f => /\.tex$/i.test(f.name));
      if (!tex) throw new Error("L'archive ne contient pas de fichier .tex.");
      source = await tex.async('string');
    } else {
      source = await fichier.text();
    }
    const importe = importerTex(source);
    d = Object.assign(brouillonVide(), importe);
    appliquerDefauts(); remplirEnTete(); construire();
    sauver('Rapport importé depuis « ' + fichier.name + ' ». Vérifiez-le, puis téléchargez le PDF.');
    retour.className = 'small mt-2 text-success';
    retour.textContent = 'Import réussi : le formulaire a été rempli avec le contenu du fichier.';
    $('form-rapport').scrollIntoView({ behavior: 'smooth' });
  } catch (err) {
    retour.className = 'small mt-2 text-danger';
    retour.textContent = err.message;
  }
});
