# Guide de Vérification Pusher WebSocket

Ce guide explique comment vérifier que le socket Pusher fonctionne correctement.

## 1. Vérification dans la Console du Navigateur

### Ouvrir la Console
1. Ouvre ton application dans le navigateur
2. Appuie sur `F12` ou `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
3. Va dans l'onglet **Console**

### Logs à Vérifier

Tu devrais voir les logs suivants en vert :

```
[Pusher Client] Initializing with cluster: eu
[Pusher] 🔄 Connexion en cours...
[Pusher] ✅ Connecté avec succès! Socket ID: 123456.789012
[Pusher] 📡 Souscription au canal: weapons
[Pusher] ✅ Souscription réussie: weapons
```

### Signification des Logs

- ✅ **Connecté avec succès** = Le socket est bien connecté à Pusher
- 📡 **Souscription au canal** = L'app s'abonne aux événements
- ✅ **Souscription réussie** = Le canal est actif

### Si tu vois des erreurs

❌ **Connexion échouée** = Problème de credentials Pusher
⚠️ **Connexion non disponible** = Problème réseau ou configuration

## 2. Indicateur Visuel de Statut

En bas à droite de la page `/profile`, tu verras un petit badge :

```
┌─────────────────┐
│ ● Pusher       │
│   Connecté     │
│   Socket: 12...│
└─────────────────┘
```

### États Possibles

- 🟢 **Connecté** (vert) = Tout fonctionne
- 🟡 **Connexion...** (jaune, clignotant) = En cours de connexion
- 🔴 **Échec** (rouge) = Problème de connexion
- ⚪ **Déconnecté** (gris) = Non connecté

## 3. Test Temps Réel avec Deux Onglets

### Étapes

1. **Ouvre deux onglets** du navigateur sur `/profile`
2. **Connecte-toi** avec le même compte dans les deux onglets
3. Dans le **premier onglet** :
   - Glisse une arme de "Armes Disponibles" vers "Mes Armes"
4. Dans le **second onglet** :
   - L'arme devrait **disparaître automatiquement** des "Armes Disponibles"
   - **SANS refresh manuel** !

### Logs dans la Console

Quand tu fais une action, tu devrais voir :

**Onglet 1 (qui fait l'action)** :
```
[Pusher] 🔫 Weapon created: {id: "..."}
```

**Onglet 2 (qui reçoit l'événement)** :
```
[Pusher] 🔫 Weapon created: {id: "..."}
```

Les deux onglets reçoivent l'événement = ✅ Pusher fonctionne !

## 4. Vérification dans l'Onglet Network

### Chrome DevTools

1. Ouvre DevTools (`F12`)
2. Va dans l'onglet **Network**
3. Filtre par **WS** (WebSocket)
4. Recharge la page

Tu devrais voir une connexion WebSocket active :

```
ws://ws-eu.pusher.com/...
Status: 101 Switching Protocols
```

### Messages WebSocket

Clique sur la connexion WebSocket → onglet **Messages**

Tu verras :
- `pusher:connection_established` = ✅ Connexion OK
- `pusher_internal:subscription_succeeded` = ✅ Souscription OK
- `weapon-created`, `weapon-updated`, etc. = ✅ Événements reçus

## 5. Dashboard Pusher (Optionnel)

### Accès

1. Va sur https://dashboard.pusher.com/
2. Connecte-toi avec ton compte
3. Sélectionne ton app (ID: 2065497)
4. Va dans **Debug Console**

### Monitoring en Direct

Tu verras :
- **Connections** : Nombre de clients connectés
- **Messages** : Événements envoyés en temps réel
- **Channels** : Canaux actifs (weapons, weapon-types, users)

### Test Manuel

Tu peux envoyer un événement de test :
1. Channel: `weapons`
2. Event: `weapon-created`
3. Data: `{"id": "test"}`
4. Envoie → Tu devrais voir le log dans ta console navigateur !

## 6. Vérification Complète - Checklist

✅ Checklist de vérification :

- [ ] Console affiche "✅ Connecté avec succès!"
- [ ] Console affiche "✅ Souscription réussie: weapons"
- [ ] Badge en bas à droite affiche "Connecté" (vert)
- [ ] Network tab montre une connexion WebSocket active
- [ ] Deux onglets synchronisés en temps réel
- [ ] Aucune requête vers `/api/data-status` (polling désactivé)
- [ ] Dashboard Pusher affiche 1+ connexions actives

## 7. Troubleshooting

### Problème : Pas de connexion

**Solution** : Vérifie le `.env`
```env
PUSHER_APP_ID="2065497"
PUSHER_KEY="0abc70356d2982e05515"
PUSHER_SECRET="b94d44c5cd0838c79060"
PUSHER_CLUSTER="eu"
NEXT_PUBLIC_PUSHER_KEY="0abc70356d2982e05515"
NEXT_PUBLIC_PUSHER_CLUSTER="eu"
```

⚠️ Les variables `NEXT_PUBLIC_*` DOIVENT être présentes !

### Problème : Connexion OK mais pas d'événements

**Solution** : Vérifie que les API routes envoient bien les événements

Dans `app/api/weapons/route.ts`, tu dois avoir :
```typescript
import { triggerWeaponUpdate } from '@/lib/pusher-server';

// Après création d'arme :
await triggerWeaponUpdate('WEAPON_CREATED', { id: weapon.id });
```

### Problème : "Pusher Client Not configured"

**Solution** : Rebuild l'app après modification du `.env`
```bash
# Arrête le serveur (Ctrl+C)
npm run dev
```

## 8. Comparaison Avant/Après

### ❌ AVANT (Polling)
- ~146,000 requêtes en 3h
- Requête DB toutes les 15 secondes
- Latence de 0-15 secondes

### ✅ APRÈS (Pusher)
- ~50 requêtes en 3h (99% de réduction !)
- 0 polling DB
- Latence < 100ms (quasi-instantané)

## Résumé

Pour vérifier rapidement que tout fonctionne :

1. **Console** → Cherche "✅ Connecté avec succès!"
2. **Badge visuel** → Doit être vert "Connecté"
3. **Test 2 onglets** → Changements synchronisés instantanément

Si ces 3 points sont OK, Pusher fonctionne parfaitement ! 🎉
