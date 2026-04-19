# map-renderer-static

Microservice Express qui génère une image PNG d'une carte avec un tracé (polyline), sans navigateur headless.  
Utilise [staticmaps](https://github.com/resamvi/staticmaps) pour télécharger les tuiles et dessiner directement sur canvas Node.js.

> Alternative légère à `map_render` (Puppeteer/Leaflet) — démarrage instantané, empreinte mémoire minimale.

---

## Lancement

### Sans Docker (Node.js 20+ requis)

```bash
npm install
node index.js
# → http://localhost:3000
```

### Avec Docker

```bash
docker compose up -d
# → http://localhost:3001
```

---

## API

### `POST /render_map`

**Body JSON :**

| Paramètre | Type | Défaut | Description |
|---|---|---|---|
| `points` | `[[lat, lng], ...]` ou string JSON | — | **Requis.** Minimum 2 points |
| `width` | number | `900` | Largeur de l'image en pixels |
| `height` | number | `900` | Hauteur de l'image en pixels |
| `stroke` | number | `4` | Épaisseur de la polyline |
| `mapStyle` | string | `"osm"` | Style de carte (voir ci-dessous) |
| `darkMode` | boolean | `false` | Raccourci pour `mapStyle: "dark"` (compatibilité) |

**Styles disponibles (`mapStyle`) :**

| Valeur | Rendu |
|---|---|
| `osm` | OpenStreetMap standard |
| `dark` | CartoDB Dark Matter |
| `light` | CartoDB Positron (clair, épuré) |
| `voyager` | CartoDB Voyager |
| `topo` | OpenTopoMap (relief) |

**Réponse :** image `image/png`

---

## Exemple cURL

```bash
curl -s -X POST http://localhost:3001/render_map \
  -H "Content-Type: application/json" \
  -d '{
    "points": [[43.710, 7.262], [43.705, 7.270], [43.696, 7.275]],
    "width": 800,
    "height": 600,
    "stroke": 5,
    "mapStyle": "voyager"
  }' --output trace.png
```

---

## Différences avec map_render (Puppeteer)

| | map_render | map_render-static |
|---|---|---|
| Moteur | Puppeteer + Leaflet (Chrome headless) | staticmaps (canvas Node.js) |
| Démarrage | ~3–5 s | < 100 ms |
| RAM | ~300–500 MB | ~50 MB |
| Image Docker | ~1 GB | ~200 MB |
| Styles de carte | OSM + CartoDB dark | OSM + CartoDB + Topo |
| Comportement JS | Leaflet complet | Non applicable |
