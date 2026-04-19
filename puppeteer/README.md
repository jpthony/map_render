# Map Renderer 🗺️

Serveur Node.js pour générer des images de cartes avec des polylignes. 
Deux modes de rendu disponibles : **tracé simple** ou **tracé sur carte OpenStreetMap**.


## Installation

### Prérequis
- Docker & Docker Compose (recommandé)
- Ou Node.js 20+ + npm
- Git

### Cloner le projet

```bash
git clone https://github.com/jpthony/map_render.git
cd map_render/puppeteer
```

### Sans Docker (Node.js 20+ requis)

```bash
npm install        # installe aussi Chromium automatiquement (~170 MB)
node index.js
# → http://localhost:3000
```

### Avec Docker (recommandé en production)

```bash
docker compose up --build
# → http://localhost:3000
```

## Routes disponibles

### 1. `/render` - Rendu simple (canvas)
Génère une image simple avec la polyligne tracée en bleu.

**POST** avec JSON :
```json
{
  "points": [[43.70842,7.29267], [43.70821,7.29271], [43.70812,7.29271]],
  "width": 900,
  "height": 900,
  "stroke": 4
}
```

**Réponse** : Image PNG

---

### 2. `/render_map` - Rendu Leaflet/OSM
Génère une carte interactive OSM avec Leaflet, screenshot en PNG. Affichage épuré sans boutons de zoom.

**POST** avec JSON :
```json
{
  "points": [[43.70842,7.29267], [43.70821,7.29271], [43.70812,7.29271]],
  "width": 900,
  "height": 900,
  "zoom": 13,
  "attribution": true,
  "customAttribution": "Map data © OpenStreetMap",
  "darkMode": false
}
```

**Paramètres optionnels** :
- `zoom` : niveau de zoom (défaut: 13)
- `attribution` : afficher les crédits (défaut: true)
- `customAttribution` : texte des crédits personnalisé (défaut: "Map data © OpenStreetMap")
- `darkMode` : thème sombre (défaut: false)

**Réponse** : Image PNG

---

## Réinstaller / Rebuild

Après modification du code :

```bash
# Nettoyer complètement
docker compose down --volumes
docker system prune -af --volumes

# Relancer avec rebuild
docker compose up --build --no-cache
```

Ou plus rapide :
```bash
docker compose up --build --no-cache
```

---

## Structure

```
map-renderer/
├── index.js           # Serveur Express
├── package.json       # Dépendances
├── Dockerfile         # Image Docker
├── docker-compose.yml # Orchestration
└── README.md          # Ce fichier
```

## Dépendances

- **express** : Serveur HTTP
- **canvas** : Rendu 2D simple
- **puppeteer** : Screenshot Leaflet/OSM

## Notes

- Les points doivent être au format `[latitude, longitude]`
- La route `/render_map` nécessite Puppeteer + Chromium (plus lent)
- La route `/render` est rapide et léère pour du rendu simple
- Limit taille JSON : 5MB

---

**Exemples avec curl** :

```bash
#simple
curl -X POST http://localhost:3000/render_map \
  -H "Content-Type: application/json" \
  -d '{"points":[[43.70842,7.29267],[43.70821,7.29271]],"width":900,"height":900}' \
  > map.png

#complet
curl -X POST http://localhost:3000/render_map \
  -H "Content-Type: application/json" \
  -d '{
    "points": [[43.70715,7.2924],[43.707,7.29229]],
    "width": 450,
    "height": 450,
    "stroke": 4,
    "zoom": 13,
    "attribution": true,
    "customAttribution": "My map",
    "darkMode": false
  }' > map.png
```