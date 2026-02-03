# Road Signalement - Application Mobile

Application mobile hybride développée avec **Ionic Vue** et **Capacitor** pour le signalement des problèmes routiers à Madagascar.

## 🚀 Fonctionnalités

### Carte interactive
- Visualisation des signalements sur une carte OpenStreetMap
- Géolocalisation de l'utilisateur
- Marqueurs colorés selon le statut des signalements
- Création de signalements en cliquant sur la carte

### Gestion des signalements
- Liste des signalements avec filtres et tri
- Swipe actions pour modifier/supprimer
- Vue détaillée avec toutes les informations
- Création et modification de signalements
- Pull-to-refresh et pagination infinie

### Authentification
- Connexion sécurisée via JWT
- Support Firebase Authentication (optionnel)
- Gestion des rôles (Admin, Manager, Visiteur)

### Statistiques
- Dashboard avec indicateurs clés
- Répartition par statut
- Taux de résolution
- Activité récente

## 📱 Technologies

- **Framework**: [Ionic Vue 8](https://ionicframework.com/docs/vue/overview)
- **UI Framework**: [Vue.js 3](https://vuejs.org/) (Composition API)
- **Routing**: [Vue Router 4](https://router.vuejs.org/) + Ionic Router
- **State Management**: [Pinia](https://pinia.vuejs.org/)
- **HTTP Client**: [Axios](https://axios-http.com/)
- **Native Bridge**: [Capacitor 6](https://capacitorjs.com/)
- **Maps**: [Leaflet](https://leafletjs.com/)
- **Build Tool**: [Vite 5](https://vitejs.dev/)

## 📂 Structure du projet

```
road_mobile/
├── src/
│   ├── components/         # Composants réutilisables
│   │   ├── FilterModal.vue
│   │   ├── SignalementCard.vue
│   │   ├── EmptyState.vue
│   │   └── SkeletonCard.vue
│   │
│   ├── layouts/            # Layouts de l'application
│   │   └── TabsLayout.vue
│   │
│   ├── router/             # Configuration du routeur
│   │   └── index.js
│   │
│   ├── services/           # Services API
│   │   ├── api.js          # Configuration Axios
│   │   ├── authService.js  # Authentification
│   │   ├── signalementService.js
│   │   └── locationService.js
│   │
│   ├── stores/             # Stores Pinia
│   │   ├── authStore.js
│   │   └── signalementStore.js
│   │
│   ├── theme/              # Styles et thème
│   │   ├── variables.css   # Variables Ionic
│   │   └── global.css      # Styles globaux
│   │
│   ├── utils/              # Utilitaires
│   │   ├── constants.js    # Constantes
│   │   └── helpers.js      # Fonctions utilitaires
│   │
│   ├── views/              # Pages de l'application
│   │   ├── MapPage.vue
│   │   ├── SignalementsPage.vue
│   │   ├── StatsPage.vue
│   │   ├── ProfilePage.vue
│   │   ├── LoginPage.vue
│   │   ├── SignalementDetailPage.vue
│   │   ├── CreateSignalementPage.vue
│   │   └── EditSignalementPage.vue
│   │
│   ├── App.vue             # Composant racine
│   └── main.js             # Point d'entrée
│
├── public/                 # Assets statiques
├── capacitor.config.json   # Configuration Capacitor
├── vite.config.js          # Configuration Vite
├── package.json
└── index.html
```

## 🛠️ Installation

### Prérequis

- Node.js 18+ et npm
- Pour iOS : macOS avec Xcode
- Pour Android : Android Studio

### Installation des dépendances

```bash
cd road_mobile
npm install
```

### Configuration

1. **API Backend** : Modifier l'URL de l'API dans `src/services/api.js` :
   ```javascript
   const API_BASE_URL = 'http://votre-ip:8080/api';
   ```

2. **Firebase** (optionnel) : Configurer les clés dans `src/services/authService.js`

## 🚀 Développement

### Lancer en mode développement (web)

```bash
npm run dev
```

L'application sera accessible sur `http://localhost:8100`

### Build pour production

```bash
npm run build
```

## 📱 Déploiement mobile

### Android

```bash
# Ajouter la plateforme Android
npx cap add android

# Synchroniser les fichiers
npm run build
npx cap sync android

# Ouvrir Android Studio
npx cap open android
```

### iOS (macOS uniquement)

```bash
# Ajouter la plateforme iOS
npx cap add ios

# Synchroniser les fichiers
npm run build
npx cap sync ios

# Ouvrir Xcode
npx cap open ios
```

## 🎨 Thème

L'application utilise un thème sombre moderne avec les couleurs :

- **Primaire** : `#3b82f6` (Bleu)
- **Secondaire** : `#00d9ff` (Cyan)
- **Succès** : `#10b981` (Vert)
- **Avertissement** : `#f59e0b` (Orange)
- **Danger** : `#ef4444` (Rouge)

Le thème s'adapte automatiquement selon les préférences système (mode clair/sombre).

## 📋 API Endpoints

L'application communique avec le backend Java Spring Boot :

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/auth/login` | Connexion |
| POST | `/api/auth/logout` | Déconnexion |
| GET | `/api/auth/profile` | Profil utilisateur |
| GET | `/api/signalements` | Liste des signalements |
| GET | `/api/signalements/:id` | Détail d'un signalement |
| POST | `/api/signalements` | Créer un signalement |
| PUT | `/api/signalements/:id` | Modifier un signalement |
| DELETE | `/api/signalements/:id` | Supprimer un signalement |
| GET | `/api/signalements/stats` | Statistiques |

## 🔐 Rôles et permissions

| Rôle | Voir | Créer | Modifier | Supprimer |
|------|------|-------|----------|-----------|
| VISITEUR | ✅ | ✅ (les siens) | ✅ (les siens) | ❌ |
| MANAGER | ✅ | ✅ | ✅ | ❌ |
| ADMIN | ✅ | ❌ | ✅ | ✅ |

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commit les changements (`git commit -am 'Ajout nouvelle fonctionnalité'`)
4. Push la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Créer une Pull Request

## 📄 Licence

Ce projet est sous licence MIT.
