# Weapon Management System

Système de gestion d'armes avec authentification Discord, drag-and-drop et dashboard admin.

## Fonctionnalités

- **Authentification Discord** via Better-auth
- **Gestion d'armes** avec système de drag-and-drop
- **Dashboard Admin** complet
- **Logs d'activité** pour tracer toutes les actions
- **Rôles utilisateurs** (USER/ADMIN)
- **Base de données SQLite** avec Prisma

## Technologies

- **Next.js 15** (App Router)
- **TypeScript**
- **Prisma** (SQLite)
- **Better-auth** (Discord OAuth)
- **Tailwind CSS**
- **Zustand** (State Management)
- **DnD-Kit** (Drag and Drop)
- **Lucide React** (Icons)

## Installation

1. Cloner le repository
```bash
git clone <your-repo-url>
cd harlemboys
```

2. Installer les dépendances
```bash
npm install
```

3. Configurer les variables d'environnement

Copier `.env.example` vers `.env`:
```bash
cp .env.example .env
```

4. Configurer Discord OAuth

- Aller sur https://discord.com/developers/applications
- Créer une nouvelle application
- Aller dans "OAuth2" > "General"
- Copier le Client ID et Client Secret
- Ajouter l'URL de redirection: `http://localhost:3000/api/auth/callback/discord`
- Mettre à jour `.env` avec vos credentials

5. Initialiser la base de données
```bash
npx prisma generate
npx prisma db push
```

6. Lancer le serveur de développement
```bash
npm run dev
```

## Configuration Discord OAuth

1. **Créer une application Discord:**
   - Visitez https://discord.com/developers/applications
   - Cliquez sur "New Application"
   - Donnez un nom à votre application

2. **Configurer OAuth2:**
   - Allez dans "OAuth2" dans le menu de gauche
   - Copiez le "CLIENT ID" et le "CLIENT SECRET"
   - Dans "Redirects", ajoutez: `http://localhost:3000/api/auth/callback/discord`

3. **Mettre à jour .env:**
```env
DISCORD_CLIENT_ID="votre_client_id"
DISCORD_CLIENT_SECRET="votre_client_secret"
```

## Utilisation

### Utilisateur Normal

1. **Connexion:** Cliquez sur "Sign In with Discord" dans la navbar
2. **Profile:** Accédez à votre profil via le menu
3. **Gérer les armes:**
   - Glissez une arme disponible vers "Mes Armes" pour la prendre
   - Glissez une arme de "Mes Armes" vers "Armes Disponibles" pour la rendre

### Administrateur

Pour devenir admin, vous devez modifier manuellement la base de données:

```bash
npx prisma studio
```

Puis changez le champ `role` de votre utilisateur à `ADMIN`.

L'admin a accès à:
- **Dashboard:** Vue d'ensemble des statistiques
- **Gestion des utilisateurs:** Modifier les rôles, supprimer des utilisateurs
- **Gestion des armes:** Créer, voir toutes les armes
- **Logs:** Historique complet de toutes les actions

## Structure du Projet

```
harlemboys/
├── app/
│   ├── admin/          # Pages admin
│   ├── api/            # API routes
│   ├── profile/        # Page profil utilisateur
│   ├── layout.tsx
│   └── page.tsx
├── components/         # Composants React
├── lib/
│   ├── stores/        # Zustand stores
│   ├── auth.ts        # Configuration Better-auth
│   ├── auth-client.ts # Client auth
│   └── prisma.ts      # Client Prisma
├── prisma/
│   └── schema.prisma  # Schéma de base de données
└── .env               # Variables d'environnement
```

## Schéma de Base de Données

### User
- id, email, name, image
- role (USER/ADMIN)
- discordId
- Relations: weapons, weaponLogs

### Weapon
- id, serialNumber, name, type
- description, status
- assignedToId
- Relations: assignedTo, logs

### WeaponLog
- id, weaponId, userId
- action (ASSIGNED, RETURNED, etc.)
- timestamp, notes
- Relations: weapon, user

## Scripts Disponibles

```bash
npm run dev          # Lancer en mode développement
npm run build        # Build pour production
npm run start        # Lancer en production
npm run lint         # Linter le code
npx prisma studio    # Ouvrir l'interface Prisma
npx prisma generate  # Générer le client Prisma
npx prisma db push   # Pousser le schéma vers la DB
```

## Sécurité

- Les routes admin sont protégées côté serveur et client
- Better-auth gère l'authentification de manière sécurisée
- Les tokens Discord ne sont jamais exposés côté client
- SQLite est utilisé pour le développement (utilisez PostgreSQL en production)

## Production

Pour la production, il est recommandé de:
1. Utiliser PostgreSQL au lieu de SQLite
2. Configurer les variables d'environnement de production
3. Mettre à jour l'URL de redirection Discord
4. Utiliser une clé secrète forte pour BETTER_AUTH_SECRET

## Licence

ISC
