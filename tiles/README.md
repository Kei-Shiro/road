# Tuiles de carte Offline pour Antananarivo

Ce dossier contient les fichiers de configuration et les tuiles pour le serveur de carte offline (tileserver-gl).

## 🚀 Démarrage rapide

### Étape 1 : Télécharger les tuiles d'Antananarivo

#### Option A : Utiliser Protomaps (Recommandé - Plus simple)

1. Allez sur https://protomaps.com/downloads
2. Naviguez vers Madagascar / Antananarivo
3. Sélectionnez la zone d'Antananarivo avec les bounds suivantes :
   - **Nord**: -18.70
   - **Sud**: -19.05
   - **Ouest**: 47.35
   - **Est**: 47.70
4. Téléchargez au format `.pmtiles` ou `.mbtiles`
5. Renommez le fichier en `antananarivo.mbtiles` et placez-le dans ce dossier

#### Option B : Télécharger depuis MapTiler

1. Créez un compte sur https://cloud.maptiler.com/
2. Téléchargez les tuiles pour Madagascar
3. Renommez en `antananarivo.mbtiles`

#### Option C : Générer depuis OpenStreetMap

```bash
# Télécharger les données OSM de Madagascar
wget https://download.geofabrik.de/africa/madagascar-latest.osm.pbf

# Avec tilemaker (Linux/Mac)
tilemaker --input madagascar-latest.osm.pbf --output antananarivo.mbtiles
```

### Étape 2 : Démarrer le serveur de tuiles

```bash
# Depuis la racine du projet
docker-compose up tileserver -d
```

Le serveur sera disponible sur : http://localhost:8081

### Étape 3 : Vérifier le fonctionnement

- Interface web : http://localhost:8081
- Endpoint santé : http://localhost:8081/health
- Tuiles : http://localhost:8081/styles/osm-bright/{z}/{x}/{y}.png

## 📁 Structure des fichiers

```
tiles/
├── config.json              # Configuration de tileserver-gl
├── antananarivo.mbtiles     # Fichier de tuiles (à télécharger)
├── README.md                # Ce fichier
└── styles/                  # (optionnel) Styles personnalisés
    └── osm-bright/
        └── style.json
```

## ⚙️ Configuration

Le fichier `config.json` configure le serveur de tuiles :

```json
{
  "options": {
    "paths": {
      "root": "/data",
      "mbtiles": "/data"
    }
  },
  "data": {
    "antananarivo": {
      "mbtiles": "antananarivo.mbtiles"
    }
  }
}
```

## 🗺️ Coordonnées d'Antananarivo

| Paramètre | Valeur |
|-----------|--------|
| Centre Latitude | -18.8792 |
| Centre Longitude | 47.5079 |
| Zoom par défaut | 13 |
| Bounds Min Lat | -19.05 |
| Bounds Max Lat | -18.70 |
| Bounds Min Lng | 47.35 |
| Bounds Max Lng | 47.70 |

## 🔧 Dépannage

### Le serveur ne démarre pas

1. Vérifiez que le fichier `antananarivo.mbtiles` existe
2. Vérifiez les logs : `docker logs road_tileserver`

### Les tuiles ne s'affichent pas

1. Vérifiez que le port 8081 est accessible
2. L'application utilise automatiquement OpenStreetMap en ligne comme fallback

### Erreur de configuration

Vérifiez que le `config.json` est valide avec :
```bash
cat tiles/config.json | python -m json.tool
```

## 📊 Fonctionnement avec l'application

L'application web détecte automatiquement si le serveur offline est disponible :

- ✅ **Serveur offline disponible** : Utilise les tuiles locales (plus rapide, fonctionne hors connexion)
- 🌐 **Serveur offline non disponible** : Utilise OpenStreetMap en ligne (fallback automatique)

Un indicateur visuel en haut à droite de la carte affiche le mode actuel.
