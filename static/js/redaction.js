/* Rédaction des rapports de section : formulaire → PDF (pdfmake) ou .tex (archive avec logos),
   et import d'un .tex déjà généré. Tout reste dans le navigateur : rien n'est envoyé sur un serveur. */

// ─── Types de rapport : textes repris des modèles Word de la section ──────────
//
// Champ    : ligne « libellé : valeur » de l'en-tête.
// Rubrique : zone de texte. « titre » est imprimé comme intertitre ; « consigne » est la phrase
//            explicative du modèle, affichée en grisé dans la zone et remplacée par le texte saisi ;
//            « puce » imprime le texte comme un élément de liste, à la place de la puce du modèle.
// Conclusion : phrase du modèle dont on choisit le terme (« la section émet un avis … »).

const NOM_CHERCHEUR = { id: 'personne', label: 'Nom, prénom et affectation du chercheur', long: true };
const AGE = { id: 'age', label: 'Âge' };
const GRADE = { id: 'grade', label: 'Grade' };
const ANCIENNETE = { id: 'anciennete', label: 'Ancienneté dans le grade' };
const DIRECTION = { id: 'unite', label: "Code, intitulé et nom du directeur de l'unité (et éventuels DU adjoint(s))", long: true };
const ANCIEN_MANDAT = { id: 'ancien_mandat', label: 'Ancien mandat' };
const NOUVEAU_MANDAT = { id: 'nouveau_mandat', label: 'Nouveau mandat' };

const RUBRIQUES_CHERCHEUR = [
  { id: 'carriere', titre: 'Résumé de carrière, thèmes de recherche et projets' },
  { id: 'productions', titre: 'Productions les plus marquantes' },
  { id: 'activites', titre: 'Autres activités liées au métier de chercheur',
    aide: 'encadrement, animation, administration, enseignement, diffusion, valorisation, etc.' },
  { id: 'points', titre: 'Points forts et points faibles à signaler',
    aide: "dont l'intégration des activités du chercheur dans son unité" },
];

const AVIS_CHERCHEUR = [
  "Avis favorable (l'activité du chercheur est conforme à ses obligations statutaires)",
  "Avis différé (l'évaluation est renvoyée à la session suivante en raison de l'insuffisance ou de l'absence d'éléments du dossier)",
  "Avis réservé (la section a identifié dans l'activité du chercheur un ou plusieurs éléments qui nécessitent un suivi spécifique)",
  "Avis d'alerte (la section exprime des inquiétudes sur l'évolution de l'activité du chercheur)",
];

const SI_OUI_SI_NON = 'Si oui, en quoi ? Si non, pourquoi ?';

const TYPES = {
  vague: {
    nom: 'Évaluation à vagues ou mi-vagues',
    objetLabel: "Objet de l'évaluation",
    objet: 'Évaluation à vagues ou mi-vagues',
    champs: [NOM_CHERCHEUR, AGE, GRADE, ANCIENNETE],
    rubriques: [
      ...RUBRIQUES_CHERCHEUR,
      { id: 'resume', consigne: 'Résumé (à lire) en une dizaine de lignes des thématiques et des activités/réalisations des 2,5 années précédentes' },
    ],
    conclusion: { phrase: "À la suite de l'évaluation de votre dossier, la section émet un avis {} sur votre activité.",
                  choix: ['très favorable', 'favorable', 'réservé'] },
    avis: { titre: 'Évaluation biennale ou quadriennale', question: "Avis de la section sur l'activité du chercheur",
            options: AVIS_CHERCHEUR },
  },
  promotion: {
    nom: 'Demande de promotion',
    objetLabel: "Objet de l'évaluation",
    objet: 'Demande de promotion',
    champs: [{ id: 'grade_vise', label: 'Accès au grade de' }, NOM_CHERCHEUR, AGE, GRADE, ANCIENNETE],
    rubriques: RUBRIQUES_CHERCHEUR,
  },
  titularisation: {
    nom: 'Titularisation',
    objetLabel: "Objet de l'évaluation",
    objet: 'Titularisation',
    champs: [NOM_CHERCHEUR, AGE, GRADE, { id: 'recrutement', label: 'Date de recrutement' }],
    rubriques: [
      { id: 'carriere', titre: 'Résumé de carrière, thèmes de recherche et projets' },
      { id: 'realisations', titre: 'Réalisations depuis le recrutement' },
      { id: 'integration', titre: "Intégration dans l'unité et l'équipe" },
    ],
    consigneAppreciations: 'Quelques lignes…',
    conclusion: { phrase: 'La section 18 émet un avis {} à votre titularisation.',
                  choix: ['très favorable', 'favorable', 'réservé', 'défavorable'] },
    avis: { titre: 'Titularisation', question: 'Avis de la section sur la titularisation du chercheur',
            options: ['Avis favorable', 'Avis défavorable', 'Avis réservé'] },
  },
  direction: {
    nom: "Changement de direction d'unité",
    objetLabel: "Objet de l'examen",
    objet: 'Avis sur changement de direction',
    champs: [DIRECTION, ANCIEN_MANDAT, NOUVEAU_MANDAT],
    rubriques: [],
  },
  pertinence: {
    nom: "Pertinence d'association d'une unité",
    objetLabel: "Objet de l'examen",
    objet: "Avis de pertinence d'association au CNRS",
    champs: [{ id: 'nature', label: 'Nature de la demande', defaut: 'Renouvellement' }, DIRECTION, ANCIEN_MANDAT, NOUVEAU_MANDAT],
    rubriques: [
      { id: 'presentation', titre: "Présentation générale de l'unité" },
      { id: 'production', titre: 'Production scientifique et contrats' },
      { id: 'position', titre: "Position de l'unité dans le contexte local, régional et national" },
      { id: 'organisation', titre: "Organisation et vie de l'unité" },
      { id: 'perspectives', titre: 'Perspectives à cinq ans' },
      { id: 'equipes', titre: "Structure de l'unité et analyse des équipes",
        aide: 'seules les équipes relevant de la section 18 seront détaillées' },
    ],
    avis: { titre: 'Avis de pertinence du soutien du CNRS aux unités', question: '',
            options: ['Avis très favorable', 'Avis favorable', 'Avis défavorable', 'Avis réservé', "Pas d'avis"] },
  },
  gdr: {
    nom: 'GDR',
    objetLabel: "Objet de l'évaluation (cas particuliers chercheurs, unités et autres)",
    objet: 'GDR',
    champs: [{ id: 'nom_gdr', label: 'Nom du GDR', long: true }, { id: 'responsable', label: 'Responsable', long: true }],
    rubriques: [
      { id: 'renouvellement', consigne: 'Renouvellement ?', puce: true },
      { id: 'description', consigne: "Description succincte de l'objet du GDR et de son intérêt (aspect transdisciplinaire).", puce: true },
      { id: 'actions', consigne: 'Actions envisagées', puce: true },
      { id: 'communaute', consigne: 'Communauté concernée (est-elle bien représentative ?)', puce: true },
      { id: 'budget', consigne: 'Budget demandé', puce: true },
    ],
    qualite: 'Président de la section',
    avis: { titre: 'GDR', question: 'Avis de la section sur le GDR',
            options: ['Avis très favorable', 'Avis favorable', 'Avis réservé', 'Avis défavorable'] },
  },
  expertise: {
    nom: 'Expertise (cas particuliers)',
    objetLabel: "Objet de l'évaluation (cas particuliers chercheurs, unités et autres)",
    objet: null, // saisi dans le champ ci-dessous
    champs: [{ id: 'objet_libre', label: "Objet de l'évaluation", long: true, objet: true }, NOM_CHERCHEUR],
    rubriques: [],
  },
  ecole: {
    nom: 'École thématique',
    titreDocument: 'École thématique — Évaluation scientifique',
    enTeteSimple: true, // la fiche n'a ni session ni intitulé de section
    champs: [{ id: 'numero', label: 'N° ET' },
             { id: 'titre_et', label: "Titre de l'école", long: true }],
    rubriques: [
      { id: 'enjeux', titre: "Les enjeux stratégiques, les objectifs scientifiques de ce projet d'ET sont-ils pertinents ?", consigne: SI_OUI_SI_NON },
      { id: 'formation', titre: 'Les objectifs de formation sont-ils clairs et bien décrits ?', consigne: SI_OUI_SI_NON },
      { id: 'deroule', titre: 'Le déroulé pédagogique, le choix des séquences du programme et des intervenants est-il pertinent ?',
        consigne: 'Si non, que et qui suggérez-vous ?' },
      { id: 'participants', titre: 'Compte tenu de votre connaissance de la communauté scientifique de votre section, pensez-vous que cette école atteindra le nombre de participants prévus et estimez-vous crédible le nombre prévisionnel de participants CNRS ?',
        consigne: 'Si non, quel public faudrait-il prioritairement cibler ? Pourquoi ?' },
      { id: 'resume', titre: "Résumé de l'avis" },
      { id: 'positifs', titre: 'Points positifs' },
      { id: 'negatifs', titre: 'Points négatifs ou à améliorer' },
    ],
    sansAppreciations: true,
    sansSignature: true,
    avis: { titre: '', question: 'Avis succinct de la section sur le projet', apres: 'participants',
            options: ['Très favorable', 'Favorable', 'Défavorable', 'Avis réservé', "Pas d'avis"] },
  },
};

const MENTIONS = [
  'Ce rapport a été établi après délibérations de la section, sous la responsabilité de son président, à partir des appréciations du rapporteur, des observations et recommandations de la section.',
  'Les avis émis par les sections ne préjugent pas de la décision qui sera prise par la direction du CNRS.',
];

// ─── Texte saisi → blocs (paragraphes et listes) ──────────────────────────────
// Syntaxe : ligne vide = nouveau paragraphe, « - » en début de ligne = puce,
// **gras**, *italique*.

function blocs(texte) {
  const res = [];
  String(texte || '').replace(/\r/g, '').split(/\n\s*\n/).forEach(bloc => {
    const lignes = bloc.split('\n').map(l => l.trim()).filter(Boolean);
    if (!lignes.length) return;
    let para = [];
    let liste = null;
    const finPara = () => { if (para.length) { res.push({ type: 'p', texte: para.join(' ') }); para = []; } };
    const finListe = () => { if (liste) { res.push({ type: 'ul', items: liste }); liste = null; } };
    lignes.forEach(l => {
      const m = l.match(/^[-•*]\s+(.*)$/);
      if (m) { finPara(); (liste = liste || []).push(m[1]); }
      else { finListe(); para.push(l); }
    });
    finPara(); finListe();
  });
  return res;
}

// Découpe **gras** et *italique* en segments
function segments(s) {
  const out = [];
  const re = /\*\*(.+?)\*\*|\*(.+?)\*/g;
  let i = 0, m;
  while ((m = re.exec(s))) {
    if (m.index > i) out.push({ text: s.slice(i, m.index) });
    out.push(m[1] !== undefined ? { text: m[1], bold: true } : { text: m[2], italics: true });
    i = re.lastIndex;
  }
  if (i < s.length) out.push({ text: s.slice(i) });
  return out;
}

// ─── Structure commune aux deux formats ───────────────────────────────────────

function objetDe(d) {
  const t = TYPES[d.type];
  return t.objet || d.champs.objet_libre || '';
}

// Lignes de l'en-tête : [id, libellé, valeur]
function lignesInfos(d) {
  const t = TYPES[d.type];
  const L = [];
  if (!t.enTeteSimple) {
    // Section et intitulé figurent déjà dans le chapeau
    L.push(['_session', 'Session', d.session || '']);
    if (t.objetLabel) L.push(['_objet', t.objetLabel, objetDe(d)]);
  }
  t.champs.filter(c => !c.objet).forEach(c => L.push([c.id, c.label, d.champs[c.id] ?? c.defaut ?? '']));
  return L;
}

// Suite d'éléments à imprimer, dans l'ordre du modèle
function corps(d) {
  const t = TYPES[d.type];
  const E = [];
  let puces = null;
  const finPuces = () => { if (puces) { E.push({ genre: 'puces', items: puces }); puces = null; } };
  t.rubriques.forEach(r => {
    if (r.puce) { (puces = puces || []).push({ id: r.id, texte: d.rubriques[r.id] }); return; }
    finPuces();
    E.push({ genre: 'rubrique', id: r.id, titre: r.titre, aide: r.aide, texte: d.rubriques[r.id] });
    if (t.avis && t.avis.apres === r.id) E.push({ genre: 'avis' });
  });
  finPuces();
  if (!t.sansAppreciations) {
    E.push({ genre: 'rubrique', id: 'appreciations', titre: 'Appréciations générales et recommandations de la section',
             mentions: true, texte: d.rubriques.appreciations });
  }
  if (t.conclusion && d.conclusion !== '' && d.conclusion != null) {
    E.push({ genre: 'conclusion', texte: t.conclusion.phrase.replace('{}', t.conclusion.choix[d.conclusion] || '') });
  }
  if (!t.sansSignature) E.push({ genre: 'signature' });
  if (t.avis && !t.avis.apres) E.push({ genre: 'avis', page: true });
  return E;
}

// ─── PDF (pdfmake) ────────────────────────────────────────────────────────────

const BLEU = '#172b48';
const LARGEUR = 595.28 - 2 * 62; // A4 moins les marges

// Polices Latin Modern (celles de LaTeX) et logos : chargés au premier PDF,
// puis passés directement à pdfmake (indépendant de la version de la bibliothèque)
let pdfPret = null;
function preparerPdf() {
  if (pdfPret) return pdfPret;
  const enBase64 = buf => {
    const o = new Uint8Array(buf); let s = '';
    for (let i = 0; i < o.length; i += 0x8000) s += String.fromCharCode.apply(null, o.subarray(i, i + 0x8000));
    return btoa(s);
  };
  const charger = url => fetch(url).then(r => {
    if (!r.ok) throw new Error('Fichier introuvable : ' + url);
    return r.arrayBuffer();
  }).then(enBase64);
  const polices = ['lmroman10-regular', 'lmroman10-bold', 'lmroman10-italic', 'lmroman10-bolditalic', 'lmromancaps10-regular'];
  const res = {
    vfs: {},
    logos: {},
    fonts: {
      LM: { normal: 'lmroman10-regular.otf', bold: 'lmroman10-bold.otf',
            italics: 'lmroman10-italic.otf', bolditalics: 'lmroman10-bolditalic.otf' },
      LMCaps: { normal: 'lmromancaps10-regular.otf', bold: 'lmromancaps10-regular.otf',
                italics: 'lmromancaps10-regular.otf', bolditalics: 'lmromancaps10-regular.otf' },
    },
  };
  pdfPret = Promise.all([
    ...polices.map(p => charger('static/fonts/' + p + '.otf').then(b => { res.vfs[p + '.otf'] = b; })),
    ...['cnrs', 'conrs'].map(k => charger('static/rapport/logo-' + k + '.png')
      .then(b => { res.logos[k] = 'data:image/png;base64,' + b; })),
  ]).then(() => res).catch(e => { pdfPret = null; throw e; });
  return pdfPret;
}

// Document pdfmake prêt à télécharger
function creerPdf(d) {
  return preparerPdf().then(res => pdfMake.createPdf(docPdf(d, res.logos), null, res.fonts, res.vfs));
}

function pdfBlocs(texte, marge = 0) {
  const b = blocs(texte);
  if (!b.length) return [{ text: '—', color: '#777', margin: [marge, 0, 0, 6] }];
  return b.map(x => x.type === 'p'
    ? { text: segments(x.texte), margin: [marge, 0, 0, 6], alignment: 'justify' }
    : { ul: x.items.map(it => ({ text: segments(it), alignment: 'justify' })), margin: [marge + 8, 0, 0, 6] });
}

// Libellé court du pied de page
function piedDePage(t) {
  return t.titreDocument ? t.nom : 'Rapport de section';
}

function filet(epaisseur, marge) {
  return { canvas: [{ type: 'line', x1: 0, y1: 0, x2: LARGEUR, y2: 0, lineWidth: epaisseur, lineColor: '#000' }], margin: marge };
}

function caseACocher(cochee) {
  const c = [{ type: 'rect', x: 0, y: 1, w: 9, h: 9, lineWidth: 0.7 }];
  if (cochee) c.push({ type: 'line', x1: 1.5, y1: 2.5, x2: 7.5, y2: 8.5, lineWidth: 1.1 },
                     { type: 'line', x1: 7.5, y1: 2.5, x2: 1.5, y2: 8.5, lineWidth: 1.1 });
  return { canvas: c };
}

function pdfAvis(t, d, page) {
  const A = [];
  if (page) {
    A.push({ text: 'Avis de la section', font: 'LMCaps', fontSize: 16, alignment: 'center', pageBreak: 'before' });
    if (t.avis.titre) A.push({ text: t.avis.titre, italics: true, alignment: 'center', margin: [0, 2, 0, 0] });
    A.push(filet(0.8, [0, 14, 0, 8]));
  }
  if (t.avis.question) A.push({ text: t.avis.question, bold: true, color: page ? '#000' : BLEU, fontSize: page ? 11 : 12, margin: [0, page ? 0 : 8, 0, 8] });
  t.avis.options.forEach((o, i) => A.push({
    columns: [{ width: 18, ...caseACocher(String(d.avis) === String(i)) }, { width: '*', text: o }],
    margin: [0, 0, 0, 7],
  }));
  if (page) A.push(filet(0.8, [0, 4, 0, 0]));
  return A;
}

function docPdf(d, logos) {
  const t = TYPES[d.type];
  const titre = t.titreDocument || 'Rapport de section';
  const contenu = [];

  // En-tête : CNRS à gauche, Comité national à droite
  contenu.push({
    columns: [
      { image: logos.cnrs, height: 44, width: 44 },
      { width: '*', text: '' },
      { width: 'auto', stack: [
        { text: 'Comité national de la', font: 'LMCaps', fontSize: 11, alignment: 'right' },
        { text: 'recherche scientifique', font: 'LMCaps', fontSize: 11, alignment: 'right' },
        { text: 'Section 18 — Chimie et vivant', fontSize: 9.5, italics: true, alignment: 'right', margin: [0, 3, 0, 0] },
      ], margin: [0, 4, 8, 0] },
      { image: logos.conrs, width: 44, height: 44 },
    ],
  });
  contenu.push(filet(0.5, [0, 10, 0, 22]));

  contenu.push({ text: titre, font: 'LMCaps', fontSize: 20, alignment: 'center', characterSpacing: 0.5,
                 margin: [0, 0, 0, t.enTeteSimple ? 18 : 0] });
  if (!t.enTeteSimple) contenu.push({ text: d.session || '', italics: true, fontSize: 12, alignment: 'center', margin: [0, 4, 0, 18] });

  // En-tête du modèle, en tableau à filets (à la manière de booktabs)
  contenu.push({
    table: { widths: [165, '*'], body: lignesInfos(d).map(([, l, v]) => [{ text: l, bold: true }, { text: v }]) },
    layout: {
      hLineWidth: (i, n) => (i === 0 || i === n.table.body.length) ? 0.8 : 0.3,
      vLineWidth: () => 0,
      hLineColor: (i, n) => (i === 0 || i === n.table.body.length) ? '#000' : '#bbb',
      paddingLeft: () => 0, paddingRight: () => 6, paddingTop: () => 3.5, paddingBottom: () => 3.5,
    },
    margin: [0, 0, 0, 16],
  });

  corps(d).forEach(e => {
    if (e.genre === 'rubrique') {
      if (e.titre) {
        contenu.push({ stack: [{ text: e.titre, bold: true, fontSize: 12, color: BLEU }], unbreakable: true,
                       margin: [0, 8, 0, e.aide ? 1 : 5], headlineLevel: 1 });
        if (e.aide) contenu.push({ text: '(' + e.aide + ')', italics: true, fontSize: 9.5, color: '#444', margin: [0, 0, 0, 5] });
      }
      if (e.mentions) MENTIONS.forEach(m => contenu.push({ text: m, italics: true, fontSize: 9.5, alignment: 'justify', margin: [0, 0, 0, 4] }));
      contenu.push(...pdfBlocs(e.texte));
    } else if (e.genre === 'puces') {
      e.items.forEach(it => contenu.push({ columns: [
        { width: 12, text: '•' }, { width: '*', stack: pdfBlocs(it.texte) },
      ] }));
    } else if (e.genre === 'conclusion') {
      contenu.push({ text: e.texte, bold: true, margin: [0, 4, 0, 6] });
    } else if (e.genre === 'signature') {
      contenu.push({
        columns: [{ width: '*', text: '' }, { width: 200, stack: [
          { text: 'Fait le ' + dateLongue(d.date), margin: [0, 0, 0, 14] },
          { text: d.signataire || '', bold: true },
          { text: d.qualite || '', italics: true },
        ] }],
        margin: [0, 18, 0, 0], unbreakable: true,
      });
    } else if (e.genre === 'avis') {
      contenu.push(...pdfAvis(t, d, e.page));
    }
  });

  return {
    pageSize: 'A4',
    pageMargins: [62, 50, 62, 60],
    defaultStyle: { font: 'LM', fontSize: 11, lineHeight: 1.12 },
    pageBreakBefore: (noeud, suivants) => noeud.headlineLevel === 1 && suivants.length < 2,
    footer: (page, total) => ({
      margin: [62, 20, 62, 0],
      stack: [
        filet(0.4, [0, 0, 0, 4]),
        { columns: [
          { text: 'Section 18 du Comité national — ' + piedDePage(t), fontSize: 8.5, italics: true },
          { text: page + ' / ' + total, fontSize: 8.5, alignment: 'right' },
        ] },
      ],
    }),
    info: { title: titre + ' — ' + t.nom, author: 'Section 18 du Comité national' },
    content: contenu,
  };
}

// ─── LaTeX ────────────────────────────────────────────────────────────────────
// Les commentaires « % s18:… » repèrent chaque élément pour pouvoir réimporter le fichier.

function texEsc(s) {
  // La barre oblique inverse passe par un repère, pour que ses accolades ne soient pas échappées ensuite
  return String(s || '')
    .replace(/\\/g, '\u0000')
    .replace(/([&%$#_{}])/g, '\\$1')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}')
    .replace(/\u0000/g, '\\textbackslash{}')
    .replace(/·/g, '\\textperiodcentered{}');
}

function texInline(s) {
  return segments(s).map(x => {
    const e = texEsc(x.text);
    return x.bold ? '\\textbf{' + e + '}' : x.italics ? '\\emph{' + e + '}' : e;
  }).join('');
}

function texBlocs(texte) {
  const b = blocs(texte);
  if (!b.length) return '---\n';
  return b.map(x => x.type === 'p'
    ? texInline(x.texte) + '\n'
    : '\\begin{itemize}\n' + x.items.map(it => '  \\item ' + texInline(it)).join('\n') + '\n\\end{itemize}\n'
  ).join('\n');
}

function texAvis(t, d, page) {
  const L = [];
  if (page) {
    L.push('\\newpage', '\\begin{center}', '  {\\Large\\scshape Avis de la section}' + (t.avis.titre ? '\\\\[2pt]' : ''));
    if (t.avis.titre) L.push('  {\\itshape ' + texEsc(t.avis.titre) + '}');
    L.push('\\end{center}', '\\hrule\\medskip');
  }
  if (t.avis.question) L.push((page ? '\\textbf{' : '\\rubrique{') + texEsc(t.avis.question) + '}' + (page ? '\\par\\smallskip' : ''));
  L.push('\\begin{tabularx}{\\linewidth}{@{}cX@{}}',
    ...t.avis.options.map((o, i) => '\\caseavis{' + (String(d.avis) === String(i) ? 1 : 0) + '} & ' + texEsc(o) + ' \\\\[4pt] % s18:avis=' + i),
    '\\end{tabularx}');
  if (page) L.push('\\hrule');
  return L;
}

function docTex(d) {
  const t = TYPES[d.type];
  const titre = t.titreDocument || 'Rapport de section';
  const L = [
    '% s18:rapport type=' + d.type + ' version=1',
    '% Rapport généré par le site de la Section 18 du Comité national.',
    '% Compiler avec pdflatex (ou Overleaf), les deux logos dans le même dossier.',
    '% Pour corriger une coquille sans LaTeX : modifier le texte, puis réimporter ce fichier',
    '% sur la page « Rédaction des rapports ». Ne pas supprimer les commentaires « % s18:… ».',
    '\\documentclass[11pt,a4paper]{article}',
    '\\usepackage[utf8]{inputenc}',
    '\\usepackage[T1]{fontenc}',
    '\\usepackage[french]{babel}',
    '\\frenchsetup{StandardLists=true}', // puces « • » comme dans les modèles
    '\\usepackage[a4paper,top=1.8cm,bottom=2.4cm,left=2.2cm,right=2.2cm,footskip=1.2cm]{geometry}',
    '\\usepackage{lmodern,microtype,xcolor,amssymb,enumitem,array,tabularx,booktabs,colortbl,graphicx,fancyhdr,lastpage,textcomp}',
    '\\definecolor{cnrs}{HTML}{172B48}',
    '\\setlength{\\parindent}{0pt}',
    '\\setlength{\\parskip}{0.5em}',
    '\\setlist[itemize]{topsep=2pt,itemsep=1pt}',
    '\\pagestyle{fancy}',
    '\\fancyhf{}',
    '\\renewcommand{\\headrulewidth}{0pt}',
    '\\renewcommand{\\footrulewidth}{0.4pt}',
    '\\fancyfoot[L]{\\footnotesize\\itshape Section 18 du Comité national --- ' + texEsc(piedDePage(t)) + '}',
    '\\fancyfoot[R]{\\footnotesize \\thepage\\,/\\,\\pageref{LastPage}}',
    '\\newcommand{\\rubrique}[1]{\\par\\medskip{\\large\\bfseries\\color{cnrs} #1}\\par\\nopagebreak}',
    '\\newcommand{\\aide}[1]{{\\small\\itshape (#1)}\\par\\nopagebreak}',
    '\\newcommand{\\caseavis}[1]{\\ifnum#1=1 $\\boxtimes$\\else $\\square$\\fi}',
    '',
    '\\begin{document}',
    '',
    '\\noindent\\includegraphics[height=1.55cm]{logo-cnrs}\\hfill',
    '\\begin{tabular}[b]{@{}r@{}}\\textsc{Comité national de la}\\\\ \\textsc{recherche scientifique}\\\\[2pt] {\\small\\itshape Section 18 --- Chimie et vivant}\\end{tabular}\\hspace{0.6em}%',
    '\\includegraphics[height=1.55cm]{logo-conrs}',
    '\\par\\vspace{6pt}\\hrule\\vspace{1.2cm}',
    '',
    '\\begin{center}',
    '  {\\LARGE\\scshape ' + texEsc(titre) + '}' + (t.enTeteSimple ? '' : '\\\\[4pt]'),
  ];
  if (!t.enTeteSimple) L.push('  {\\large\\itshape ' + texEsc(d.session) + '} % s18:session');
  L.push(
    '\\end{center}',
    '\\vspace{0.4cm}',
    '',
    '\\noindent\\begin{tabularx}{\\linewidth}{@{}>{\\bfseries}p{5.6cm}X@{}}',
    '\\toprule',
    lignesInfos(d).map(([id, l, v]) => texEsc(l) + ' & ' + texEsc(v) + ' \\\\ % s18:champ=' + id).join('\n\\arrayrulecolor{black!25}\\midrule[0.2pt]\\arrayrulecolor{black}\n'),
    '\\bottomrule',
    '\\end{tabularx}',
    '\\vspace{0.4cm}',
    '',
  );

  corps(d).forEach(e => {
    if (e.genre === 'rubrique') {
      L.push('% s18:rubrique=' + e.id);
      if (e.titre) L.push('\\rubrique{' + texEsc(e.titre) + '}');
      if (e.aide) L.push('\\aide{' + texEsc(e.aide) + '}');
      if (e.mentions) L.push('{\\small\\itshape ' + MENTIONS.map(texEsc).join('\\par ') + '\\par} % s18:mentions');
      L.push(texBlocs(e.texte));
    } else if (e.genre === 'puces') {
      L.push('\\begin{itemize}[leftmargin=1.2em]');
      e.items.forEach(it => L.push('% s18:rubrique=' + it.id, '\\item ' + texBlocs(it.texte).replace(/\n+$/, '')));
      L.push('\\end{itemize}', '% s18:fin');
    } else if (e.genre === 'conclusion') {
      L.push('% s18:fin', '\\textbf{' + texEsc(e.texte) + '} % s18:conclusion=' + d.conclusion);
    } else if (e.genre === 'signature') {
      L.push(
        '% s18:fin',
        '\\vspace{1cm}',
        '\\hfill\\begin{minipage}{6.5cm}',
        'Fait le ' + texEsc(dateLongue(d.date)) + '\\\\[1.2em] % s18:date',
        '\\textbf{' + texEsc(d.signataire) + '}\\\\ % s18:signataire',
        '\\textit{' + texEsc(d.qualite) + '} % s18:qualite',
        '\\end{minipage}',
      );
    } else if (e.genre === 'avis') {
      L.push('% s18:fin', ...texAvis(t, d, e.page));
    }
  });
  L.push('% s18:fin', '', '\\end{document}', '');
  return L.join('\n');
}

// Archive .zip : rapport .tex + logos, prête à compiler
function zipTex(d) {
  const zip = new JSZip();
  zip.file(nomFichier(d, 'tex'), docTex(d));
  return Promise.all(['logo-cnrs.pdf', 'logo-conrs.pdf'].map(f =>
    fetch('static/rapport/' + f).then(r => r.arrayBuffer()).then(b => zip.file(f, b))))
    .then(() => zip.generateAsync({ type: 'blob' }));
}

// ─── Import d'un .tex généré ici (éventuellement corrigé à la main) ───────────

function texVersTexte(s) {
  return s
    .replace(/\\textbf\{([^{}]*)\}/g, '**$1**')
    .replace(/\\emph\{([^{}]*)\}/g, '*$1*')
    .replace(/\\textit\{([^{}]*)\}/g, '$1')
    .replace(/\\textbackslash\{\}/g, '\u0000')
    .replace(/\\textasciitilde\{\}/g, '~')
    .replace(/\\textasciicircum\{\}/g, '^')
    .replace(/\\textperiodcentered\{\}/g, '·')
    .replace(/\\([&%$#_{}])/g, '$1')
    .replace(/\u0000/g, '\\')
    .trim();
}

// Retire le commentaire de fin de ligne (« % » non échappé)
function sansCommentaire(l) {
  return l.replace(/(^|[^\\])%.*$/, '$1');
}

function corpsTexVersTexte(lignes) {
  const out = [];
  lignes.forEach(l => {
    const s = sansCommentaire(l).trim();
    if (/^\\(rubrique|aide)\{/.test(s) || /^\\(begin|end)\{itemize\}/.test(s) || /^\{\\small\\itshape/.test(s)) {
      if (/^\\begin\{itemize\}/.test(s) && out.length && out[out.length - 1] !== '') out.push('');
      return;
    }
    if (s === '---') return;
    const item = s.match(/^\\item\s*(.*)$/);
    out.push(item ? '- ' + texVersTexte(item[1]) : (s ? texVersTexte(s) : ''));
  });
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

function importerTex(source) {
  const lignes = source.replace(/\r/g, '').split('\n');
  const entete = (lignes.find(l => l.startsWith('% s18:rapport')) || '').match(/type=(\w+)/);
  if (!entete || !TYPES[entete[1]]) {
    throw new Error("Ce fichier n'a pas été généré par la page « Rédaction des rapports » (repère « % s18:rapport » absent).");
  }
  const t = TYPES[entete[1]];
  const d = { type: entete[1], champs: {}, rubriques: {}, avis: '', conclusion: '' };

  let courante = null;
  let tampon = [];
  const finRubrique = () => {
    if (courante) {
      let texte = corpsTexVersTexte(tampon);
      // Rubrique imprimée comme puce du modèle : ce premier « \item » n'est pas du texte saisi
      if ((t.rubriques.find(r => r.id === courante) || {}).puce) texte = texte.replace(/^- /, '');
      d.rubriques[courante] = texte === '---' ? '' : texte;
    }
    courante = null; tampon = [];
  };

  lignes.forEach(l => {
    const repere = l.match(/%\s*s18:(\w+)(?:=(\S+))?\s*$/);
    const contenu = sansCommentaire(l).trim();
    if (repere) {
      const [, cle, val] = repere;
      if (cle === 'rubrique') { finRubrique(); courante = val; return; }
      if (cle === 'fin') { finRubrique(); return; }
      if (cle === 'mentions') return;
      if (cle === 'champ') {
        const v = contenu.split(/(?<!\\)&/).slice(1).join('&').replace(/\\\\\s*$/, '');
        if (val === '_session') d.session = texVersTexte(v);
        else if (val === '_objet') d.champs.objet_libre = texVersTexte(v);
        else if (!val.startsWith('_')) d.champs[val] = texVersTexte(v);
        return;
      }
      if (cle === 'session') { d.session = texVersTexte(contenu.replace(/^\{\\large\\itshape\s*/, '').replace(/\}$/, '')); return; }
      if (cle === 'conclusion') { d.conclusion = val; return; }
      if (cle === 'date') {
        const m = texVersTexte(contenu).match(/(\d{1,2})(?:er)?\s+(\S+)\s+(\d{4})/);
        const mois = m ? MOIS.indexOf(m[2].toLowerCase()) : -1;
        if (mois >= 0) d.date = m[3] + '-' + String(mois + 1).padStart(2, '0') + '-' + m[1].padStart(2, '0');
        return;
      }
      if (cle === 'signataire') { d.signataire = texVersTexte(contenu.replace(/\\\\$/, '')).replace(/^\*\*|\*\*$/g, ''); return; }
      if (cle === 'qualite') { d.qualite = texVersTexte(contenu); return; }
      if (cle === 'avis') { if (/\\caseavis\{1\}/.test(contenu)) d.avis = val; return; }
    }
    if (courante) tampon.push(l);
  });
  finRubrique();
  if (t.objet) delete d.champs.objet_libre;
  return d;
}

// ─── Utilitaires ──────────────────────────────────────────────────────────────

function dateLongue(s) {
  if (!s) return '';
  return new Date(s + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function nomFichier(d, ext) {
  const t = TYPES[d.type];
  const qui = d.champs.personne || d.champs.unite || d.champs.nom_gdr || d.champs.titre_et || d.champs.objet_libre || '';
  const base = ('Rapport_' + t.nom + '_' + qui.split(/[,:(]/)[0])
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 80);
  return base + '.' + ext;
}

function telecharger(contenu, nom, type) {
  const url = URL.createObjectURL(contenu instanceof Blob ? contenu : new Blob([contenu], { type }));
  const a = Object.assign(document.createElement('a'), { href: url, download: nom });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
