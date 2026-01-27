# TravauxTana - Application de suivi des travaux routiers

Application web full-stack pour le suivi et la gestion des travaux routiers à Antananarivo.

## 🚀 Technologies

### Frontend
- **React 19** - Framework JavaScript
- **Vite** - Build tool
- **Leaflet & React-Leaflet** - Cartographie interactive
- **Axios** - Requêtes HTTP
- **Font Awesome** - Icônes

### Backend
- **Spring Boot** - Framework Java
- **PostgreSQL** - Base de données
- **Spring Security + JWT** - Authentification
- **Swagger/OpenAPI** - Documentation API

## 📦 Installation

### Prérequis
- Node.js 18+ et npm
- Java 17+
- PostgreSQL 14+

### Backend (Spring Boot)

1. Créer la base de données PostgreSQL :
```sql
CREATE DATABASE road_db;
```

2. Configurer `application.properties` si nécessaire :
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/road_db
spring.datasource.username=postgres
spring.datasource.password=votre_mot_de_passe
```

3. Démarrer le backend :
```bash
cd road_back
mvnw spring-boot:run
```

Le backend sera accessible sur `http://localhost:8080`
Documentation API : `http://localhost:8080/swagger-ui.html`

### Frontend (React)

1. Installer les dépendances :
```bash
cd road_front
npm install
```

2. Démarrer le serveur de développement :
```bash
npm run dev
```

Le frontend sera accessible sur `http://localhost:5173`

## 🎯 Fonctionnalités

### Pour tous les utilisateurs
- ✅ Visualisation de la carte interactive des signalements
- ✅ Filtrage par statut (Nouveau, En cours, Terminé)
- ✅ Statistiques en temps réel
- ✅ Tableau de bord avec liste des signalements

### Pour les utilisateurs authentifiés
- ✅ Création de signalements en cliquant sur la carte
- ✅ Suivi de ses propres signalements
- ✅ Mise à jour du profil

### Pour les administrateurs
- ✅ Gestion complète des signalements
- ✅ Attribution des entreprises et budgets
- ✅ Modification des statuts
- ✅ Gestion des utilisateurs

## 📱 Structure du projet

```
road/
├── road_back/          # Backend Spring Boot
│   ├── src/main/java/
│   │   └── com/road/project/road_back/
│   │       ├── auth/           # Authentification
│   │       ├── config/         # Configuration
│   │       ├── map/            # Carte
│   │       └── signalement/    # Signalements
│   └── src/main/resources/
│       └── application.properties
│
└── road_front/         # Frontend React
    ├── src/
    │   ├── components/     # Composants React
    │   │   ├── Auth/       # Authentification
    │   │   ├── Dashboard/  # Tableau de bord
    │   │   ├── Header/     # En-tête
    │   │   ├── Map/        # Carte
    │   │   ├── Signalement/# Signalements
    │   │   ├── Stats/      # Statistiques
    │   │   └── Toast/      # Notifications
    │   ├── context/        # Context API
    │   ├── services/       # Services API
    │   ├── utils/          # Utilitaires
    │   ├── App.jsx         # Composant principal
    │   └── main.jsx        # Point d'entrée
    └── package.json
```

## 🔑 Endpoints API principaux

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `POST /api/auth/logout` - Déconnexion
- `GET /api/auth/profile` - Profil utilisateur

### Signalements
- `GET /api/signalements` - Liste des signalements (paginée)
- `GET /api/signalements/{id}` - Détails d'un signalement
- `GET /api/signalements/statut/{statut}` - Filtrer par statut
- `GET /api/signalements/bounds` - Signalements dans une zone
- `POST /api/signalements` - Créer un signalement
- `PUT /api/signalements/{id}` - Modifier un signalement
- `DELETE /api/signalements/{id}` - Supprimer un signalement
- `GET /api/signalements/stats` - Statistiques

## 🎨 Composants React

### Composants principaux
- **Header** - Navigation et authentification
- **MapView** - Carte interactive avec Leaflet
- **Dashboard** - Tableau de bord avec statistiques
- **StatsPanel** - Panneau de statistiques
- **MapLegend** - Légende de la carte

### Composants modaux
- **LoginModal** - Connexion
- **RegisterModal** - Inscription
- **SignalementModal** - Création de signalement

### Composants utilitaires
- **Toast** - Notifications
- **AuthContext** - Gestion de l'authentification

## 🔐 Authentification

L'application utilise JWT (JSON Web Tokens) pour l'authentification :
- Les tokens sont stockés dans le localStorage
- Durée de vie : 24h
- Refresh token : 7 jours
- Les requêtes API incluent automatiquement le token

## 🗺️ Carte interactive

La carte utilise Leaflet et affiche :
- Marqueurs colorés selon le statut
- Popups avec détails des signalements
- Possibilité de cliquer pour créer un signalement
- Zoom et navigation

## 📊 Données

### Types de statut
- `NOUVEAU` - Signalement récent
- `EN_COURS` - Travaux en cours
- `TERMINE` - Travaux terminés
- `ANNULE` - Signalement annulé

### Priorités
- `BASSE` - Faible priorité
- `MOYENNE` - Priorité moyenne
- `HAUTE` - Haute priorité
- `URGENTE` - Urgence

### Types de travaux
- `REPARATION` - Réparation
- `CONSTRUCTION` - Construction
- `ENTRETIEN` - Entretien
- `EXTENSION` - Extension

## 🛠️ Développement

### Build de production

Frontend :
```bash
cd road_front
npm run build
```

Backend :
```bash
cd road_back
mvnw clean package
```

### Variables d'environnement

Backend (`application.properties`) :
- `spring.datasource.url` - URL de la base de données
- `spring.datasource.username` - Utilisateur PostgreSQL
- `spring.datasource.password` - Mot de passe PostgreSQL
- `app.jwt.secret` - Secret JWT
- `app.jwt.expiration-ms` - Durée de vie du token

Frontend (`src/services/api.js`) :
- `API_BASE_URL` - URL du backend (par défaut: `http://localhost:8080/api`)

## 📝 Notes

- Le CORS est configuré pour accepter `http://localhost:5173`
- Les mots de passe sont hashés avec BCrypt
- La base de données est créée automatiquement au premier démarrage
- L'application est responsive et fonctionne sur mobile

## 🤝 Contribution

1. Cloner le repository
2. Créer une branche pour votre feature
3. Commiter vos changements
4. Pusher vers la branche
5. Créer une Pull Request

## 📄 Licence

Ce projet est développé dans le cadre d'un projet académique.

