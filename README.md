# 🚧 Road Signaling Application

Application de signalisation des travaux routiers pour Antananarivo.

## 📋 Description

Cette application permet de :
- Signaler et suivre les travaux routiers
- Visualiser les travaux sur une carte interactive
- Gérer les statuts et l'avancement des travaux
- Fonctionner en mode offline avec synchronisation

## 🏗️ Architecture

L'application suit une architecture **API-FIRST** avec des modules indépendants :

```
road/
├── road_back/          # Backend Spring Boot
│   ├── auth/           # Module Authentification
│   ├── map/            # Module Cartographie
│   ├── signalement/    # Module Signalements
│   └── config/         # Configuration globale
└── road_front/         # Frontend Vue.js
    ├── views/          # Pages de l'application
    ├── stores/         # État global (Pinia)
    ├── services/       # Services API
    └── router/         # Navigation
```

## 🛠️ Technologies

### Backend
- **Java 21** avec **Spring Boot 4.0**
- **Spring Security** + **JWT** pour l'authentification
- **Spring Data JPA** + **PostgreSQL**
- **SpringDoc OpenAPI** (Swagger)

### Frontend
- **Vue.js 3** avec Composition API
- **Pinia** pour la gestion d'état
- **Vue Router** pour la navigation
- **Leaflet** pour les cartes
- **Dexie.js** pour le stockage offline (IndexedDB)
- **Axios** pour les appels API

## 🚀 Installation

### Prérequis
- Java 21+
- Node.js 20+
- PostgreSQL 15+

### Base de données

1. Créer la base de données PostgreSQL :
```sql
CREATE DATABASE road_db;
```

2. Configurer les credentials dans `road_back/src/main/resources/application.properties`

### Backend

```bash
cd road_back
./mvnw spring-boot:run
```

Le serveur démarre sur http://localhost:8080

### Frontend

```bash
cd road_front
npm install
npm run dev
```

L'application démarre sur http://localhost:5173

## 📖 Documentation API

Swagger UI disponible sur : http://localhost:8080/swagger-ui.html

### Endpoints principaux

#### Authentification (`/api/auth`)
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/register` | Inscription |
| POST | `/login` | Connexion |
| POST | `/logout` | Déconnexion |
| GET | `/profile` | Profil utilisateur |
| PUT | `/profile` | Modifier profil |
| POST | `/refresh` | Rafraîchir token |
| POST | `/unlock/{email}` | Débloquer compte |

#### Signalements (`/api/signalements`)
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/` | Liste paginée |
| GET | `/{id}` | Détail |
| GET | `/statut/{statut}` | Par statut |
| GET | `/bounds` | Par zone géographique |
| GET | `/stats` | Statistiques |
| POST | `/` | Créer |
| PUT | `/{id}` | Modifier |
| DELETE | `/{id}` | Supprimer (Manager) |
| POST | `/sync` | Synchronisation offline |

#### Cartographie (`/api/map`)
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/config` | Configuration carte |
| GET | `/tiles/{z}/{x}/{y}` | Tuile de carte |
| POST | `/preload` | Précharger tuiles |

## 👥 Rôles utilisateurs

| Rôle | Permissions |
|------|-------------|
| VISITEUR | Lecture seule |
| UTILISATEUR | Création/modification de signalements |
| MANAGER | Toutes les permissions + suppression + gestion utilisateurs |

## 🔐 Sécurité

- Authentification JWT avec refresh token
- Limitation des tentatives de connexion (3 max)
- Blocage automatique de compte (30 min)
- API de déblocage
- Hashage des mots de passe (BCrypt)

## 🗺️ Fonctionnalités carte

- Affichage des signalements avec marqueurs colorés
- Filtrage par statut
- Recherche de signalements
- Ajout de signalement par clic
- Popup d'information au survol
- Support offline avec cache des tuiles

## 📱 Mode Offline

L'application fonctionne en mode déconnecté :
- Stockage local des signalements (IndexedDB)
- File d'attente de synchronisation
- Résolution de conflits (last-write-wins)
- Synchronisation automatique au retour en ligne

## 🧪 Comptes de test

| Email | Mot de passe | Rôle |
|-------|--------------|------|
| manager@road.mg | manager123 | MANAGER |
| user@road.mg | user123 | UTILISATEUR |

## 📦 Déploiement

### Docker (recommandé)

```bash
docker-compose up -d
```

### Production

1. Build du frontend :
```bash
cd road_front
npm run build
```

2. Build du backend :
```bash
cd road_back
./mvnw package -DskipTests
```

3. Lancer l'application :
```bash
java -jar target/road_back-0.0.1-SNAPSHOT.jar
```

## 📝 License

MIT License - Projet S5 Mr_Rojo

