import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
const SERPAPI_KEY = process.env.SERPAPI_KEY;

app.use(cors({ origin: FRONTEND_ORIGIN }));
app.use(express.json());

const cache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

const CATEGORIES = {
  colleges: { label: "Colleges", query: "colleges" },
  iti: { label: "ITI", query: "ITI institutes" },
  polytechnics: { label: "Polytechnics", query: "polytechnic colleges" },
  skill_training: { label: "Skill Training Centers", query: "skill training centers" },
  academies: { label: "Academies", query: "academies" },
  center_of_excellence: { label: "Centers of Excellence", query: "center of excellence" },
  skill_india: { label: "Skill India Centers", query: "Skill India centers" },
  pmkvy: { label: "PMKVY Centers", query: "Pradhan Mantri Kaushal Vikas Yojana centers PMKVY" },
  ddugky: { label: "DDU-GKY Centers", query: "DDU-GKY centers" },
  mobile_repair: { label: "Mobile Repair Shops", query: "mobile repair shops" },
  sim_shops: { label: "SIM Shops", query: "SIM card shops" },
  csc: { label: "CSC Centers", query: "Common Service Centers CSC" },
  emitra: { label: "E-Mitra Centers", query: "E-Mitra centers" },
  jss: { label: "Jan Shikshan Sansthan", query: "Jan Shikshan Sansthan" },
  ngos: { label: "NGOs", query: "NGOs" },
  coaching: { label: "Coaching Centers", query: "coaching centers" },
  pilot_training: { label: "Pilot Training", query: "pilot training institutes" },
  air_hostess: { label: "Air Hostess Training", query: "air hostess training institutes" },
  skill_academy: { label: "Skill Academies", query: "skill academies" }
};

function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function mapsUrl(item) {
  if (item?.links?.directions) return item.links.directions;
  if (item?.links?.maps) return item.links.maps;
  const address = item?.address || "";
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${item?.title || "Location"} ${address}`.trim()
  )}`;
}

function normalizeLocal(item, index, category) {
  const gps = item?.gps_coordinates || {};
  return {
    id: item?.place_id || item?.data_id || `local-${index}`,
    source: "Google Local",
    title: cleanText(item?.title) || `Unnamed ${category.label}`,
    rating: item?.rating ?? null,
    reviews: item?.reviews ?? null,
    type: cleanText(item?.type),
    address: cleanText(item?.address),
    phone: cleanText(item?.phone),
    description: cleanText(item?.description),
    hours: item?.hours || null,
    thumbnail: item?.thumbnail || "",
    latitude: gps?.latitude ?? null,
    longitude: gps?.longitude ?? null,
    maps_url: mapsUrl(item),
    website: item?.links?.website || item?.website || ""
  };
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "India Local Finder API" });
});

app.get("/api/search", async (req, res) => {
  try {
    if (!SERPAPI_KEY) {
      return res.status(500).json({
        error: "SERPAPI_KEY is missing. Create backend/.env from .env.example and add your key."
      });
    }

    const area = cleanText(req.query.area);
    const categoryKey = cleanText(req.query.category).toLowerCase() || "colleges";
    const category = CATEGORIES[categoryKey];
    const page = Math.max(0, Number.parseInt(req.query.page || "0", 10) || 0);

    if (!category) {
      return res.status(400).json({ error: "Invalid category." });
    }

    if (!area || area.length < 2) {
      return res.status(400).json({
        error: "Please provide an area, sector, city, locality or pincode."
      });
    }

    if (area.length > 120) {
      return res.status(400).json({ error: "Location is too long." });
    }

    const cacheKey = `${categoryKey}::${area.toLowerCase()}::${page}`;
    const cached = cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return res.json({ ...cached.data, cached: true });
    }

    const query = `${category.query} in ${area}`;
    const params = new URLSearchParams({
      engine: "google_local",
      q: query,
      location: "India",
      google_domain: "google.co.in",
      gl: "in",
      hl: "en",
      device: "desktop",
      start: String(page * 20),
      api_key: SERPAPI_KEY
    });

    const response = await fetch(`https://serpapi.com/search.json?${params.toString()}`);
    const data = await response.json();

    if (!response.ok || data?.error) {
      return res.status(response.status || 502).json({
        error: data?.error || "SerpAPI request failed."
      });
    }

    const localResults = Array.isArray(data.local_results)
      ? data.local_results.map((item, index) => normalizeLocal(item, index, category))
      : [];

    const result = {
      query: data.search_parameters?.q || query,
      category: categoryKey,
      category_label: category.label,
      area,
      total_results: null,
      local_map: data.local_map || null,
      local_results: localResults,
      organic_results: [],
      has_more: Boolean(data.serpapi_pagination?.next),
      page,
      cached: false
    };

    cache.set(cacheKey, { timestamp: Date.now(), data: result });
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Unable to search right now. Please try again."
    });
  }
});

app.listen(PORT, () => {
  console.log(`India Local Finder backend running at http://localhost:${PORT}`);
});
