# Guide de Démarrage Rapide

## Installation et Configuration

### 1. Installer les dépendances
```bash
npm install
```

### 2. Configurer Discord OAuth

**Créer une application Discord:**
1. Visitez https://discord.com/developers/applications
2. Cliquez sur "New Application"
3. Donnez un nom à votre application (ex: "Weapon Management")
4. Allez dans l'onglet "OAuth2"
5. Copiez votre **Client ID** et votre **Client Secret**
6. Dans "Redirects", ajoutez: `http://localhost:3000/api/auth/callback/discord`

**Mettre à jour le fichier .env:**
```env
DISCORD_CLIENT_ID="votre_client_id_ici"
DISCORD_CLIENT_SECRET="votre_client_secret_ici"
```

### 3. Générer une clé secrète pour Better-auth
```bash
# Sous Linux/Mac
openssl rand -hex 32

# Ou utilisez un générateur en ligne
```

Ajoutez la clé générée dans `.env`:
```env
BETTER_AUTH_SECRET="votre_cle_secrete_generee"
```

### 4. Initialiser la base de données
```bash
npx prisma generate
npx prisma db push
```

### 5. Lancer le serveur de développement
```bash
npm run dev
```

Le site sera accessible sur http://localhost:3000

## Premier Utilisateur Admin

Par défaut, le premier utilisateur qui se connecte aura le rôle USER. Pour le promouvoir en ADMIN:

1. Connectez-vous via Discord
2. Ouvrez Prisma Studio:
```bash
npx prisma studio
```
3. Allez dans le modèle "User"
4. Trouvez votre utilisateur
5. Changez le champ `role` de `USER` à `ADMIN`
6. Sauvegardez
7. Rechargez la page web

Vous aurez maintenant accès au dashboard admin!

## Utilisation

### Utilisateur Normal

1. **Se connecter:** Cliquez sur "Sign In with Discord"
2. **Voir son profil:** Cliquez sur "Profile" dans la navbar
3. **Prendre une arme:** Glissez une arme de "Armes Disponibles" vers "Mes Armes"
4. **Rendre une arme:** Glissez une arme de "Mes Armes" vers "Armes Disponibles"

### Administrateur

1. **Dashboard:** Vue d'ensemble avec statistiques
2. **Gestion des utilisateurs:**
   - Promouvoir/Rétrograder les utilisateurs (USER ↔ ADMIN)
   - Supprimer des utilisateurs
3. **Gestion des armes:**
   - Créer de nouvelles armes
   - Voir toutes les armes et leurs statuts
   - Voir qui possède quelle arme
4. **Logs d'activité:**
   - Historique complet de toutes les actions
   - Filtrage par arme ou utilisateur

## Architecture du Projet

```
harlemboys/
├── app/                    # Pages Next.js (App Router)
│   ├── admin/             # Pages admin
│   │   ├── page.tsx       # Dashboard
│   │   ├── users/         # Gestion utilisateurs
│   │   ├── weapons/       # Gestion armes
│   │   └── logs/          # Logs d'activité
│   ├── api/               # API Routes
│   │   ├── auth/          # Better-auth
│   │   ├── weapons/       # CRUD armes
│   │   ├── users/         # CRUD utilisateurs
│   │   └── logs/          # Récupération logs
│   ├── profile/           # Page profil utilisateur
│   └── page.tsx           # Page d'accueil
├── components/            # Composants React
│   ├── navbar.tsx         # Barre de navigation
│   └── weapon-card.tsx    # Carte d'arme (drag & drop)
├── lib/                   # Bibliothèques et utilitaires
│   ├── auth.ts            # Configuration Better-auth
│   ├── auth-client.ts     # Client auth côté client
│   ├── prisma.ts          # Client Prisma
│   └── stores/            # Zustand stores
│       ├── weapon-store.ts
│       └── user-store.ts
├── prisma/
│   ├── schema.prisma      # Schéma de base de données
│   └── dev.db             # Base de données SQLite
├── .env                   # Variables d'environnement
└── README.md              # Documentation complète
```

## Technologies Utilisées

- **Next.js 15** - Framework React avec App Router
- **TypeScript** - Typage statique
- **Prisma** - ORM pour la base de données
- **SQLite** - Base de données (dev)
- **Better-auth** - Authentification avec Discord
- **Tailwind CSS** - Styles
- **Zustand** - Gestion d'état
- **DnD-Kit** - Drag and drop
- **Lucide React** - Icônes

## Commandes Utiles

```bash
# Développement
npm run dev              # Lancer en mode développement

# Production
npm run build            # Construire pour production
npm run start            # Lancer en production

# Base de données
npx prisma studio        # Interface visuelle pour la DB
npx prisma generate      # Générer le client Prisma
npx prisma db push       # Pousser le schéma vers la DB
npx prisma migrate dev   # Créer une migration

# Linting
npm run lint             # Vérifier le code
```

## Créer une Première Arme

En tant qu'admin:
1. Allez sur `/admin/weapons`
2. Cliquez sur "Nouvelle Arme"
3. Remplissez les champs:
   - **Numéro de Série:** Ex: "AR-2024-001"
   - **Nom:** Ex: "M4A1"
   - **Type:** Ex: "Fusil d'assaut"
   - **Description:** Ex: "Fusil d'assaut standard"
4. Cliquez sur "Créer"

L'arme sera maintenant disponible pour tous les utilisateurs!

## Dépannage

**Problème: "Discord OAuth Error"**
- Vérifiez que vous avez bien ajouté l'URL de redirection dans Discord
- Vérifiez que vos Client ID et Client Secret sont corrects

**Problème: "Database Error"**
- Exécutez `npx prisma db push` pour recréer la DB
- Vérifiez que le fichier `prisma/dev.db` n'est pas corrompu

**Problème: "Role non défini"**
- Par défaut, tous les nouveaux utilisateurs ont le rôle USER
- Utilisez Prisma Studio pour changer manuellement le rôle en ADMIN

## Support

Pour toute question ou problème:
1. Consultez le README.md principal
2. Vérifiez les logs dans la console
3. Ouvrez une issue sur GitHub

Bon développement! 🚀
