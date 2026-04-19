import express from "express";
import StaticMaps from "staticmaps";

const TILE_PROVIDERS = {
  osm:        { url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",          subdomains: ["a", "b", "c"] },
  dark:       { url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",  subdomains: ["a", "b", "c", "d"] },
  light:      { url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png", subdomains: ["a", "b", "c", "d"] },
  voyager:    { url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png", subdomains: ["a", "b", "c", "d"] },
  topo:       { url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",            subdomains: ["a", "b", "c"] },
};

const app = express();
app.use(express.json({ limit: "5mb" }));

app.post("/render_map", async (req, res) => {
  try {
    let {
      points,
      width = 900,
      height = 900,
      stroke = 4,
      darkMode = false,
      mapStyle,
    } = req.body;

    if (typeof points === "string") {
      try {
        points = JSON.parse(points);
      } catch {
        return res.status(400).send("Invalid points JSON");
      }
    }

    if (!points || points.length < 2) {
      return res.status(400).send("Not enough points");
    }

    // mapStyle prioritaire, sinon fallback sur darkMode pour compatibilité
    const styleKey = mapStyle && TILE_PROVIDERS[mapStyle]
      ? mapStyle
      : darkMode ? "dark" : "osm";
    const { url: tileUrl, subdomains: tileSubdomains } = TILE_PROVIDERS[styleKey];

    const map = new StaticMaps({
      width,
      height,
      tileUrl,
      tileSubdomains,
    });

    // Polyline — staticmaps attend [lng, lat]
    map.addLine({
      coords: points.map(([lat, lng]) => [lng, lat]),
      color: "#005effCC",
      width: stroke,
    });

    // Marqueur départ (vert)
    map.addCircle({
      coord: [points[0][1], points[0][0]],
      radius: 25,
      fill: "#00cc00",
      width: 1,
      color: "#004400",
    });

    // Marqueur arrivée (rouge)
    map.addCircle({
      coord: [points.at(-1)[1], points.at(-1)[0]],
      radius: 25,
      fill: "#ee0000",
      width: 1,
      color: "#440000",
    });

    await map.render();
    const buffer = await map.image.buffer("image/png");

    res.type("png").send(buffer);
  } catch (err) {
    console.error("Error in /render_map:", err);
    res.status(500).send("Error rendering map: " + err.message);
  }
});

app.listen(3000, () => console.log("Map renderer (staticmaps) on :3000"));
