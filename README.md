# HomeLab Dashboard

Dashboard personnel pour organiser et gérer vos liens et bookmarks, avec authentification et stockage en base de données PostgreSQL.

## Lancer avec Docker

```bash
docker compose up -d --build
```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000).

### Configuration

Créez un fichier `.env` à la racine pour personnaliser les variables :

```env
DB_PASSWORD=mon-mot-de-passe-db
JWT_SECRET=mon-secret-jwt-aleatoire
```

Des valeurs par défaut sont utilisées si le fichier `.env` n'est pas présent.

### Architecture

| Service | Description | Port |
|---------|-------------|------|
| **frontend** | App React servie par Nginx | 3000 |
| **backend** | API Express (Node.js) | 4000 (interne) |
| **db** | PostgreSQL 16 | 5432 (interne) |

## Lancer en local (dev)

**Prérequis :** Node.js, PostgreSQL

1. Installer les dépendances :
   ```bash
   npm install
   cd server && npm install && cd ..
   ```
2. Lancer le backend :
   ```bash
   cd server && npm run dev
   ```
3. Lancer le frontend (dans un autre terminal) :
   ```bash
   npm run dev
   ```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000).
