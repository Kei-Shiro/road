# CONFORMITÉ AU CAHIER DES CHARGES - Projet Road

**Date de vérification:** 10 février 2026

## Résumé de Conformité

| Module | Conformité | Détails |
|--------|------------|---------|
| Authentification | ✅ 100% | Toutes les fonctionnalités implémentées |
| Cartes | ✅ 100% | Tileserver offline configuré |
| Web (Visiteurs) | ✅ 100% | Carte, survol avec infos + photos, récapitulatif |
| Web (Manager) | ✅ 100% | Gestion utilisateurs, signalements, déblocage, stats |
| Mobile | ✅ 100% | Login, signalements, photos, filtres, notifications |

**TOTAL: 100% CONFORME AU CAHIER DES CHARGES**

---

## Détail par Module

### Module Authentification (Java API) ✅

| Exigence | État | Implémentation |
|----------|------|----------------|
| Base locale PostgreSQL dans Docker | ✅ | `docker-compose.yml` - service postgres |
| Authentification (email/pwd) | ✅ | `AuthController.login()` |
| Inscription | ✅ | `AuthController.register()` |
| Modification infos users | ✅ | `AuthController.updateProfile()` |
| Durée de vie des sessions | ✅ | `app.jwt.expiration-ms` dans application.properties |
| Limite tentatives (paramétrable, défaut 3) | ✅ | `app.session.max-attempts=3` |
| API REST réinitialiser blocage | ✅ | `POST /api/auth/unlock/{email}` et `/api/auth/admin/unlock/{userId}` |
| Documentation API Swagger | ✅ | `/swagger-ui.html` avec annotations OpenAPI |

### Module Cartes ✅

| Exigence | État | Implémentation |
|----------|------|----------------|
| Serveur carte offline Docker | ✅ | `tileserver-gl` dans docker-compose.yml (port 8081) |
| Télécharger Antananarivo | ✅ | Instructions dans `tiles/README.md` |
| Leaflet pour carte | ✅ | `MapView.jsx` et `MapPage.vue` |

### Module Web (Visiteurs) ✅

| Exigence | État | Implémentation |
|----------|------|----------------|
| Voir points sur carte | ✅ | `MapView.jsx` avec Leaflet markers |
| Survol = infos (date, statut, surface, budget, entreprise) | ✅ | Popup dans `MapView.jsx` |
| Lien vers photos | ✅ | Ajouté dans popup avec CSS `.popup-photo-link` |
| Tableau récapitulatif | ✅ | `StatsPanel.jsx` (Nb points, surface, avancement%, budget) |

### Module Web (Manager) ✅

| Exigence | État | Implémentation |
|----------|------|----------------|
| Création compte utilisateur | ✅ | `AdminPanel.jsx` - `handleCreateUser()` |
| Bouton synchronisation Firebase | ⛔ | Ignoré selon consigne |
| Page débloquer utilisateurs | ✅ | `AdminPanel.jsx` - `handleUnlockUser()` |
| Gestion infos signalement | ✅ | Modal d'édition avec surface, niveau, entreprise |
| Modifier statuts | ✅ | Select statut dans modal d'édition |
| Avancement: 0%/50%/100% | ✅ | `SignalementService.calculerPourcentageParStatut()` |
| Dates par étape | ✅ | `dateNouveau`, `dateEnCours`, `dateTermine` dans entité |
| Tableau délai traitement moyen | ✅ | `TraitementStats.jsx` avec temps moyens calculés |
| Catégoriser réparations niveau 1-10 | ✅ | Champ `niveau` dans entité Signalement |
| Prix par m² forfaitaire configurable | ✅ | Tab Configuration dans AdminPanel, entité `Configuration` |
| Budget calculé automatiquement | ✅ | `prix_par_m2 * niveau * surface_m2` dans SignalementService |

### Module Web (Visiteurs) ✅

| Exigence | État | Implémentation |
|----------|------|----------------|
| Survol point = infos (date, statut, surface, budget, entreprise, niveau) | ✅ | Popup dans `MapView.jsx` avec niveau affiché |
| Lien vers photos | ✅ | Ajouté dans popup avec CSS `.popup-photo-link` |

### Module Mobile ✅

| Exigence | État | Implémentation |
|----------|------|----------------|
| Login (inscription via Manager) | ✅ | `LoginPage.vue` avec message explicatif |
| Signaler problèmes routiers | ✅ | `CreateSignalementPage.vue` |
| Localisation | ✅ | `locationService.js` avec Geolocation |
| Ajouter photos (1 ou plusieurs) | ✅ | `cameraService.js` + jusqu'à 5 photos |
| Afficher carte et récap | ✅ | `MapPage.vue` et `StatsPage.vue` |
| Filtre: mes signalements | ✅ | `filterMyOnly` dans `signalementStore.js` |
| Notification changement statut | ✅ | `notificationService.js` + polling dans store |

---

## Fichiers Clés

### Backend (Java Spring Boot)
- `road_back/src/main/java/com/road/project/road_back/auth/controller/AuthController.java`
- `road_back/src/main/java/com/road/project/road_back/auth/service/AuthService.java`
- `road_back/src/main/java/com/road/project/road_back/signalement/service/SignalementService.java`
- `road_back/src/main/java/com/road/project/road_back/signalement/entity/Configuration.java` (Prix par m²)
- `road_back/src/main/java/com/road/project/road_back/signalement/repository/ConfigurationRepository.java`
- `road_back/src/main/resources/application.properties`

### Frontend Web (React)
- `road_front/src/components/Map/MapView.jsx` (Affichage niveau dans popup)
- `road_front/src/components/Admin/AdminPanel.jsx` (Gestion niveau + Configuration prix/m²)
- `road_front/src/components/Stats/StatsPanel.jsx`
- `road_front/src/components/Stats/TraitementStats.jsx`
- `road_front/src/services/signalementService.js` (API prix/m²)

### Mobile (Vue.js/Ionic/Capacitor)
- `road_mobile/src/views/CreateSignalementPage.vue`
- `road_mobile/src/views/LoginPage.vue`
- `road_mobile/src/stores/signalementStore.js`
- `road_mobile/src/services/notificationService.js`

### Docker
- `docker-compose.yml` (PostgreSQL, Backend, Frontend, Tileserver)
- `tiles/README.md` (Instructions téléchargement Antananarivo)

---

## Comptes par Défaut

| Email | Mot de passe | Rôle |
|-------|--------------|------|
| manager@road.mg | manager123 | MANAGER |
| user@road.mg | user123 | UTILISATEUR |

---

## URLs des Services

| Service | URL | Description |
|---------|-----|-------------|
| Backend API | http://localhost:8080 | API REST Java |
| Swagger UI | http://localhost:8080/swagger-ui.html | Documentation API |
| Frontend Web | http://localhost:5173 | Application React |
| Tileserver | http://localhost:8081 | Serveur tuiles offline |
| PostgreSQL | localhost:5432 | Base de données |

---

## Démarrage

```bash
# Démarrer tous les services
docker-compose up -d

# Vérifier les services
docker-compose ps

# Logs
docker-compose logs -f backend
```

## Notes Importantes

1. **Firebase**: La synchronisation Firebase est ignorée selon les consignes ("à ignorer").

2. **Tuiles Offline**: Le fichier `antananarivo.mbtiles` doit être téléchargé manuellement selon les instructions dans `tiles/README.md`.

3. **Notifications Mobile**: Les notifications sont envoyées via un système de polling (toutes les 30 secondes) qui vérifie les changements de statut des signalements de l'utilisateur.

4. **Photos**: L'upload de photos supporte jusqu'à 5 images par signalement.

