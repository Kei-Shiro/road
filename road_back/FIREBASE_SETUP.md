# Configuration Firebase pour le projet Road

## Collections Firestore à créer

Vous devez créer les collections suivantes dans votre base Firestore :

---

### 1. Collection `users`

**Structure d'un document utilisateur :**

| Champ | Type | Description |
|-------|------|-------------|
| `email` | string | Email de l'utilisateur |
| `nom` | string | Nom de famille |
| `prenom` | string | Prénom |
| `telephone` | string | Numéro de téléphone |
| `role` | string | Rôle: `VISITEUR`, `UTILISATEUR`, `ADMIN`, `MANAGER` |
| `isActive` | boolean | Compte actif (true/false) |
| `isLocked` | boolean | Compte verrouillé (true/false) |
| `isOnline` | boolean | Utilisateur en ligne (true/false) |
| `loginAttempts` | number | Nombre de tentatives de connexion échouées |
| `createdAt` | timestamp | Date de création |
| `updatedAt` | timestamp | Date de dernière mise à jour |
| `lastLogin` | timestamp | Date de dernière connexion |
| `lockedAt` | timestamp | Date de verrouillage (optionnel) |

**Note importante :** Le mot de passe n'est PAS stocké dans Firestore, il est géré par Firebase Authentication.

**ID du document :** Utiliser l'UID de Firebase Authentication comme ID du document.

---

### 2. Collection `signalements`

**Structure d'un document signalement :**

| Champ | Type | Description |
|-------|------|-------------|
| `syncId` | string | UUID pour synchronisation (= ID du document) |
| `titre` | string | Titre du signalement |
| `description` | string | Description détaillée |
| `latitude` | number | Latitude (coordonnée GPS) |
| `longitude` | number | Longitude (coordonnée GPS) |
| `adresse` | string | Adresse textuelle |
| `statut` | string | Statut: `NOUVEAU`, `EN_COURS`, `TERMINE` |
| `surfaceImpactee` | number | Surface en m² |
| `niveau` | number | Niveau de réparation (1 à 10) |
| `budget` | number | Budget en Ariary |
| `entrepriseResponsable` | string | Nom de l'entreprise |
| `dateDebut` | string | Date de début (format: YYYY-MM-DD) |
| `dateFinPrevue` | string | Date de fin prévue (format: YYYY-MM-DD) |
| `dateFinReelle` | string | Date de fin réelle (format: YYYY-MM-DD) |
| `dateNouveau` | timestamp | Date passage statut NOUVEAU |
| `dateEnCours` | timestamp | Date passage statut EN_COURS |
| `dateTermine` | timestamp | Date passage statut TERMINE |
| `pourcentageAvancement` | number | Pourcentage: 0 (NOUVEAU), 50 (EN_COURS), 100 (TERMINE) |
| `priorite` | string | Priorité: `BASSE`, `MOYENNE`, `HAUTE`, `URGENTE` |
| `type` | string | Type: `REPARATION`, `CONSTRUCTION`, `ENTRETIEN`, `EXTENSION` |
| `photoUrl` | string | URL de la photo |
| `isActive` | boolean | Signalement actif (true/false) |
| `isSynced` | boolean | Synchronisé (true/false) |
| `createdByEmail` | string | Email du créateur |
| `createdById` | number | ID local du créateur |
| `updatedByEmail` | string | Email du modificateur |
| `updatedById` | number | ID local du modificateur |
| `createdAt` | timestamp | Date de création |
| `updatedAt` | timestamp | Date de dernière mise à jour |

**ID du document :** Utiliser le `syncId` (UUID) comme ID du document.

---

### 3. Collection `configurations`

**Structure d'un document configuration :**

| Champ | Type | Description |
|-------|------|-------------|
| `cle` | string | Clé unique de configuration |
| `valeur` | string | Valeur de la configuration |
| `description` | string | Description de la configuration |
| `updatedAt` | timestamp | Date de dernière mise à jour |

**ID du document :** Utiliser la `cle` comme ID du document.

**Configuration par défaut à créer :**

| Clé | Valeur | Description |
|-----|--------|-------------|
| `PRIX_PAR_M2` | `50000` | Prix forfaitaire par m² en Ariary |

---

## Firebase Authentication

### Configuration requise :

1. Activer la méthode de connexion **Email/Password**
2. (Optionnel) Activer la connexion **Anonyme**

### Utilisateurs à créer dans Firebase Auth :

Pour chaque utilisateur existant dans votre base locale, créez-le dans Firebase Authentication avec le même email et mot de passe.

Exemple pour `test@test.com` :
- Email: `test@test.com`
- Password: (le mot de passe utilisé localement)

---

## Règles de sécurité Firestore (optionnel)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users - lecture/écriture pour utilisateurs authentifiés
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Signalements - lecture publique, écriture pour authentifiés
    match /signalements/{signalementId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Configurations - lecture publique, écriture pour admins
    match /configurations/{configId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

---

## Résumé du fonctionnement

| Opération | Online (Firebase) | Offline (Local) |
|-----------|-------------------|-----------------|
| **Inscription** | Crée dans Firebase Auth + Firestore + Local | Crée uniquement en Local |
| **Connexion** | Vérifie dans Firebase Auth, sync données | Authentification locale |
| **Modification profil** | Met à jour Firebase Auth + Firestore + Local | Met à jour uniquement Local |
| **CRUD Signalements** | Firebase + Local | Local uniquement |
| **CRUD Configurations** | Firebase + Local | Local uniquement |
| **Lecture données** | Priorité Firebase, fallback Local | Local uniquement |

