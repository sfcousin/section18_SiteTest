#!/usr/bin/env python3
"""
Chiffre le contenu de l'espace membres.

  Source (jamais publiée) : prive/espace-membres.md
  Résultat (publié)       : data/espace-membres.enc.json

Usage : python3 outils/chiffrer_espace_membres.py
Le mot de passe est demandé au clavier ; il n'est enregistré nulle part.
Chiffrement : AES-256-GCM, clé dérivée par PBKDF2-SHA256 (600 000 itérations).
"""
import base64
import getpass
import json
import os
import sys

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE = os.path.join(RACINE, 'prive', 'espace-membres.md')
SORTIE = os.path.join(RACINE, 'data', 'espace-membres.enc.json')
ITERATIONS = 600_000


def b64(b):
    return base64.b64encode(b).decode('ascii')


def main():
    if not os.path.exists(SOURCE):
        sys.exit(f'Fichier introuvable : {SOURCE}')
    texte = open(SOURCE, encoding='utf-8').read()

    mdp = getpass.getpass('Mot de passe de l\'espace membres : ')
    if len(mdp) < 12:
        sys.exit('Mot de passe trop court (12 caractères minimum).')
    if getpass.getpass('Confirmer le mot de passe : ') != mdp:
        sys.exit('Les deux mots de passe ne correspondent pas.')

    sel = os.urandom(16)
    iv = os.urandom(12)
    cle = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=sel,
                     iterations=ITERATIONS).derive(mdp.encode('utf-8'))
    chiffre = AESGCM(cle).encrypt(iv, texte.encode('utf-8'), None)

    with open(SORTIE, 'w', encoding='utf-8') as f:
        json.dump({'v': 1, 'iterations': ITERATIONS, 'sel': b64(sel),
                   'iv': b64(iv), 'contenu': b64(chiffre)}, f, indent=2)
        f.write('\n')
    print(f'Contenu chiffré écrit dans {os.path.relpath(SORTIE, RACINE)}.')
    print('Il reste à l\'envoyer sur GitHub (commit + push).')


if __name__ == '__main__':
    main()
