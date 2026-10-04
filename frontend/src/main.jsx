import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import * as XLSX from "xlsx";
import {
  Building2,
  ChevronRight,
  ExternalLink,
  GraduationCap,
  MapPin,
  Phone,
  Search,
  Star,
  X,
  Download
} from "lucide-react";
import "./styles.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const CATEGORIES = [
  { value: "colleges", label: "Colleges", icon: "🎓" },
  { value: "iti", label: "ITI", icon: "🛠️" },
  { value: "polytechnics", label: "Polytechnics", icon: "🏫" },
  { value: "skill_training", label: "Skill Training Centers", icon: "🎯" },
  { value: "academies", label: "Academies", icon: "📚" },
  { value: "center_of_excellence", label: "Centers of Excellence", icon: "⭐" },
  { value: "skill_india", label: "Skill India Centers", icon: "🇮🇳" },
  { value: "pmkvy", label: "PMKVY Centers", icon: "🎓" },
  { value: "ddugky", label: "DDU-GKY Centers", icon: "🏢" },
  { value: "mobile_repair", label: "Mobile Repair Shops", icon: "📱" },
  { value: "sim_shops", label: "SIM Shops", icon: "📶" },
  { value: "csc", label: "CSC Centers", icon: "💻" },
  { value: "emitra", label: "E-Mitra Centers", icon: "🧾" },
  { value: "jss", label: "Jan Shikshan Sansthan", icon: "🏛️" },
  { value: "ngos", label: "NGOs", icon: "🤝" },
  { value: "coaching", label: "Coaching Centers", icon: "📝" },
  { value: "pilot_training", label: "Pilot Training", icon: "✈️" },
  { value: "air_hostess", label: "Air Hostess Training", icon: "🛫" },
  { value: "skill_academy", label: "Skill Academies", icon: "🚀" }
];

function App() {
  const [area, setArea] = useState("");
  const [category, setCategory] = useState("colleges");
  const [results, setResults] = useState([]);
  const [organic, setOrganic] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchedArea, setSearchedArea] = useState("");
  const [searchedCategory, setSearchedCategory] = useState("colleges");
  const [activeFilter, setActiveFilter] = useState("all");

  const selectedCategory = CATEGORIES.find((item) => item.value === searchedCategory) || CATEGORIES[0];
  const selectedSearchCategory = CATEGORIES.find((item) => item.value === category) || CATEGORIES[0];

  async function searchLocations(targetArea = area, targetPage = 0, targetCategory = category) {
    const value = targetArea.trim();

    if (!value) {
      setError("Enter a city, sector, locality or pincode.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE}/api/search?area=${encodeURIComponent(value)}&category=${encodeURIComponent(targetCategory)}&page=${targetPage}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Search failed.");
      }

      if (targetPage === 0) {
        setResults(data.local_results || []);
        setOrganic(data.organic_results || []);
      } else {
        setResults((prev) => [...prev, ...(data.local_results || [])]);
        setOrganic((prev) => [...prev, ...(data.organic_results || [])]);
      }

      setHasMore(Boolean(data.has_more));
      setPage(targetPage);
      setSearchedArea(value);
      setSearchedCategory(targetCategory);
    } catch (err) {
      setError(err.message || "Something went wrong.");
      if (targetPage === 0) {
        setResults([]);
        setOrganic([]);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const savedArea = localStorage.getItem("india-finder-area");
    const savedCategory = localStorage.getItem("india-finder-category");
    if (savedArea) setArea(savedArea);
    if (savedCategory && CATEGORIES.some((item) => item.value === savedCategory)) {
      setCategory(savedCategory);
    }
  }, []);

  const filteredResults = useMemo(() => {
    if (activeFilter === "rated") {
      return results.filter((item) => Number(item.rating || 0) >= 4);
    }
    if (activeFilter === "reviewed") {
      return [...results].sort(
        (a, b) => Number(b.reviews || 0) - Number(a.reviews || 0)
      );
    }
    return results;
  }, [results, activeFilter]);

  function submit(e) {
    e.preventDefault();
    localStorage.setItem("india-finder-area", area.trim());
    localStorage.setItem("india-finder-category", category);
    setActiveFilter("all");
    searchLocations(area, 0, category);
  }

  function extractPincode(address = "") {
    const match = String(address).match(/\b\d{6}\b/);
    return match ? match[0] : (/^\d{6}$/.test(searchedArea.trim()) ? searchedArea.trim() : "");
  }

  function downloadExcel() {
    if (!results.length) return;

    const rows = results.map((item, index) => ({
      "S.No.": index + 1,
      "Category": selectedCategory.label,
      "Name": item.title || "",
      "Area": searchedArea,
      "Pincode": extractPincode(item.address),
      "Full Address": item.address || "",
      "Rating": item.rating ?? "",
      "Reviews": item.reviews ?? "",
      "Type": item.type || "",
      "Phone": item.phone || "",
      "Website": item.website || "",
      "Google Maps": item.maps_url || "",
      "Description": item.description || "",
      "Hours": Array.isArray(item.hours) ? item.hours.join(" | ") : (item.hours || ""),
      "Latitude": item.latitude ?? "",
      "Longitude": item.longitude ?? ""
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet["!cols"] = [
      { wch: 7 }, { wch: 28 }, { wch: 36 }, { wch: 25 }, { wch: 12 },
      { wch: 48 }, { wch: 10 }, { wch: 10 }, { wch: 28 }, { wch: 18 },
      { wch: 42 }, { wch: 42 }, { wch: 55 }, { wch: 28 }, { wch: 14 }, { wch: 14 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, selectedCategory.label.slice(0, 31));

    const safeArea = searchedArea
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50) || "India";

    const safeCategory = selectedCategory.label
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40);

    XLSX.writeFile(workbook, `${safeCategory}-${safeArea}.xlsx`);
  }

  function clearSearch() {
    setArea("");
    setResults([]);
    setOrganic([]);
    setError("");
    setSearchedArea("");
    setPage(0);
    setHasMore(false);
  }

  function changeCategory(value) {
    setCategory(value);
    setResults([]);
    setOrganic([]);
    setSearchedArea("");
    setPage(0);
    setHasMore(false);
    setError("");
  }

  return (
    <div className="app">
      <header className="hero">
        <nav className="navbar">
          <div className="brand">
            <div className="brand-icon"><Building2 size={21} /></div>
            <span>India Local Finder</span>
          </div>
          <div className="nav-note">India-wide search</div>
        </nav>

        <div className="hero-content">
          <div className="eyebrow">FIND CENTERS, INSTITUTES & SERVICES</div>
          <h1>Find what you need near you.</h1>
          <p>
            Select a category and search by city, sector, locality or pincode.
            Discover live local listings from Google.
          </p>

          <form className="search-box" onSubmit={submit}>
            <select
              className="category-select"
              value={category}
              onChange={(e) => changeCategory(e.target.value)}
              aria-label="Category"
            >
              {CATEGORIES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>

            <div className="search-divider" />
            <MapPin size={21} />
            <input
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="Try: Sector 62 Noida or 201301"
              aria-label="Area or pincode"
            />
            {area && (
              <button type="button" className="clear-btn" onClick={clearSearch}>
                <X size={18} />
              </button>
            )}
            <button className="search-btn" type="submit" disabled={loading}>
              <Search size={18} />
              {loading ? "Searching..." : "Search"}
            </button>
          </form>

          <div className="examples">
            <span>Category:</span>
            <span className="selected-example">{selectedSearchCategory.icon} {selectedSearchCategory.label}</span>
            <span>•</span>
            <span>Try:</span>
            {["Sector 62 Noida", "Shastri Nagar Meerut", "Gurgaon Sector 14"].map(
              (example) => (
                <button
                  key={example}
                  onClick={() => {
                    setArea(example);
                    localStorage.setItem("india-finder-area", example);
                    localStorage.setItem("india-finder-category", category);
                    searchLocations(example, 0, category);
                  }}
                >
                  {example}
                </button>
              )
            )}
          </div>
        </div>
      </header>

      <main className="content">
        {error && <div className="error">{error}</div>}

        {!searchedArea && !loading && (
          <section className="empty-state">
            <div className="empty-icon"><GraduationCap size={30} /></div>
            <h2>Search for {selectedSearchCategory.label}</h2>
            <p>Select a category, enter an area and search to see live local listings.</p>
          </section>
        )}

        {searchedArea && (
          <>
            <section className="results-header">
              <div>
                <div className="small-label">SEARCH RESULTS</div>
                <h2>{selectedCategory.label} in {searchedArea}</h2>
                <p>{results.length} local listings loaded</p>
              </div>

              <div className="results-tools">
                <div className="filters">
                  {[
                    ["all", "All"],
                    ["rated", "4+ rating"],
                    ["reviewed", "Most reviewed"]
                  ].map(([key, label]) => (
                    <button
                      key={key}
                      className={activeFilter === key ? "filter active" : "filter"}
                      onClick={() => setActiveFilter(key)}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {results.length > 0 && (
                  <button className="download-btn" onClick={downloadExcel}>
                    <Download size={17} />
                    Download Excel
                  </button>
                )}
              </div>
            </section>

            {loading && results.length === 0 ? (
              <div className="loading-grid">
                {[1, 2, 3, 4].map((n) => <div className="skeleton" key={n} />)}
              </div>
            ) : filteredResults.length > 0 ? (
              <section className="cards">
                {filteredResults.map((item) => (
                  <LocationCard key={item.id} item={item} category={selectedCategory.label} />
                ))}
              </section>
            ) : (
              <div className="no-results">
                <Building2 size={34} />
                <h3>No local {selectedCategory.label.toLowerCase()} found</h3>
                <p>Try a nearby sector, locality, city or pincode.</p>
              </div>
            )}

            {organic.length > 0 && (
              <section className="web-results">
                <div className="section-title">
                  <div>
                    <div className="small-label">ADDITIONAL SOURCES</div>
                    <h2>Websites & listings</h2>
                  </div>
                  <span>From Google search</span>
                </div>

                <div className="organic-list">
                  {organic.slice(0, 8).map((item) => (
                    <a
                      href={item.website}
                      target="_blank"
                      rel="noreferrer"
                      className="organic-card"
                      key={item.id}
                    >
                      <div>
                        <h3>{item.title}</h3>
                        <p>{item.description}</p>
                        {item.address && <small>{item.address}</small>}
                      </div>
                      <ExternalLink size={18} />
                    </a>
                  ))}
                </div>
              </section>
            )}

            {results.length > 0 && hasMore && (
              <button
                className="load-more"
                onClick={() => searchLocations(searchedArea, page + 1, searchedCategory)}
                disabled={loading}
              >
                {loading ? "Loading..." : "Load more"}
                <ChevronRight size={18} />
              </button>
            )}

            <p className="disclaimer">
              Listings are fetched live from Google through SerpAPI. Results
              are not stored in a database and may change over time.
            </p>
          </>
        )}
      </main>
    </div>
  );
}

function LocationCard({ item, category }) {
  return (
    <article className="pg-card">
      <div className="image-wrap">
        {item.thumbnail ? (
          <img src={item.thumbnail} alt="" loading="lazy" />
        ) : (
          <div className="image-placeholder"><Building2 size={38} /></div>
        )}
        {item.rating && (
          <span className="rating-badge">
            <Star size={13} fill="currentColor" />
            {item.rating}
          </span>
        )}
      </div>

      <div className="card-body">
        <div className="card-source">{item.type || category}</div>
        <h3>{item.title}</h3>

        {item.reviews !== null && (
          <div className="reviews">
            <Star size={14} fill="currentColor" />
            {item.rating ?? "—"} · {Number(item.reviews).toLocaleString()} reviews
          </div>
        )}

        {item.address && (
          <div className="detail">
            <MapPin size={16} />
            <span>{item.address}</span>
          </div>
        )}

        {item.phone && (
          <div className="detail">
            <Phone size={16} />
            <span>{item.phone}</span>
          </div>
        )}

        {item.description && (
          <p className="description">{item.description}</p>
        )}

        <div className="card-actions">
          {item.maps_url && (
            <a
              href={item.maps_url}
              target="_blank"
              rel="noreferrer"
              className="primary-action"
            >
              View on Maps <ExternalLink size={15} />
            </a>
          )}
          {item.website && (
            <a
              href={item.website}
              target="_blank"
              rel="noreferrer"
              className="secondary-action"
            >
              Website
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
