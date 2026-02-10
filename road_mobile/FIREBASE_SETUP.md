# Configuration Firebase pour road_mobile (Full Firebase)

## ⚠️ IMPORTANT - Règles de sécurité Firestore

Copiez ces règles dans **Firestore Database > Règles** sur la console Firebase :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ============ UTILISATEURS ============
    match /users/{userId} {
      // Lecture : tout utilisateur connecté (pour permettre la vérification des rôles)
      allow read: if request.auth != null;

      // Création : uniquement via Firebase Auth (inscription)
      allow create: if request.auth != null 
                    && request.auth.uid == userId;

      // Modification : l'utilisateur peut modifier son profil
      // OU admin/manager peut modifier tous les profils
      allow update: if request.auth != null && (
        request.auth.uid == userId ||
        isManagerOrAdmin()
      );

      // Suppression : uniquement admin/manager
      allow delete: if request.auth != null && isManagerOrAdmin();
    }

    // ============ SIGNALEMENTS ============
    match /signalements/{signalementId} {
      // Lecture : tout utilisateur connecté
      allow read: if request.auth != null;

      // Création : tout utilisateur connecté
      allow create: if request.auth != null;

      // Modification : tout utilisateur connecté (simplifié pour éviter les erreurs)
      allow update: if request.auth != null;

      // Suppression : tout utilisateur connecté
      allow delete: if request.auth != null;
    }

    // ============ CONFIGURATIONS ============
    match /configurations/{configId} {
      // Lecture : tout utilisateur connecté
      allow read: if request.auth != null;

      // Écriture : tout utilisateur connecté (simplifié)
      allow write: if request.auth != null;
    }

    // ============ FONCTIONS UTILITAIRES ============
    function isManagerOrAdmin() {
      let userDoc = get(/databases/$(database)/documents/users/$(request.auth.uid));
      return userDoc != null && userDoc.data != null && userDoc.data.role in ['MANAGER', 'ADMIN'];
    }
  }
}
```

**Pour appliquer ces règles :**
1. Allez sur https://console.firebase.google.com
2. Sélectionnez le projet **road-b9c7f**
3. Cliquez sur **Firestore Database** dans le menu
4. Cliquez sur l'onglet **Règles**
5. Remplacez tout le contenu par les règles ci-dessus
6. Cliquez sur **Publier**

---

## Si l'erreur persiste - Règles temporaires pour le développement

Si vous avez toujours l'erreur "Missing or insufficient permissions", utilisez ces règles **temporairement** pour le développement :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

⚠️ **ATTENTION** : Ces règles permettent à tout utilisateur authentifié de lire/écrire toutes les données. À utiliser uniquement en développement !

---

## Index Firestore à créer

Pour les requêtes composées, créez ces index dans **Firestore Database > Index** :

### Index 1 - Signalements par statut
- Collection: `signalements`
- Champs:
  - `statut` (Ascending)
  - `isActive` (Ascending)

### Index 2 - Signalements par créateur
- Collection: `signalements`
- Champs:
  - `createdByEmail` (Ascending)
  - `isActive` (Ascending)

---

## Collections à initialiser

### 1. Collection `configurations`

Créez le document `PRIX_PAR_M2` :
- **ID du document**: `PRIX_PAR_M2`
- **Champs**:
  - `cle`: "PRIX_PAR_M2"
  - `valeur`: "50000"
  - `description`: "Prix forfaitaire par m² en Ariary"

---

## Architecture de l'application

L'application mobile utilise maintenant **uniquement Firebase** :

| Service | Utilisation |
|---------|-------------|
| **Firebase Auth** | Authentification (login, register, logout) |
| **Firestore `users`** | Données utilisateur (nom, prénom, rôle, etc.) |
| **Firestore `signalements`** | Tous les signalements |
| **Firestore `configurations`** | Configuration (prix par m²) |

**Pas de backend Spring Boot requis !**

---

## Commandes pour démarrer

```bash
cd road_mobile
npm install
npm run dev
```

Pour tester sur mobile :
```bash
ionic cap run android
# ou
ionic cap run ios
```
