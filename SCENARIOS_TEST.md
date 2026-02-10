# 📋 Document de Scénarios - TravauxTana
## Application de Suivi des Travaux Routiers d'Antananarivo

---

# 🌐 PARTIE VISITEUR (Sans Compte)

---

## Scénario 1 : Accès à l'application et visualisation de la carte

### Étapes :
1. L'utilisateur ouvre l'application dans son navigateur
2. La page d'accueil s'affiche avec la carte centrée sur Antananarivo
3. Les marqueurs des signalements apparaissent sur la carte
4. Le panneau de statistiques s'affiche en bas à gauche

### Appels API :
```
GET /api/reports
→ Récupère tous les signalements publics
```

### Résultat attendu :
- Carte OpenStreetMap visible
- Marqueurs colorés visibles (🔴 rouge = nouveau, 🟠 orange = en cours, 🟢 vert = terminé)
- Statistiques affichées (Nb points, Surface totale, Avancement %, Budget total)

📸 **Screenshot : `screen_01_accueil_carte.png`**

---

## Scénario 2 : Consultation des détails d'un signalement (survol/clic)

### Étapes :
1. Le visiteur clique sur un marqueur rouge (nouveau) sur la carte
2. Une popup s'ouvre avec les informations détaillées
3. Les informations affichées : date, statut, type, surface, budget, entreprise, signalé par

### Appels API :
```
GET /api/reports/{id}
→ Récupère les détails d'un signalement spécifique
```

### Résultat attendu :
- Popup visible avec toutes les informations
- Badge de statut coloré
- Informations formatées (date en français, budget en Ariary)

📸 **Screenshot : `screen_02_popup_details.png`**

---

## Scénario 3 : Consultation du tableau de bord (Dashboard)

### Étapes :
1. Le visiteur clique sur l'onglet "Dashboard" dans la navigation
2. La page Dashboard s'affiche
3. Un tableau récapitulatif de tous les signalements apparaît
4. Les statistiques globales sont visibles en haut

### Appels API :
```
GET /api/reports
→ Récupère tous les signalements pour le tableau

GET /api/stats
→ Récupère les statistiques globales
```

### Résultat attendu :
- Tableau avec colonnes : ID, Adresse, Type, Statut, Surface, Budget, Entreprise, Date
- Filtres de recherche et par statut disponibles
- Statistiques en haut de page

📸 **Screenshot : `screen_03_dashboard_visiteur.png`**

---

## Scénario 4 : Filtrage des signalements dans le Dashboard

### Étapes :
1. Sur la page Dashboard, le visiteur tape "Analakely" dans le champ de recherche
2. Le tableau se filtre automatiquement
3. Le visiteur sélectionne "En cours" dans le filtre de statut
4. Le tableau affiche uniquement les signalements correspondants

### Appels API :
```
GET /api/reports?search=Analakely&status=en_cours
→ Récupère les signalements filtrés
```

### Résultat attendu :
- Tableau filtré selon les critères
- Mise à jour en temps réel

📸 **Screenshot : `screen_04_dashboard_filtre.png`**

---

# 👤 PARTIE UTILISATEUR (Connecté)

---

## Scénario 5 : Connexion utilisateur

### Étapes :
1. L'utilisateur clique sur le bouton "Connexion" en haut à droite
2. Le modal de connexion s'ouvre
3. L'utilisateur entre ses identifiants :
   - Email : `jean.rakoto@email.mg`
   - Mot de passe : `user123`
4. L'utilisateur clique sur "Se connecter"
5. Le modal se ferme, le nom de l'utilisateur s'affiche en haut

### Appels API :
```
POST /api/auth/login
Body: {
    "email": "jean.rakoto@email.mg",
    "password": "user123"
}
→ Authentification Firebase

Response: {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
        "id": "user1",
        "name": "Jean Rakoto",
        "email": "jean.rakoto@email.mg",
        "role": "utilisateur"
    }
}
```

### Résultat attendu :
- Toast de succès "Bienvenue, Jean Rakoto !"
- Menu utilisateur visible avec nom et rôle
- Bouton FAB (📍) apparaît pour signaler

📸 **Screenshot : `screen_05_modal_connexion.png`**

📸 **Screenshot : `screen_06_utilisateur_connecte.png`**

---

## Scénario 6 : Tentative de connexion avec compte bloqué

### Étapes :
1. L'utilisateur clique sur "Connexion"
2. L'utilisateur entre :
   - Email : `paul.rabe@email.mg`
   - Mot de passe : `user123`
3. L'utilisateur clique sur "Se connecter"
4. Un message d'erreur s'affiche

### Appels API :
```
POST /api/auth/login
Body: {
    "email": "paul.rabe@email.mg",
    "password": "user123"
}

Response: {
    "error": "ACCOUNT_BLOCKED",
    "message": "Votre compte est bloqué"
}
```

### Résultat attendu :
- Toast d'erreur "Votre compte est bloqué. Contactez un administrateur."
- L'utilisateur reste non connecté

📸 **Screenshot : `screen_07_compte_bloque.png`**

---

## Scénario 7 : Création d'un signalement

### Étapes :
1. L'utilisateur connecté (Jean Rakoto) est sur la carte
2. Un message indique "Cliquez sur la carte pour signaler"
3. L'utilisateur clique sur un emplacement de la carte
4. Le modal de signalement s'ouvre avec les coordonnées pré-remplies
5. L'utilisateur remplit le formulaire :
   - Type : "Nid de poule"
   - Adresse : "Rue Rainizanabololona, Antananarivo"
   - Description : "Gros nid de poule dangereux"
6. L'utilisateur clique sur "Envoyer le signalement"

### Appels API :
```
POST /api/reports
Headers: {
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIs..."
}
Body: {
    "lat": -18.8795,
    "lng": 47.5123,
    "type": "nid_poule",
    "address": "Rue Rainizanabololona, Antananarivo",
    "description": "Gros nid de poule dangereux",
    "reportedBy": "user1"
}

Response: {
    "id": 16,
    "status": "nouveau",
    "date": "2026-01-20",
    ...
}
```

### Résultat attendu :
- Toast de succès "Signalement envoyé avec succès !"
- Nouveau marqueur rouge apparaît sur la carte
- Le signalement est visible dans le Dashboard

📸 **Screenshot : `screen_08_clic_carte_signalement.png`**

📸 **Screenshot : `screen_09_formulaire_signalement.png`**

📸 **Screenshot : `screen_10_signalement_cree.png`**

---

## Scénario 8 : Filtrer mes signalements uniquement

### Étapes :
1. L'utilisateur connecté coche "Afficher mes signalements uniquement"
2. La carte se met à jour
3. Seuls les marqueurs de l'utilisateur restent visibles
4. Les statistiques se mettent à jour

### Appels API :
```
GET /api/reports?userId=user1
→ Récupère uniquement les signalements de l'utilisateur connecté
```

### Résultat attendu :
- Carte affiche uniquement les signalements de Jean Rakoto
- Statistiques recalculées pour ses signalements

📸 **Screenshot : `screen_11_filtre_mes_signalements.png`**

---

## Scénario 9 : Déconnexion

### Étapes :
1. L'utilisateur clique sur le bouton "Déconnexion" en haut à droite
2. L'utilisateur est déconnecté
3. L'interface revient en mode visiteur

### Appels API :
```
POST /api/auth/logout
Headers: {
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIs..."
}
```

### Résultat attendu :
- Toast "Vous êtes déconnecté"
- Boutons Connexion/Inscription réapparaissent
- Bouton FAB et filtres disparaissent

📸 **Screenshot : `screen_12_deconnexion.png`**

---

# 👔 PARTIE MANAGER (Administrateur)

---

## Scénario 10 : Inscription d'un compte Manager

### Étapes :
1. L'utilisateur clique sur "Inscription"
2. Le modal d'inscription s'ouvre
3. L'utilisateur remplit le formulaire :
   - Nom complet : "Nouveau Manager"
   - Email : "manager2@travauxana.mg"
   - Mot de passe : "securepass123"
   - Confirmer : "securepass123"
4. L'utilisateur clique sur "Créer le compte"

### Appels API :
```
POST /api/auth/register
Body: {
    "name": "Nouveau Manager",
    "email": "manager2@travauxana.mg",
    "password": "securepass123",
    "role": "manager"
}

→ Création du compte sur Firebase Auth

Response: {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
        "id": "manager_1737360000000",
        "name": "Nouveau Manager",
        "role": "manager"
    }
}
```

### Résultat attendu :
- Toast "Compte Manager créé avec succès !"
- Utilisateur connecté en tant que Manager
- Onglet "Gestion" visible dans la navigation

📸 **Screenshot : `screen_13_inscription_manager.png`**

---

## Scénario 11 : Connexion Manager et accès au panneau d'administration

### Étapes :
1. Le manager clique sur "Connexion"
2. Il entre ses identifiants :
   - Email : `admin@travauxana.mg`
   - Mot de passe : `admin123`
3. Il clique sur "Se connecter"
4. Il clique sur l'onglet "Gestion" dans la navigation
5. Le panneau d'administration s'affiche

### Appels API :
```
POST /api/auth/login
Body: {
    "email": "admin@travauxana.mg",
    "password": "admin123"
}

GET /api/admin/reports
→ Récupère tous les signalements avec options d'édition

GET /api/admin/users
→ Récupère tous les utilisateurs
```

### Résultat attendu :
- Page Gestion visible avec onglets "Signalements" et "Utilisateurs"
- Boutons de synchronisation et création visibles
- Tableaux d'administration chargés

📸 **Screenshot : `screen_14_connexion_manager.png`**

📸 **Screenshot : `screen_15_page_gestion.png`**

---

## Scénario 12 : Synchronisation des données

### Étapes :
1. Le manager est sur la page Gestion
2. Il clique sur le bouton "🔄 Synchroniser"
3. Un spinner de chargement apparaît
4. Un message de confirmation s'affiche

### Appels API :
```
POST /api/sync/pull
→ Récupère les nouveaux signalements depuis Firebase (mobile)

Response: {
    "newReports": 3,
    "updatedReports": 5
}

POST /api/sync/push
→ Envoie les données mises à jour vers Firebase
Body: {
    "reports": [...],
    "stats": {...}
}
```

### Résultat attendu :
- Toast "Synchronisation réussie ! 3 nouveaux signalements récupérés"
- Tableaux mis à jour si nouvelles données

📸 **Screenshot : `screen_16_synchronisation.png`**

---

## Scénario 13 : Modification d'un signalement (statut, budget, entreprise)

### Étapes :
1. Le manager est sur l'onglet "Signalements" de la page Gestion
2. Il clique sur le bouton ✏️ (éditer) d'un signalement
3. Le modal d'édition s'ouvre avec les données actuelles
4. Il modifie :
   - Statut : "Nouveau" → "En cours"
   - Surface : 120 m²
   - Budget : 18 500 000 Ar
   - Entreprise : "COLAS Madagascar"
5. Il clique sur "Enregistrer"

### Appels API :
```
PUT /api/admin/reports/2
Headers: {
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIs..."
}
Body: {
    "status": "en_cours",
    "surface": 120,
    "budget": 18500000,
    "company": "COLAS Madagascar"
}

Response: {
    "success": true,
    "report": {...updated data...}
}
```

### Résultat attendu :
- Toast "Signalement mis à jour avec succès !"
- Le marqueur change de couleur sur la carte (rouge → orange)
- Le tableau est mis à jour
- Les statistiques sont recalculées

📸 **Screenshot : `screen_17_modal_edition.png`**

📸 **Screenshot : `screen_18_signalement_modifie.png`**

---

## Scénario 14 : Gestion des utilisateurs - Voir la liste

### Étapes :
1. Le manager clique sur l'onglet "Utilisateurs" dans la page Gestion
2. La liste des utilisateurs s'affiche
3. On voit les colonnes : Nom, Email, Statut, Date création, Nb signalements, Actions

### Appels API :
```
GET /api/admin/users
Headers: {
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIs..."
}

Response: {
    "users": [
        {
            "id": "user1",
            "name": "Jean Rakoto",
            "email": "jean.rakoto@email.mg",
            "status": "actif",
            "dateCreated": "2025-10-15",
            "reportsCount": 5
        },
        ...
    ]
}
```

### Résultat attendu :
- Liste complète des utilisateurs
- Badge de statut (vert=actif, rouge=bloqué)
- Bouton d'action adapté (Bloquer/Débloquer)

📸 **Screenshot : `screen_19_liste_utilisateurs.png`**

---

## Scénario 15 : Débloquer un utilisateur

### Étapes :
1. Le manager voit l'utilisateur "Paul Rabe" avec statut "Bloqué"
2. Il clique sur le bouton "Débloquer"
3. Une confirmation s'affiche
4. L'utilisateur est débloqué

### Appels API :
```
PUT /api/admin/users/user3/unblock
Headers: {
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIs..."
}

Response: {
    "success": true,
    "user": {
        "id": "user3",
        "status": "actif"
    }
}
```

### Résultat attendu :
- Toast "Utilisateur débloqué avec succès !"
- Le badge passe de rouge à vert
- Le bouton change en "Bloquer"

📸 **Screenshot : `screen_20_debloquer_utilisateur.png`**

---

## Scénario 16 : Bloquer un utilisateur

### Étapes :
1. Le manager voit l'utilisateur "Jean Rakoto" avec statut "Actif"
2. Il clique sur le bouton "Bloquer"
3. L'utilisateur est bloqué

### Appels API :
```
PUT /api/admin/users/user1/block
Headers: {
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIs..."
}

Response: {
    "success": true,
    "user": {
        "id": "user1",
        "status": "bloque"
    }
}
```

### Résultat attendu :
- Toast "Utilisateur bloqué"
- Le badge passe de vert à rouge
- L'utilisateur ne pourra plus se connecter

📸 **Screenshot : `screen_21_bloquer_utilisateur.png`**

---

## Scénario 17 : Création d'un compte utilisateur par le Manager

### Étapes :
1. Le manager clique sur le bouton "+ Créer utilisateur"
2. Le modal de création s'ouvre
3. Le manager remplit :
   - Nom : "Andry Rasolofoniaina"
   - Email : "andry.rasolo@email.mg"
   - Mot de passe : "newuser123"
4. Le manager clique sur "Créer l'utilisateur"

### Appels API :
```
POST /api/admin/users
Headers: {
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIs..."
}
Body: {
    "name": "Andry Rasolofoniaina",
    "email": "andry.rasolo@email.mg",
    "password": "newuser123",
    "role": "utilisateur"
}

→ Création sur Firebase Auth

Response: {
    "success": true,
    "user": {
        "id": "user6",
        "name": "Andry Rasolofoniaina",
        "email": "andry.rasolo@email.mg",
        "status": "actif",
        "dateCreated": "2026-01-20"
    }
}
```

### Résultat attendu :
- Toast "Utilisateur créé avec succès !"
- Nouvel utilisateur visible dans la liste
- L'utilisateur peut maintenant se connecter

📸 **Screenshot : `screen_22_modal_creer_utilisateur.png`**

📸 **Screenshot : `screen_23_utilisateur_cree.png`**

---

# 📊 RÉCAPITULATIF DES SCREENSHOTS

| N° | Nom du fichier | Description |
|----|----------------|-------------|
| 1 | `screen_01_accueil_carte.png` | Page d'accueil avec carte et statistiques |
| 2 | `screen_02_popup_details.png` | Popup de détails d'un signalement |
| 3 | `screen_03_dashboard_visiteur.png` | Page Dashboard avec tableau |
| 4 | `screen_04_dashboard_filtre.png` | Dashboard avec filtres appliqués |
| 5 | `screen_05_modal_connexion.png` | Modal de connexion ouvert |
| 6 | `screen_06_utilisateur_connecte.png` | Interface après connexion utilisateur |
| 7 | `screen_07_compte_bloque.png` | Message d'erreur compte bloqué |
| 8 | `screen_08_clic_carte_signalement.png` | Clic sur la carte pour signaler |
| 9 | `screen_09_formulaire_signalement.png` | Modal de création signalement |
| 10 | `screen_10_signalement_cree.png` | Nouveau marqueur sur la carte |
| 11 | `screen_11_filtre_mes_signalements.png` | Carte filtrée (mes signalements) |
| 12 | `screen_12_deconnexion.png` | Interface après déconnexion |
| 13 | `screen_13_inscription_manager.png` | Modal d'inscription manager |
| 14 | `screen_14_connexion_manager.png` | Connexion avec compte manager |
| 15 | `screen_15_page_gestion.png` | Page d'administration manager |
| 16 | `screen_16_synchronisation.png` | Bouton sync avec message succès |
| 17 | `screen_17_modal_edition.png` | Modal d'édition signalement |
| 18 | `screen_18_signalement_modifie.png` | Signalement après modification |
| 19 | `screen_19_liste_utilisateurs.png` | Onglet utilisateurs |
| 20 | `screen_20_debloquer_utilisateur.png` | Action débloquer utilisateur |
| 21 | `screen_21_bloquer_utilisateur.png` | Action bloquer utilisateur |
| 22 | `screen_22_modal_creer_utilisateur.png` | Modal création utilisateur |
| 23 | `screen_23_utilisateur_cree.png` | Nouvel utilisateur dans la liste |

---

# 🔑 IDENTIFIANTS DE TEST

## Manager
- **Email:** `admin@travauxana.mg`
- **Mot de passe:** `admin123`

## Utilisateurs
| Nom | Email | Mot de passe | Statut |
|-----|-------|--------------|--------|
| Jean Rakoto | `jean.rakoto@email.mg` | `user123` | ✅ Actif |
| Marie Andria | `marie.andria@email.mg` | `user123` | ✅ Actif |
| Hery Razafindrakoto | `hery.razaf@email.mg` | `user123` | ✅ Actif |
| Paul Rabe | `paul.rabe@email.mg` | `user123` | 🚫 Bloqué |
| Nirina Rasoamanana | `nirina.rasoa@email.mg` | `user123` | 🚫 Bloqué |

---

**Document généré le 20 Janvier 2026**
**Application TravauxTana v1.0**

