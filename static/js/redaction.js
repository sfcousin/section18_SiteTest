/* Rédaction des rapports de section : formulaire → PDF (pdfmake) ou fichier .tex.
   Tout reste dans le navigateur : rien n'est envoyé sur un serveur. */

// ─── Types de rapport (d'après les modèles Word de la section) ────────────────

const PERSONNE = { id: 'personne', label: "Nom, prénom et affectation de la chercheuse ou du chercheur", long: true };
const AGE = { id: 'age', label: 'Âge' };
const GRADE = { id: 'grade', label: 'Grade' };
const ANCIENNETE = { id: 'anciennete', label: 'Ancienneté dans le grade' };

const RUBRIQUES_CHERCHEUR = [
  { id: 'carriere', titre: 'Résumé de carrière, thèmes de recherche et projets' },
  { id: 'productions', titre: 'Productions les plus marquantes' },
  { id: 'activites', titre: 'Autres activités liées au métier de chercheuse ou chercheur',
    aide: 'encadrement, animation, administration, enseignement, diffusion, valorisation, etc.' },
  { id: 'points', titre: 'Points forts et points faibles à signaler',
    aide: "dont l'intégration des activités dans l'unité" },
];

const TYPES = {
  vague: {
    nom: 'Évaluation à vague ou à mi-vague',
    objet: 'Évaluation à vague ou à mi-vague',
    champs: [PERSONNE, AGE, GRADE, ANCIENNETE],
    rubriques: RUBRIQUES_CHERCHEUR,
    avis: {
      titre: 'Évaluation à vague ou à mi-vague',
      question: "Avis de la section sur l'activité de la chercheuse ou du chercheur",
      options: [
        "Avis favorable (l'activité est conforme aux obligations statutaires)",
        "Avis différé (l'évaluation est renvoyée à la session suivante en raison de l'insuffisance ou de l'absence d'éléments du dossier)",
        "Avis réservé (la section a identifié dans l'activité un ou plusieurs éléments qui nécessitent un suivi spécifique)",
        "Avis d'alerte (la section exprime des inquiétudes sur l'évolution de l'activité)",
      ],
    },
  },
  promotion: {
    nom: 'Demande de promotion',
    objet: 'Demande de promotion',
    champs: [{ id: 'grade_vise', label: 'Accès au grade de' }, PERSONNE, AGE, GRADE, ANCIENNETE],
    rubriques: RUBRIQUES_CHERCHEUR,
  },
  titularisation: {
    nom: 'Titularisation',
    objet: 'Titularisation',
    champs: [PERSONNE, AGE, GRADE, { id: 'recrutement', label: 'Date de recrutement' }],
    rubriques: [
      { id: 'carriere', titre: 'Résumé de carrière, thèmes de recherche et projets' },
      { id: 'realisations', titre: 'Réalisations depuis le recrutement' },
      { id: 'integration', titre: "Intégration dans l'unité et l'équipe" },
    ],
    avis: {
      titre: 'Titularisation',
      question: 'Avis de la section sur la titularisation',
      options: ['Avis favorable', 'Avis réservé', 'Avis défavorable'],
    },
  },
  direction: {
    nom: "Changement de direction d'unité",
    objet: 'Avis sur changement de direction',
    champs: [
      { id: 'unite', label: "Code et intitulé de l'unité", long: true },
      { id: 'directeur', label: 'Directrice ou directeur (et éventuels adjoint·es)', long: true },
      { id: 'ancien_mandat', label: 'Ancien mandat' },
      { id: 'nouveau_mandat', label: 'Nouveau mandat' },
    ],
    rubriques: [],
  },
  pertinence: {
    nom: "Pertinence d'association d'une unité",
    objet: "Avis de pertinence d'association au CNRS",
    champs: [
      { id: 'unite', label: "Code et intitulé de l'unité", long: true },
      { id: 'ancien_mandat', label: 'Ancien mandat' },
      { id: 'nouveau_mandat', label: 'Nouveau mandat' },
    ],
    rubriques: [
      { id: 'presentation', titre: "Présentation générale de l'unité" },
      { id: 'production', titre: 'Production scientifique et contrats' },
      { id: 'position', titre: "Position de l'unité dans le contexte local, régional et national" },
      { id: 'organisation', titre: "Organisation et vie de l'unité" },
      { id: 'perspectives', titre: 'Perspectives à cinq ans' },
      { id: 'equipes', titre: "Structure de l'unité et analyse des équipes",
        aide: 'seules les équipes relevant de la section 18 sont détaillées' },
    ],
    avis: {
      titre: 'Avis de pertinence du soutien du CNRS aux unités',
      question: "Avis de la section sur l'unité",
      options: ['Avis très favorable', 'Avis favorable', 'Avis réservé', 'Avis défavorable', "Pas d'avis"],
    },
  },
  gdr: {
    nom: 'GDR',
    objet: 'GDR',
    champs: [
      { id: 'nom_gdr', label: 'Nom du GDR', long: true },
      { id: 'responsable', label: 'Responsable' },
      { id: 'renouvellement', label: 'Création ou renouvellement' },
    ],
    rubriques: [
      { id: 'description', titre: 'Objet du GDR et intérêt', aide: 'aspect transdisciplinaire' },
      { id: 'actions', titre: 'Actions envisagées' },
      { id: 'communaute', titre: 'Communauté concernée', aide: 'est-elle bien représentative ?' },
      { id: 'budget', titre: 'Budget demandé' },
    ],
    avis: {
      titre: 'GDR',
      question: 'Avis de la section sur le GDR',
      options: ['Avis très favorable', 'Avis favorable', 'Avis réservé', 'Avis défavorable'],
    },
  },
  expertise: {
    nom: 'Expertise (cas particuliers)',
    objet: null, // saisi librement
    champs: [{ id: 'objet_libre', label: "Objet de l'évaluation", long: true }, PERSONNE],
    rubriques: [],
  },
  ecole: {
    nom: 'École thématique',
    titreDocument: 'École thématique — Évaluation scientifique',
    objet: null,
    champs: [{ id: 'numero', label: 'N° ET' }, { id: 'titre_et', label: "Titre de l'école", long: true }],
    rubriques: [
      { id: 'enjeux', titre: 'Les enjeux stratégiques et les objectifs scientifiques du projet sont-ils pertinents ?' },
      { id: 'formation', titre: 'Les objectifs de formation sont-ils clairs et bien décrits ?' },
      { id: 'deroule', titre: 'Le déroulé pédagogique, le choix des séquences et des intervenant·es sont-ils pertinents ?' },
      { id: 'resume', titre: "Résumé de l'avis" },
      { id: 'positifs', titre: 'Points positifs' },
      { id: 'negatifs', titre: 'Points négatifs ou à améliorer' },
    ],
    sansAppreciations: true,
    avis: {
      titre: 'École thématique',
      question: 'Avis succinct de la section sur le projet',
      options: ['Très favorable', 'Favorable', 'Avis réservé', 'Défavorable'],
    },
  },
};

const MENTIONS = [
  "Ce rapport a été établi après délibérations de la section, sous la responsabilité de sa présidence, à partir des appréciations des rapporteur·es, des observations et recommandations de la section.",
  "Les avis émis par les sections ne préjugent pas de la décision qui sera prise par la direction du CNRS.",
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
      else if (liste && !para.length && /^\s/.test(l)) { liste[liste.length - 1] += ' ' + l; }
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

// ─── PDF (pdfmake) ────────────────────────────────────────────────────────────

const BLEU = '#162050';

function pdfBlocs(texte) {
  const b = blocs(texte);
  if (!b.length) return [{ text: '—', color: '#888', margin: [0, 0, 0, 6] }];
  return b.map(x => x.type === 'p'
    ? { text: segments(x.texte), margin: [0, 0, 0, 6], alignment: 'justify' }
    : { ul: x.items.map(it => ({ text: segments(it), alignment: 'justify' })), margin: [0, 0, 0, 6] });
}

function filet() {
  return { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.6, lineColor: '#999' }], margin: [0, 6, 0, 10] };
}

function titreRubrique(r) {
  return {
    text: [{ text: r.titre.toUpperCase(), bold: true, color: BLEU }, r.aide ? { text: '  (' + r.aide + ')', italics: true, color: '#555', fontSize: 9 } : ''],
    margin: [0, 2, 0, 6],
    headlineLevel: 1,
  };
}

function docPdf(d) {
  const t = TYPES[d.type];
  const objet = t.objet || d.champs.objet_libre || '';
  const contenu = [
    { text: t.titreDocument || 'Rapport de section', fontSize: 17, bold: true, color: BLEU, margin: [0, 0, 0, 10] },
    { text: [{ text: 'Section du Comité national : ', bold: true }, '18'] },
    { text: [{ text: 'Session : ', bold: true }, d.session || ''] },
    { text: [{ text: 'Intitulé de la section : ', bold: true }, 'Chimie et vivant'] },
  ];
  if (t.objet) contenu.push({ text: [{ text: "Objet de l'évaluation : ", bold: true }, objet] });
  t.champs.forEach(c => contenu.push({ text: [{ text: c.label + ' : ', bold: true }, d.champs[c.id] || ''] }));
  contenu.push(filet());

  t.rubriques.forEach(r => {
    contenu.push(titreRubrique(r), ...pdfBlocs(d.rubriques[r.id]), filet());
  });

  if (!t.sansAppreciations) {
    contenu.push(titreRubrique({ titre: 'Appréciations générales et recommandations de la section' }));
    MENTIONS.forEach(m => contenu.push({ text: m, italics: true, fontSize: 9, color: '#444', margin: [0, 0, 0, 4] }));
    contenu.push({ text: '', margin: [0, 0, 0, 4] }, ...pdfBlocs(d.rubriques.appreciations));
  }

  contenu.push(
    { text: 'Fait le ' + dateLongue(d.date), alignment: 'right', margin: [0, 16, 0, 4] },
    { text: d.signataire || '', alignment: 'right', bold: true },
    { text: d.qualite || '', alignment: 'right' },
  );

  if (t.avis) {
    contenu.push(
      { text: t.avis.titre.toUpperCase(), bold: true, color: BLEU, fontSize: 12, margin: [0, 24, 0, 6], pageBreak: 'before' },
      { text: t.avis.question, bold: true, margin: [0, 0, 0, 8] },
      {
        table: {
          widths: [18, '*'],
          body: t.avis.options.map((o, i) => [
            { text: String(d.avis) === String(i) ? 'X' : '', alignment: 'center', bold: true },
            { text: o },
          ]),
        },
        layout: { hLineColor: () => '#999', vLineColor: () => '#999', paddingTop: () => 4, paddingBottom: () => 4 },
      },
    );
  }

  return {
    pageSize: 'A4',
    pageMargins: [40, 40, 40, 50],
    // Pas de titre de rubrique seul en bas de page
    pageBreakBefore: (noeud, suivants) => noeud.headlineLevel === 1 && suivants.length < 2,
    defaultStyle: { fontSize: 10.5, lineHeight: 1.15 },
    footer: (page, total) => ({ text: page + ' / ' + total, alignment: 'center', fontSize: 8, color: '#888' }),
    info: { title: (t.titreDocument || 'Rapport de section') + ' — ' + t.nom },
    content: contenu,
  };
}

// ─── LaTeX ────────────────────────────────────────────────────────────────────

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

function texRubrique(r) {
  return '\\rubrique{' + texEsc(r.titre.toUpperCase()) + '}' + (r.aide ? '{' + texEsc(r.aide) + '}' : '{}') + '\n';
}

function docTex(d) {
  const t = TYPES[d.type];
  const L = [];
  L.push(
    '% Rapport généré par le site de la Section 18 — à compiler avec pdflatex (ou Overleaf)',
    '\\documentclass[11pt,a4paper]{article}',
    '\\usepackage[utf8]{inputenc}',
    '\\usepackage[T1]{fontenc}',
    '\\usepackage[french]{babel}',
    '\\usepackage[margin=2cm]{geometry}',
    '\\usepackage{lmodern,microtype,xcolor,amssymb,enumitem,array,textcomp}',
    '\\definecolor{cnrs}{HTML}{162050}',
    '\\setlength{\\parindent}{0pt}',
    '\\setlength{\\parskip}{0.5em}',
    '\\setlist[itemize]{topsep=2pt,itemsep=1pt}',
    '\\pagestyle{plain}',
    '\\newcommand{\\champ}[2]{\\textbf{#1 :} #2\\par}',
    '\\newcommand{\\filet}{\\par\\noindent\\rule{\\linewidth}{0.4pt}\\par}',
    '\\newcommand{\\rubrique}[2]{\\par\\medskip{\\color{cnrs}\\bfseries #1}\\ifx&#2&\\else\\ {\\small\\itshape (#2)}\\fi\\par}',
    '\\newcommand{\\caseavis}[1]{\\ifnum#1=1 $\\boxtimes$\\else $\\square$\\fi}',
    '',
    '\\begin{document}',
    '',
    '{\\LARGE\\bfseries\\color{cnrs} ' + texEsc(t.titreDocument || 'Rapport de section') + '}\\par\\bigskip',
    '\\champ{Section du Comité national}{18}',
    '\\champ{Session}{' + texEsc(d.session) + '}',
    '\\champ{Intitulé de la section}{Chimie et vivant}',
  );
  if (t.objet) L.push("\\champ{Objet de l'évaluation}{" + texEsc(t.objet) + '}');
  t.champs.forEach(c => L.push('\\champ{' + texEsc(c.label) + '}{' + texEsc(d.champs[c.id]) + '}'));
  L.push('\\filet', '');

  t.rubriques.forEach(r => L.push(texRubrique(r) + texBlocs(d.rubriques[r.id]), '\\filet', ''));

  if (!t.sansAppreciations) {
    L.push(texRubrique({ titre: 'APPRÉCIATIONS GÉNÉRALES ET RECOMMANDATIONS DE LA SECTION' }));
    L.push('{\\small\\itshape ' + MENTIONS.map(texEsc).join('\\par ') + '\\par}', '');
    L.push(texBlocs(d.rubriques.appreciations), '');
  }

  L.push(
    '\\bigskip',
    '\\begin{flushright}',
    'Fait le ' + texEsc(dateLongue(d.date)) + '\\\\[1em]',
    '\\textbf{' + texEsc(d.signataire) + '}\\\\',
    texEsc(d.qualite),
    '\\end{flushright}',
  );

  if (t.avis) {
    L.push(
      '', '\\newpage',
      '{\\large\\bfseries\\color{cnrs} ' + texEsc(t.avis.titre.toUpperCase()) + '}\\par\\medskip',
      '\\textbf{' + texEsc(t.avis.question) + '}\\par\\medskip',
      '\\begin{tabular}{|c|p{0.85\\linewidth}|}', '\\hline',
      ...t.avis.options.map((o, i) => '\\caseavis{' + (String(d.avis) === String(i) ? 1 : 0) + '} & ' + texEsc(o) + ' \\\\ \\hline'),
      '\\end{tabular}',
    );
  }
  L.push('', '\\end{document}', '');
  return L.join('\n');
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
  const url = URL.createObjectURL(new Blob([contenu], { type }));
  const a = Object.assign(document.createElement('a'), { href: url, download: nom });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
