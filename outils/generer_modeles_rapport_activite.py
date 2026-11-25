#!/usr/bin/env python3
"""
Génère les modèles de rapport d'activité des chercheurs et chercheuses (évaluation à mi-vague
et à vague), en Word (.docx) et en LaTeX (.tex), dans documents/modeles/.

Plan et consignes : « Recommandations pour la rédaction du dossier d'évaluation de l'activité
des chercheurs et des chercheuses du CNRS » (SGCN / DRH, novembre 2025).
Pour modifier les modèles : changer RUBRIQUES ci-dessous, puis relancer le script.

Dépendance : python-docx (pip install python-docx).
Usage : python3 outils/generer_modeles_rapport_activite.py
"""
import os

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.shared import Pt, RGBColor, Cm

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SORTIE = os.path.join(RACINE, 'documents', 'modeles')
SOURCE = ("Plan et consignes : « Recommandations pour la rédaction du dossier d'évaluation de l'activité "
          "des chercheurs et des chercheuses du CNRS », SGCN / DRH, novembre 2025.")

# Variantes : mi-vague (5 semestres) et vague (10 semestres)
VARIANTES = {
    'mi-vague': dict(titre='évaluation à mi-vague', semestres='5', pages='15', productions='5', projet=False),
    'vague': dict(titre='évaluation à vague', semestres='10', pages='30', productions='10', projet=True),
}

# Chaque rubrique : titre, consignes (paragraphes), puces. « {s} » = nombre de semestres, etc.
RUBRIQUES = [
    dict(titre='Curriculum vitæ', consignes=['Votre curriculum vitæ.']),
    dict(titre='Résumé de votre activité',
         consignes=["Résumé (1/2 page) qui permettra à l'ensemble des membres de la Section et/ou CID "
                    "de prendre connaissance de votre profil scientifique."]),
    dict(titre="Rapport d'activité",
         consignes=["Vous présenterez de manière critique, en {p} pages maximum, les éléments suivants, "
                    "en veillant à faire ressortir la valeur et l'influence de votre travail sur l'avancée "
                    "des connaissances dans votre domaine :"],
         puces=["votre activité de recherche au cours des {s} derniers semestres, les facteurs qui ont guidé "
                "vos choix, les résultats obtenus, leur portée et leur impact, et les éventuelles difficultés rencontrées ;",
                "votre participation à des collaborations avec des partenaires académiques, contractuelles ou non, "
                "dans un cadre français, européen ou international (préciser votre rôle, les partenaires, "
                "les thèmes des travaux et leur impact) ;",
                "vos participations à des contrats de recherche (ANR, contrats européens, autres agences) : "
                "intitulé long, acronyme, durée, partenaires et montants, nature de vos responsabilités "
                "(PI, co-PI, Work Package Manager), thème et contenu des travaux, portée et impact ;",
                "la place de votre recherche dans celle de votre unité, du point de vue des thématiques et des "
                "équipes (éventuellement sous forme d'organigramme) ;",
                "vos mobilités éventuelles, géographiques, thématiques ou fonctionnelles (séjours dans d'autres "
                "laboratoires publics ou privés, en France, en Europe ou à l'étranger, et leurs apports) ;",
                "les distinctions scientifiques reçues et les contributions qu'elles ont récompensées."],
         sous=dict(titre='Productions scientifiques ({n} au maximum)',
                   consignes=["Classez vos productions par ordre d'importance. Pour chacune, expliquez sa portée, "
                              "son impact et votre contribution personnelle, et donnez le lien vers la production "
                              "elle-même dans HAL (ou une autre archive ouverte)."],
                   modele=['Référence complète — lien HAL',
                           'Portée, impact et contribution personnelle : …'])),
    dict(titre='Enseignement, formation et diffusion de la culture scientifique',
         consignes=['Pour les {s} derniers semestres :'],
         puces=["thèses dirigées et post-doctorats encadrés (noms, sujets, part prise dans l'encadrement, "
                "contenu et portée des travaux, devenir des docteurs et post-doctorants) ;",
                "participations à l'enseignement (niveau, titres des cours, établissements, nombre annuel d'heures) ;",
                "implication dans le partage, le management ou la publication des données de la recherche ;",
                "organisation de conférences, workshops, congrès et rencontres « portes ouvertes » ;",
                "revues ou ouvrages de vulgarisation et diffusion de l'information scientifique vers des publics non spécialistes ;",
                "interventions dans la presse écrite et audiovisuelle ;",
                "travaux d'expertise ;", "autres."]),
    dict(titre='Transfert technologique, relations industrielles et valorisation',
         consignes=['Pour les {s} derniers semestres :'],
         puces=["contrats industriels et autres (durée, financeurs, partenaires et montants, nature de vos "
                "responsabilités, thème, contenu, portée et impact des travaux) ;",
                "projets de création d'entreprises ;",
                "travaux donnant lieu à des brevets ou à des développements de logiciels (votre rôle, contenu, "
                "difficultés rencontrées, impact) ;",
                "activités de consultance (destinataires, temps passé) ; distinctions reçues pour des activités "
                "de transfert ou de valorisation ;", "autres."]),
    dict(titre='Encadrement, animation et management de la recherche',
         consignes=['Pour les {s} derniers semestres, en mettant en lumière la manière d\'exercer vos '
                    'responsabilités, vos constats et les difficultés éventuelles rencontrées :'],
         puces=["animation de programmes ou projets français, européens ou internationaux (type, objectif, ampleur, impact) ;",
                "direction d'équipe ou de laboratoire (nombre de personnes) ;",
                "autres responsabilités ou activités collectives (management de la recherche, missions d'intérêt "
                "général, conseils scientifiques, commissions, comités de lecture, etc.) ;", "autres."]),
    dict(titre='Objectifs / Projet de recherche', projet=True,
         consignes=['Vos objectifs de recherche pour les 10 prochains semestres, notamment en perspective avec le '
                    "projet de votre unité, et leur contribution aux grandes missions du CNRS."],
         sans_objet="Sans objet pour une évaluation à mi-vague (rubrique conservée pour respecter le plan)."),
    dict(titre='Observations éventuelles',
         consignes=["Observations que vous souhaitez porter à la connaissance de votre Section et/ou CID (1/2 page)."]),
]


def remplir(texte, v):
    return texte.replace('{s}', v['semestres']).replace('{p}', v['pages']).replace('{n}', v['productions'])


# ─── Word ─────────────────────────────────────────────────────────────────────

GRIS = RGBColor(0x6B, 0x72, 0x80)


def police_arial(style, taille, gras=False, couleur=None):
    style.font.name = 'Arial'
    style.font.size = Pt(taille)
    style.font.bold = gras
    if couleur:
        style.font.color.rgb = couleur
    style.element.rPr.rFonts.set(qn('w:eastAsia'), 'Arial')


def consigne(doc, texte, style=None):
    p = doc.add_paragraph(style=style)
    r = p.add_run(texte)
    r.italic = True
    r.font.color.rgb = GRIS
    return p


def word(nom, v):
    doc = Document()
    for s in doc.sections:
        s.top_margin = s.bottom_margin = Cm(2)
        s.left_margin = s.right_margin = Cm(2)
    normal = doc.styles['Normal']
    police_arial(normal, 10)
    normal.paragraph_format.line_spacing = 1
    normal.paragraph_format.space_after = Pt(4)
    police_arial(doc.styles['Title'], 16, gras=True, couleur=RGBColor(0x22, 0x39, 0x7F))
    police_arial(doc.styles['Heading 1'], 12, gras=True, couleur=RGBColor(0x22, 0x39, 0x7F))
    police_arial(doc.styles['Heading 2'], 10, gras=True, couleur=RGBColor(0x22, 0x39, 0x7F))
    for st in ('Heading 1', 'Heading 2'):
        doc.styles[st].paragraph_format.space_before = Pt(10)
        doc.styles[st].paragraph_format.space_after = Pt(4)
    police_arial(doc.styles['List Bullet'], 10)
    police_arial(doc.styles['List Number'], 10)

    doc.add_paragraph("Rapport d'activité — " + v['titre'], style='Title')
    p = doc.add_paragraph()
    p.add_run('Nom, prénom : ').bold = True
    p.add_run('…')
    for lib in ('Grade', 'Unité (UMR)', 'Section(s) / CID', 'Période de référence'):
        p = doc.add_paragraph()
        p.add_run(lib + ' : ').bold = True
        p.add_run('…')
    consigne(doc, "Période de référence : les " + v['semestres'] + " derniers semestres, indiquée dans le courriel "
             "d'ouverture de la campagne d'évaluation. Mise en forme : Arial 10, interligne 1. Conserver l'ordre "
             "des rubriques, même si certaines restent vides. Dépôt en PDF dans l'application e-valuation. "
             "Remplacer les textes en gris par votre contenu.")

    for i, r in enumerate(RUBRIQUES, 1):
        doc.add_paragraph(f'{i}. {r["titre"]}', style='Heading 1')
        if r.get('projet') and not v['projet']:
            consigne(doc, r['sans_objet'])
            continue
        for c in r['consignes']:
            consigne(doc, remplir(c, v))
        for pu in r.get('puces', []):
            consigne(doc, remplir(pu, v), style='List Bullet')
        if 'sous' in r:
            so = r['sous']
            doc.add_paragraph(remplir(so['titre'], v), style='Heading 2')
            for c in so['consignes']:
                consigne(doc, remplir(c, v))
            for k in range(1, 3):
                p = doc.add_paragraph()
                p.add_run(f'{k}. ').bold = True
                r1 = p.add_run(so['modele'][0])
                r1.italic = True
                r1.font.color.rgb = GRIS
                consigne(doc, '    ' + so['modele'][1])

    pied = doc.sections[0].footer.paragraphs[0]
    pied.alignment = WD_ALIGN_PARAGRAPH.LEFT
    rp = pied.add_run(SOURCE)
    rp.font.size = Pt(7)
    rp.font.color.rgb = GRIS
    doc.core_properties.author = 'Section 18 CoNRS'
    doc.core_properties.title = "Rapport d'activité — " + v['titre']
    doc.save(os.path.join(SORTIE, nom + '.docx'))


# ─── LaTeX ────────────────────────────────────────────────────────────────────

def tex_esc(s):
    for a, b in (('\\', '\\textbackslash{}'), ('&', '\\&'), ('%', '\\%'), ('$', '\\$'),
                 ('#', '\\#'), ('_', '\\_'), ('{', '\\{'), ('}', '\\}')):
        s = s.replace(a, b)
    return s.replace('\\textbackslash\\{\\}', '\\textbackslash{}')


PREAMBULE = r"""%% ─────────────────────────────────────────────────────────────────────────────
%% Modèle de rapport d'activité — @TITRE@ (CNRS, Comité national)
%% @SOURCE@
%% Compiler avec pdflatex (ou Overleaf). Complétez d'abord le bloc « À COMPLÉTER ».
%% ─────────────────────────────────────────────────────────────────────────────
\documentclass[10pt,a4paper]{article}
\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}
\usepackage[french]{babel}
\frenchsetup{StandardLists=true}
\usepackage[a4paper,top=2.3cm,bottom=2.2cm,left=2.1cm,right=2.1cm,headheight=14pt]{geometry}

%% Police à empattement classique de LaTeX (Latin Modern), plus confortable à la lecture.
\usepackage{lmodern}
%% Les consignes officielles demandent « Arial 10 » : pour s'y conformer strictement,
%% remplacer la ligne ci-dessus par les deux suivantes.
%% \usepackage[scaled=0.95]{helvet}
%% \renewcommand{\familydefault}{\sfdefault}

\usepackage{microtype,xcolor,enumitem,titlesec,fancyhdr,lastpage,tabularx,comment}
\usepackage[most]{tcolorbox}
\usepackage{hyperref}

%% ═══ À COMPLÉTER ═══════════════════════════════════════════════════════════
\newcommand{\Nom}{Prénom NOM}
\newcommand{\Grade}{CRCN}
\newcommand{\Unite}{UMR 0000 --- Nom du laboratoire}
\newcommand{\SectionCN}{Section 18 --- Chimie et vivant}
\newcommand{\Periode}{semestre 20.. --- semestre 20..}

%% Consignes officielles (encadrés gris) : \consignestrue pour les afficher,
%% \consignesfalse pour les masquer une fois le rapport rédigé.
\newif\ifconsignes
\consignestrue
%% ═══════════════════════════════════════════════════════════════════════════

\definecolor{cnrs}{HTML}{22397F}
\definecolor{cnrsclair}{HTML}{EEF1FA}
\definecolor{gris}{HTML}{6B7280}
\hypersetup{colorlinks, linkcolor=cnrs, urlcolor=cnrs, pdftitle={Rapport d'activité}}

\setlength{\parindent}{0pt}
\setlength{\parskip}{0.45em}
\setlist{topsep=2pt,itemsep=1pt,leftmargin=1.3em}

%% Intertitres : numéro en pastille, filet léger dessous
\titleformat{\section}{\large\bfseries\color{cnrs}}
  {\colorbox{cnrs}{\makebox[0.9em]{\color{white}\thesection}}}{0.6em}{}
  [{\color{cnrs!25}\titlerule[0.6pt]}]
\titlespacing*{\section}{0pt}{1.5em}{0.5em}
\titleformat{\subsection}{\normalsize\bfseries\color{cnrs}}{}{0em}{}
\titlespacing*{\subsection}{0pt}{1em}{0.3em}

%% En-tête et pied de page
\pagestyle{fancy}
\fancyhf{}
\fancyhead[L]{\small\color{gris}Rapport d'activité --- \Nom}
\fancyhead[R]{\small\color{gris}@TITRE@}
\fancyfoot[C]{\small\color{gris}\thepage\,/\,\pageref{LastPage}}
\renewcommand{\headrulewidth}{0.3pt}
\renewcommand{\headrule}{{\color{gris!40}\hrule width\headwidth height\headrulewidth}}

%% Consignes : encadré gris, ou rien du tout avec \consignesfalse
\ifconsignes
  \newtcolorbox{consigne}{enhanced, breakable, sharp corners, boxrule=0pt,
    colback=gris!7, borderline west={2pt}{0pt}{cnrs!45},
    left=8pt, right=6pt, top=4pt, bottom=4pt, before skip=4pt, after skip=8pt,
    fontupper=\small\itshape\color{gris!90!black}}
\else
  \excludecomment{consigne}
\fi

%% Emplacement de votre texte
\newcommand{\arediger}{\textcolor{gris}{[À rédiger]}}

%% Production scientifique : \production{référence}{lien HAL}{portée, impact, contribution}
\newcounter{production}
\newcommand{\production}[3]{%
  \refstepcounter{production}%
  \begin{tcolorbox}[enhanced, breakable, arc=2pt, boxrule=0.4pt, colframe=cnrs!25, colback=white,
      left=7pt, right=7pt, top=4pt, bottom=5pt, before skip=4pt, after skip=6pt]
    {\bfseries\color{cnrs}\theproduction.}~#1\par
    {\small\url{#2}}\par\smallskip
    #3
  \end{tcolorbox}}

\begin{document}

%% ─── Titre ───────────────────────────────────────────────────────────────────
\begin{tcolorbox}[enhanced, sharp corners, boxrule=0pt, colback=cnrsclair,
    borderline west={4pt}{0pt}{cnrs}, left=14pt, right=10pt, top=10pt, bottom=10pt]
  {\footnotesize\color{cnrs}\MakeUppercase{Comité national de la recherche scientifique}}\par\vspace{3pt}
  {\LARGE\bfseries\color{cnrs}Rapport d'activité}\par\vspace{2pt}
  {\large @TITRE_LONG@}\par\medskip
  {\small
  \begin{tabularx}{\linewidth}{@{}>{\bfseries}l X >{\bfseries}l X@{}}
    Nom & \Nom & Grade & \Grade \\
    Unité & \Unite & Section & \SectionCN \\
    Période & \Periode & & \\
  \end{tabularx}}
\end{tcolorbox}

\begin{consigne}
@CONSIGNE_GENERALE@
\end{consigne}
"""


def latex(nom, v):
    titre_long = v['titre'][0].upper() + v['titre'][1:] + ' --- ' + v['semestres'] + ' derniers semestres'
    L = [PREAMBULE.replace('%%', '%')
         .replace('@TITRE@', v['titre'][0].upper() + v['titre'][1:])
         .replace('@TITRE_LONG@', tex_esc(titre_long).replace('---', '---'))
         .replace('@SOURCE@', SOURCE)
         .replace('@CONSIGNE_GENERALE@', tex_esc(
             "Période de référence : les " + v['semestres'] + " derniers semestres, indiquée dans le courriel "
             "d'ouverture de la campagne d'évaluation. Mise en forme : Arial 10, interligne 1. Conserver l'ordre "
             "des rubriques, même si certaines restent vides. Dépôt en PDF dans l'application e-valuation."))]

    def bloc_consigne(lignes, puces=()):
        out = ['\\begin{consigne}'] + lignes
        if puces:
            out += ['\\begin{itemize}'] + ['  \\item ' + p for p in puces] + ['\\end{itemize}']
        return out + ['\\end{consigne}']

    for r in RUBRIQUES:
        L.append('')
        L.append('%% ' + '─' * 76)
        L.append('\\section{' + tex_esc(r['titre']) + '}')
        if r.get('projet') and not v['projet']:
            L.append(tex_esc(r['sans_objet']))
            continue
        L += bloc_consigne([tex_esc(remplir(c, v)) for c in r['consignes']],
                           [tex_esc(remplir(p, v)) for p in r.get('puces', [])])
        L.append('\\arediger % Votre texte ici')
        if 'sous' in r:
            so = r['sous']
            L.append('')
            L.append('\\subsection*{' + tex_esc(remplir(so['titre'], v)) + '}')
            L += bloc_consigne([tex_esc(remplir(c, v)) for c in so['consignes']])
            L += ['\\production{Auteurs, « Titre », \\emph{Revue}, volume (année), pages.}',
                  '  {https://hal.science/hal-00000000}',
                  '  {Portée, impact et contribution personnelle.}',
                  '\\production{Auteurs, « Titre », \\emph{Revue}, volume (année), pages.}',
                  '  {https://hal.science/hal-00000001}',
                  '  {Portée, impact et contribution personnelle.}']
    L += ['', '\\end{document}', '']
    texte = '\n'.join(L).replace('%% ─', '% ─')
    with open(os.path.join(SORTIE, nom + '.tex'), 'w', encoding='utf-8') as f:
        f.write(texte)


if __name__ == '__main__':
    os.makedirs(SORTIE, exist_ok=True)
    for cle, v in VARIANTES.items():
        nom = 'Rapport_activite_' + cle
        word(nom, v)
        latex(nom, v)
        print('Écrit :', nom + '.docx', nom + '.tex')
