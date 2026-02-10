@echo off
echo ========================================
echo  Telechargement des tuiles Antananarivo
echo ========================================
echo.

REM Creer le dossier tiles s'il n'existe pas
if not exist "tiles" mkdir tiles

echo Option 1: Telecharger depuis Geofabrik (Madagascar complet)
echo -----------------------------------------------------------
echo.

REM Telecharger les donnees OSM de Madagascar
echo Telechargement de madagascar-latest.osm.pbf...
curl -L -o tiles\madagascar-latest.osm.pbf https://download.geofabrik.de/africa/madagascar-latest.osm.pbf

if exist tiles\madagascar-latest.osm.pbf (
    echo Telechargement reussi!
    echo.
    echo Pour convertir en mbtiles, vous aurez besoin de tilemaker ou d'un outil similaire.
    echo.
    echo Alternative: Utilisez https://protomaps.com/downloads pour telecharger
    echo directement la zone d'Antananarivo au format PMTiles ou MBTiles.
) else (
    echo Echec du telechargement.
)

echo.
echo ========================================
echo  Instructions manuelles
echo ========================================
echo.
echo 1. Allez sur https://protomaps.com/downloads
echo 2. Selectionnez la zone d'Antananarivo (Madagascar)
echo 3. Telechargez le fichier .pmtiles ou .mbtiles
echo 4. Placez-le dans le dossier "tiles" avec le nom "antananarivo.mbtiles"
echo.
echo Ou utilisez OpenMapTiles:
echo 1. Allez sur https://data.maptiler.com/downloads/planet/
echo 2. Telechargez la region Africa ou Madagascar
echo 3. Renommez en antananarivo.mbtiles
echo.

pause

