# Tuiles de carte pour Antananarivo

Ce dossier contient les fichiers de tuiles pour le serveur de carte offline.

## Instructions de téléchargement

Pour télécharger les données d'Antananarivo, suivez ces étapes :

### Option 1 : Télécharger depuis OpenMapTiles (recommandé)

1. Allez sur https://data.maptiler.com/downloads/planet/
2. Cherchez "Madagascar" ou téléchargez la région "Africa"
3. Téléchargez le fichier `.mbtiles`
4. Renommez-le en `antananarivo.mbtiles` et placez-le dans ce dossier

### Option 2 : Utiliser tilemaker pour créer vos propres tuiles

```bash
# Télécharger les données OSM de Madagascar
wget https://download.geofabrik.de/africa/madagascar-latest.osm.pbf

# Installer tilemaker
# Sur Ubuntu/Debian:
# sudo apt install tilemaker

# Générer les tuiles (nécessite tilemaker)
tilemaker --input madagascar-latest.osm.pbf --output antananarivo.mbtiles --config config.json
```

### Option 3 : Utiliser Protomaps

1. Allez sur https://app.protomaps.com/downloads/osm
2. Téléchargez la zone d'Antananarivo
3. Convertissez en MBTiles si nécessaire

## Configuration du serveur

Le serveur tileserver-gl est configuré pour servir les tuiles sur le port 8081.

URL des tuiles : `http://localhost:8081/styles/basic/{z}/{x}/{y}.png`

## Coordonnées d'Antananarivo

- Centre : -18.8792, 47.5079
- Zoom par défaut : 13
- Bounds approximatives :
  - Min lat: -19.05
  - Max lat: -18.70
  - Min lng: 47.35
  - Max lng: 47.70

## Structure attendue

```
tiles/
├── README.md (ce fichier)
├── antananarivo.mbtiles (fichier de tuiles)
└── config.json (configuration optionnelle)
```

## Vérification

Après avoir démarré Docker, vérifiez que le serveur fonctionne :

```bash
curl http://localhost:8081/
```

Vous devriez voir l'interface TileServer-GL.

