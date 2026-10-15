"""Branche la base Neon de Keskon mange sur le Metabase Vulgatech et crée le compte partagé de la cohorte.

Usage : python3 scripts/metabase/connect_db.py http://<dns-ec2>
À lancer une fois le compte admin créé dans l'UI Metabase. Lit DATABASE_URL dans .env.prod.
"""

import getpass
import json
import sys
import urllib.error
import urllib.request
from pathlib import Path
from urllib.parse import unquote, urlparse

ENV_PROD = Path(__file__).resolve().parents[2] / ".env.prod"
COHORT_EMAIL = "cohorte.vulgatech@theodo.com"
DB_NAME = "Keskon mange"


def call(base, method, path, body=None, session=None):
    req = urllib.request.Request(base + path, method=method, data=json.dumps(body).encode() if body else None)
    req.add_header("Content-Type", "application/json")
    if session:
        req.add_header("X-Metabase-Session", session)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read() or "null")


def neon_details():
    line = next(l for l in ENV_PROD.read_text().splitlines() if l.startswith("DATABASE_URL="))
    url = urlparse(line.split("=", 1)[1].strip().strip('"'))
    return {
        "host": url.hostname,
        "port": url.port or 5432,
        "dbname": url.path.lstrip("/"),
        "user": unquote(url.username),
        "password": unquote(url.password),
        "ssl": True,
    }


def main(base):
    base = base.rstrip("/")
    email = input("Email admin Metabase [hugo.borsoni@theodo.com] : ").strip() or "hugo.borsoni@theodo.com"
    password = getpass.getpass("Mot de passe admin (sert aussi au compte cohorte) : ")
    session = call(base, "POST", "/api/session", {"username": email, "password": password})["id"]

    databases = call(base, "GET", "/api/database", session=session)["data"]
    if not any(db["name"] == DB_NAME for db in databases):
        db = call(base, "POST", "/api/database",
                  {"engine": "postgres", "name": DB_NAME, "details": neon_details()}, session)
        print(f"Base « {DB_NAME} » branchée (id {db['id']})")

    users = call(base, "GET", "/api/user", session=session)["data"]
    if not any(u["email"] == COHORT_EMAIL for u in users):
        try:
            call(base, "POST", "/api/user", {"first_name": "Cohorte", "last_name": "Vulgatech",
                                             "email": COHORT_EMAIL, "password": password}, session)
            print(f"Compte {COHORT_EMAIL} créé")
        except urllib.error.HTTPError as err:
            print(f"Compte cohorte non créé : {err.read().decode()}")


if __name__ == "__main__":
    main(sys.argv[1])
