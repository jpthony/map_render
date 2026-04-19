# map-renderer

Microservice Node.js/Express qui génère une image PNG d'une carte avec un tracé GPS (polyline).  
Deux implémentations disponibles selon les contraintes de déploiement.

## Choisir une version

| | [puppeteer/](puppeteer/) | [staticmaps/](staticmaps/) |
|---|---|---|
| Moteur | Puppeteer + Leaflet (Chrome headless) | staticmaps (canvas Node.js) |
| Démarrage | ~3–5 s | < 100 ms |
| RAM | ~300–500 MB | ~50 MB |
| Image Docker | ~1 GB | ~200 MB |
| Styles de carte | OSM, CartoDB dark | OSM, CartoDB (light/dark/voyager), Topo |
| Rendu JS Leaflet | Oui | Non |

**→ Utilise `staticmaps/` par défaut**, sauf si tu as besoin d'un comportement Leaflet spécifique.

---

## Structure

```
map-renderer/
├── puppeteer/          # Version Puppeteer + Leaflet
│   ├── index.js
│   ├── package.json
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── README.md
├── staticmaps/         # Version staticmaps (sans navigateur)
│   ├── index.js
│   ├── package.json
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── README.md
└── README.md
```

---

## Démarrage rapide

### Avec Docker

```bash
# Version staticmaps (port 3001)
cd staticmaps && docker compose up -d

# Version puppeteer (port 3000)
cd puppeteer && docker compose up -d
```

### Sans Docker (Node.js 20+ requis)

```bash
# Version staticmaps
cd staticmaps
npm install
node index.js   # → http://localhost:3000

# Version puppeteer
cd puppeteer
npm install
node index.js   # → http://localhost:3000
```

> La version puppeteer télécharge Chromium automatiquement lors du `npm install` (~170 MB).

---

## API commune — `POST /render_map`

Les deux versions partagent la même interface :

| Paramètre | Type | Défaut | Description |
|---|---|---|---|
| `points` | `[[lat, lng], ...]` ou string JSON | — | **Requis.** Minimum 2 points |
| `width` | number | `900` | Largeur en pixels |
| `height` | number | `900` | Hauteur en pixels |
| `stroke` | number | `4` | Épaisseur de la polyline |
| `darkMode` | boolean | `false` | Thème sombre |

Paramètres spécifiques → voir le README de chaque version.

**Réponse :** image `image/png`

---

## Exemple cURL

```bash
curl -s -X POST http://localhost:3001/render_map \
  -H "Content-Type: application/json" \
  -d '{
    "points": [[43.710, 7.262], [43.705, 7.270], [43.696, 7.275]],
    "width": 900,
    "height": 900,
    "stroke": 4
  }' --output trace.png
```
