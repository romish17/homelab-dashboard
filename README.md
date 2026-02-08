# HomeLab Dashboard

Dashboard personnel pour organiser et gérer vos liens et bookmarks, avec authentification et stockage en base de données PostgreSQL.

## Lancer avec Docker

1. Copier le fichier d'environnement et l'adapter :
   ```bash
   cp .env.example .env
   ```
2. Lancer les services :
   ```bash
   docker compose up -d --build
   ```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000).

### Variables d'environnement

| Variable | Description | Valeur par défaut |
|----------|-------------|-------------------|
| `DB_PASSWORD` | Mot de passe PostgreSQL | `changeme` |
| `JWT_SECRET` | Clé secrète pour les tokens JWT | `change-this-secret` |

### Architecture

| Service | Description | Port |
|---------|-------------|------|
| **frontend** | App React servie par Nginx | 3000 |
| **backend** | API Express (Node.js) | 4000 (interne) |
| **db** | PostgreSQL 16 | 5432 (interne) |

## Lancer en local (dev)

**Prérequis :** Node.js, PostgreSQL

1. Copier le fichier d'environnement :
   ```bash
   cp .env.example .env
   ```
2. Installer les dépendances :
   ```bash
   npm install
   cd server && npm install && cd ..
   ```
3. Lancer le backend :
   ```bash
   cd server && npm run dev
   ```
4. Lancer le frontend (dans un autre terminal) :
   ```bash
   npm run dev
   ```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000).
