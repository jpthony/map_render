import express from "express";
import { createCanvas } from "canvas";
import puppeteer from "puppeteer";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json({ limit: "5mb" }));

app.post("/render", (req, res) => {
  //const { points, width = 900, height = 450, stroke = 4 } = req.body;
  let { points, width = 900, height = 900, stroke = 4 } = req.body;

  // ✅ FIX : lorsque les points arrivent en string
  if (typeof points === "string") {
    try {
      points = JSON.parse(points);
    } catch (e) {
      return res.status(400).send("Invalid points JSON");
    }
  }

  if (!points || points.length < 2) {
    return res.status(400).send("Not enough points");
  }

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // fond
  ctx.fillStyle = "#f5f7fa";
  ctx.fillRect(0, 0, width, height);

  // bbox
  const lats = points.map(p => p[0]);
  const lngs = points.map(p => p[1]);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const pad = 20;
  const scaleX = (width - pad * 2) / (maxLng - minLng);
  const scaleY = (height - pad * 2) / (maxLat - minLat);

  const project = ([lat, lng]) => [
    pad + (lng - minLng) * scaleX,
    height - (pad + (lat - minLat) * scaleY)
  ];

  // trace
  ctx.strokeStyle = "#005eff";
  ctx.lineWidth = stroke;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  ctx.beginPath();
  points.forEach((p, i) => {
    const [x, y] = project(p);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // départ / arrivée
  const drawDot = (p, color) => {
    const [x, y] = project(p);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
  };

  drawDot(points[0], "green");
  drawDot(points.at(-1), "red");

  res.type("png");
  res.send(canvas.toBuffer("image/png"));
});

// Route pour rendu carte Leaflet avec polyligne
app.post("/render_map", async (req, res) => {
  try {
    let { points, width = 900, height = 900, zoom, attribution = true, customAttribution = "Map data © OpenStreetMap", darkMode = false } = req.body;

    // FIX n8n: points arrive souvent en string
    if (typeof points === "string") {
      try {
        points = JSON.parse(points);
      } catch (e) {
        return res.status(400).send("Invalid points JSON");
      }
    }

    if (!points || points.length < 2) {
      return res.status(400).send("Not enough points");
    }

    // Calculer le centre et zoom si non fourni
    const lats = points.map(p => p[0]);
    const lngs = points.map(p => p[1]);
    const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
    const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
    const defaultZoom = zoom || 13;

    // HTML Leaflet
    const polylineCoords = points.map(p => `[${p[0]}, ${p[1]}]`).join(", ");
    const bgColor = darkMode ? "#1a1a1a" : "#f5f7fa";
    const textColor = darkMode ? "#e0e0e0" : "#000";
    const tileLayer = darkMode 
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    body { margin: 0; padding: 0; background-color: ${bgColor}; }
    #map { position: absolute; top: 0; bottom: 0; width: 100%; height: 100%; }
    .leaflet-control-attribution { font-size: 12px; }
    ${darkMode ? `.leaflet-control-attribution { background-color: rgba(0,0,0,0.7); color: #e0e0e0; }` : ''}
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', {
      zoomControl: false,
      attributionControl: false
    }).setView([${centerLat}, ${centerLng}], ${defaultZoom});
    
    L.tileLayer('${tileLayer}', {
      attribution: '',
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(map);
    
    ${attribution ? `L.control.attribution({ position: 'bottomright', prefix: '' }).addAttribution('${customAttribution}').addTo(map);` : ''}
    
    var polyline = L.polyline([${polylineCoords}], {
      color: '#005eff',
      weight: 4,
      opacity: 0.8,
      smoothFactor: 0.5,
      dashArray: null
    }).addTo(map);
    
    // Départ (vert) et arrivée (rouge)
    L.circleMarker([${points[0][0]}, ${points[0][1]}], {
      radius: 6,
      fillColor: 'green',
      color: '#fff',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.8
    }).addTo(map);
    
    L.circleMarker([${points[points.length-1][0]}, ${points[points.length-1][1]}], {
      radius: 6,
      fillColor: 'red',
      color: '#fff',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.8
    }).addTo(map);
    
    // Fit bounds
    map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
  </script>
</body>
</html>`;

    // Lancer Puppeteer
    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width, height, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: 'networkidle2' });
    
    // Attendre que les tiles se chargent
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const screenshot = await page.screenshot({ 
      type: 'png',
      fullPage: false
    });
    await browser.close();

    res.type("png");
    res.send(screenshot);
  } catch (err) {
    console.error("Error in /render_map:", err);
    res.status(500).send("Error rendering map: " + err.message);
  }
});

app.listen(3000, () => console.log("Map renderer on :3000"));
