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


def latex(nom, v):
    L = [
        "% Modèle de rapport d'activité — " + v['titre'] + ' (CNRS, Comité national).',
        '% ' + SOURCE,
        "% Remplacer les \\consigne{…} par votre texte, puis compiler avec pdflatex (ou Overleaf).",
        '\\documentclass[10pt,a4paper]{article}',
        '\\usepackage[utf8]{inputenc}',
        '\\usepackage[T1]{fontenc}',
        '\\usepackage[french]{babel}',
        '\\frenchsetup{StandardLists=true}',
        '\\usepackage[a4paper,margin=2cm]{geometry}',
        '\\usepackage{helvet}            % Arial ou équivalent, comme demandé',
        '\\renewcommand{\\familydefault}{\\sfdefault}',
        '\\usepackage{xcolor,enumitem,titlesec,hyperref}',
        '\\definecolor{cnrs}{HTML}{22397F}',
        '\\definecolor{consigne}{HTML}{6B7280}',
        '\\setlength{\\parindent}{0pt}',
        '\\setlength{\\parskip}{0.4em}',
        '\\setlist{topsep=2pt,itemsep=1pt}',
        '\\titleformat{\\section}{\\large\\bfseries\\color{cnrs}}{\\thesection.}{0.5em}{}',
        '\\titleformat{\\subsection}{\\normalsize\\bfseries\\color{cnrs}}{}{0em}{}',
        '\\newcommand{\\consigne}[1]{{\\color{consigne}\\itshape #1}}',
        '',
        '\\begin{document}',
        '',
        "{\\LARGE\\bfseries\\color{cnrs} Rapport d'activité --- " + tex_esc(v['titre']) + '}\\par\\medskip',
        '\\textbf{Nom, prénom :} …\\par',
        '\\textbf{Grade :} …\\par',
        '\\textbf{Unité (UMR) :} …\\par',
        '\\textbf{Section(s) / CID :} …\\par',
        '\\textbf{Période de référence :} …\\par\\medskip',
        "\\consigne{Période de référence : les " + v['semestres'] + " derniers semestres, indiquée dans le courriel "
        "d'ouverture de la campagne d'évaluation. Mise en forme : Arial 10, interligne 1. Conserver l'ordre des "
        "rubriques, même si certaines restent vides. Dépôt en PDF dans l'application e-valuation.}",
        '',
    ]
    for r in RUBRIQUES:
        L.append('\\section{' + tex_esc(r['titre']) + '}')
        if r.get('projet') and not v['projet']:
            L.append('\\consigne{' + tex_esc(r['sans_objet']) + '}')
            L.append('')
            continue
        for c in r['consignes']:
            L.append('\\consigne{' + tex_esc(remplir(c, v)) + '}')
        if r.get('puces'):
            L.append('\\begin{itemize}')
            L += ['  \\item \\consigne{' + tex_esc(remplir(pu, v)) + '}' for pu in r['puces']]
            L.append('\\end{itemize}')
        if 'sous' in r:
            so = r['sous']
            L.append('\\subsection*{' + tex_esc(remplir(so['titre'], v)) + '}')
            for c in so['consignes']:
                L.append('\\consigne{' + tex_esc(remplir(c, v)) + '}')
            L.append('\\begin{enumerate}')
            L += ['  \\item \\consigne{' + tex_esc(so['modele'][0]) + '}\\\\ \\consigne{' + tex_esc(so['modele'][1]) + '}'] * 2
            L.append('\\end{enumerate}')
        L.append('')
    L += ['\\end{document}', '']
    with open(os.path.join(SORTIE, nom + '.tex'), 'w', encoding='utf-8') as f:
        f.write('\n'.join(L))


if __name__ == '__main__':
    os.makedirs(SORTIE, exist_ok=True)
    for cle, v in VARIANTES.items():
        nom = 'Rapport_activite_' + cle
        word(nom, v)
        latex(nom, v)
        print('Écrit :', nom + '.docx', nom + '.tex')
