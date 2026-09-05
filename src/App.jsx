import { useEffect, useMemo, useRef, useState } from "react";

const WEBMAP_ID = import.meta.env.VITE_ARCGIS_WEBMAP_ID || "7f0c7b29b88b4e71afabe10c20ce79b6";
const PORTAL_URL = import.meta.env.VITE_ARCGIS_PORTAL_URL || "https://esriireland.maps.arcgis.com";

const groups = [
  { title: "Clubs & groups", color: "#9c218d", icon: "✦", items: [
    ["Combat sports", "🥊"], ["Court & racquet", "🎾"], ["Disability sport", "♿"], ["Exercise & fitness", "🏃"],
    ["Field sports", "🏑"], ["Gaelic games", "☘"], ["Indoor sports", "🏋"], ["Leisure", "🎳"],
    ["Motor sports", "🏁"], ["Outdoor adventure", "🧭"], ["Target sports", "◎"], ["Water sports", "🌊"],
  ]},
  { title: "Trails to explore", color: "#35aaa7", icon: "↝", items: [
    ["Walking", "🚶"], ["Cycling", "🚲"], ["Horse riding", "♞"], ["Paddling", "🛶"],
    ["Open water swimming", "🏊"], ["Snorkelling", "🤿"], ["Dinghy cruising", "⛵"],
  ]},
  { title: "Places to be active", color: "#e6aa28", icon: "⌖", items: [
    ["Beach / seashore", "☀"], ["Forest / woodland", "🌲"], ["Green / open space", "🌿"], ["Inland water", "💧"],
    ["National park", "⛰"], ["Park / garden", "❀"], ["Indoor facility", "⌂"], ["Outdoor facility", "⚑"],
  ]},
];

const filterTerms = {
  "Combat sports": ["combat", "boxing", "martial", "karate", "judo", "taekwondo"],
  "Court & racquet": ["court", "racquet", "tennis", "badminton", "squash", "table tennis"],
  "Disability sport": ["disability", "adaptive", "wheelchair", "special olympics"],
  "Exercise & fitness": ["exercise", "fitness", "gym", "running", "yoga", "pilates"],
  "Field sports": ["field", "hockey", "rugby", "soccer", "football", "athletics"],
  "Gaelic games": ["gaelic", "gaa", "hurling", "camogie", "handball"],
  "Indoor sports": ["indoor", "gymnastics", "basketball", "volleyball"],
  Leisure: ["leisure", "recreation", "bowling", "dance"],
  "Motor sports": ["motor", "kart", "rally"],
  "Outdoor adventure": ["outdoor", "adventure", "climbing", "orienteering", "mountaineering"],
  "Target sports": ["target", "archery", "shooting"],
  "Water sports": ["water", "sailing", "surf", "rowing", "canoe", "kayak"],
  Walking: ["walking", "walk", "hiking", "hillwalking"],
  Cycling: ["cycling", "cycle", "bike", "biking"],
  "Horse riding": ["horse", "equestrian", "riding"],
  Paddling: ["paddling", "canoe", "kayak"],
  "Open water swimming": ["open water", "swimming", "swim"],
  Snorkelling: ["snorkel", "diving"],
  "Dinghy cruising": ["dinghy", "cruising", "sailing"],
  "Beach / seashore": ["beach", "seashore", "coast"],
  "Forest / woodland": ["forest", "woodland", "woods"],
  "Green / open space": ["green", "open space", "grassland"],
  "Inland water": ["inland water", "lake", "river", "lough"],
  "National park": ["national park", "nature reserve"],
  "Park / garden": ["park", "garden"],
  "Indoor facility": ["indoor facility", "sports hall", "leisure centre", "gym"],
  "Outdoor facility": ["outdoor facility", "pitch", "track", "playground"],
};

const sqlFilters = {
  "Combat sports": { kind: "club", value: "combat sports" },
  "Court & racquet": { kind: "club", value: "court & racquet sports" },
  "Disability sport": { kind: "club", value: "disability sports" },
  "Exercise & fitness": { kind: "club", value: "exercise & fitness" },
  "Field sports": { kind: "club", value: "field sports" },
  "Gaelic games": { kind: "club", value: "gaelic/irish games" },
  "Indoor sports": { kind: "club", value: "indoor sports" },
  Leisure: { kind: "club", value: "leisure & recreation" },
  "Motor sports": { kind: "club", value: "motor sports" },
  "Outdoor adventure": { kind: "club", value: "outdoor & adventure" },
  "Target sports": { kind: "club", value: "target sports" },
  "Water sports": { kind: "club", value: "water sports" },
  Walking: { kind: "trail", values: ["Walking"] },
  Cycling: { kind: "trail", values: ["Cycling"] },
  "Horse riding": { kind: "trail", values: ["Horse Sport"] },
  Paddling: { kind: "trail", values: ["Canoeing/Kayaking/Paddling"] },
  "Open water swimming": { kind: "trail", values: ["Snorkelling, Swimming"] },
  Snorkelling: { kind: "trail", values: ["Snorkelling, Swimming"] },
  "Dinghy cruising": { kind: "trail", values: ["Dinghy Cruising"] },
  "Beach / seashore": { kind: "place", values: ["Beach/Seashore"] },
  "Forest / woodland": { kind: "place", values: ["Forest/Woodland"] },
  "Green / open space": { kind: "place", values: ["Green/Open Space"] },
  "Inland water": { kind: "place", values: ["Inland Water"] },
  "National park": { kind: "place", values: ["National Park/Nature Reserve"] },
  "Park / garden": { kind: "place", values: ["Park/Garden"] },
  "Indoor facility": { kind: "place", values: ["Indoor Facility", "Indoor & Outdoor Facility"] },
  "Outdoor facility": { kind: "place", values: ["Outdoor Facility", "Indoor & Outdoor Facility"] },
};

const sqlString = value => `'${String(value).replaceAll("'", "''")}'`;

const advancedOptions = {
  activities: ["Aero Sports", "American Football", "Angling/Fishing", "Archery", "Athletics", "Badminton", "Basketball", "Baton Twirling", "Bocce/Boccia", "Boxing", "Camogie", "Canoeing/Kayaking/Paddling", "Caving", "Children's Play", "Clay Target Shooting", "Climbing", "Cricket", "Croquet", "Cycling", "Deaf Sports", "Diving", "Fencing", "Football/Soccer", "GAA Handball", "Gaelic Football", "Golf", "Group Fitness", "Gym/Workout", "Gymnastics", "Hillwalking/Mountaineering", "Hockey", "Horse Sport", "Horseshoe Pitching", "Hurling", "Ice Hockey", "Ice Skating", "Jogging/Running", "Judo", "Karate", "Ladies Gaelic Football", "Lawn Bowls", "Martial Arts", "Motorcycling", "Motorsport", "Olympic Handball", "Orienteering", "Pitch & Putt", "Power Boating", "Racquetball", "Road Bowling", "Rounders", "Rowing", "Rugby League", "Rugby Union", "Sailing", "Scuba Diving", "Skateboarding/Skating", "Skiing/Snowboarding", "Snooker/Billiards", "Snorkelling", "Special Olympics", "Squash", "Surfing", "Swimming", "Table Tennis", "Taekwondo", "Tennis", "Tenpin Bowling", "Triathlon", "Tug of War", "Vision Sports", "Volleyball", "Walking", "Water Polo", "Waterskiing/Wakeboarding", "Weightlifting/Powerlifting", "Wheelchair Sport", "Windsurfing", "Wrestling", "Yoga/Pilates"],
  difficulties: ["Very Easy", "Easy", "Moderate", "Challenging", "Very Challenging"],
  formats: ["Linear", "Loop", "Out and Back"],
  trailTypes: ["Blueway", "Dinghy Sailing Trail", "Greenway", "Horse Riding Trail", "Long Distance Waymarked Way", "Mountain Access Trail", "Mountain Biking Trail", "Off Road Cycling Trail", "Paddling Trail", "Pilgrim Path", "Road Cycling Trail", "Snorkelling Trail", "Walking Trail"],
  facilities: ["Aero Sports Facility", "Angling/Fishing Site", "Archery Facility", "Athletics Track/Arena", "Basketball Court", "Bowling Facility", "Boxing Gym", "Climbing Facility", "Court (Racket Sports/Handball)", "Cycle Lane", "Cycling Facility", "Equestrian Facility", "Golf Course", "Gym/Fitness Studio", "Hall (Sports/Multi-Purpose)", "Handball Alley/Wall", "Ice Rink", "Lawn Games Facility", "Leisure Centre/Sports Complex", "Martial Arts Centre", "Motorsports Venue", "Multi Use Games Area", "Orienteering Course", "Outdoor Education & Training Centre", "Outdoor Gym", "Pier/Jetty", "Pitch (Artificial)", "Pitch (Grass)", "Pitch & Putt Course", "Playground/Play Area", "Ropes Course/Zipline", "Rowing Venue", "Sailing Venue", "Shooting Facility", "Skating Facility", "Snooker/Billiards Facility", "Sports Arena/Stadium", "Surfing Spot", "Swimming Pool/Aquatic Centre", "Swimming Spot (Sea/Lake/River)", "Table Tennis Facility", "Tennis Court", "Walking Track/Path", "Water Sports Venue", "Winter Sports Venue"],
  amenities: ["Baby Changing", "Bike Parking", "Bus Parking", "Cafe/Restaurant", "Car Parking", "Changing Facilities", "Childcare", "Defibrillator", "Dog Friendly", "EV Charging", "Internet Access", "Picnic Area", "Reception/Visitor Centre", "Showers", "Toilets"],
  accessibility: ["Accessible Changing Facilities", "Accessible Entry Points", "Accessible Parking", "Accessible Seating Points", "Accessible Toilets"],
};

const emptyAdvancedFilters = () => ({
  activities: [], disabilityCharter: false, under18: false, masters: false,
  difficulties: [], formats: [], trailTypes: [], dogsAllowed: false,
  minLength: "", maxLength: "", facilities: [], amenities: [], accessibility: [],
});

const listContainsAny = (field, values) => values.length
  ? `(${values.map(value => `${field} LIKE '%${String(value).replaceAll("'", "''")}%'`).join(" OR ")})`
  : null;

const buildAdvancedFilter = (layer, filters) => {
  const isTrailRouteLayer = /^trails$/i.test(layer.title || "");
  const trailParts = [
    filters.difficulties.length ? `Difficulty IN (${filters.difficulties.map(sqlString).join(", ")})` : null,
    filters.formats.length ? `Format IN (${filters.formats.map(sqlString).join(", ")})` : null,
    filters.trailTypes.length ? `TrailType IN (${filters.trailTypes.map(sqlString).join(", ")})` : null,
    filters.dogsAllowed ? "DogsAllowed = 'Yes'" : null,
    filters.minLength !== "" ? `LengthKm >= ${Number(filters.minLength) || 0}` : null,
    filters.maxLength !== "" ? `LengthKm <= ${Number(filters.maxLength) || 0}` : null,
  ].filter(Boolean);

  if (isTrailRouteLayer) return trailParts.length ? trailParts.join(" AND ") : "1 = 0";

  const clubParts = [
    listContainsAny("Activity", filters.activities),
    filters.disabilityCharter ? "DisabilityCharter = 'Yes'" : null,
    filters.under18 ? "Under18Membership = 'Yes'" : null,
    filters.masters ? "Masters = 'Yes'" : null,
  ].filter(Boolean);
  const locationParts = [
    listContainsAny("Facilities", filters.facilities),
    listContainsAny("Amenities", filters.amenities),
    listContainsAny("AccessibleFeatures", filters.accessibility),
  ].filter(Boolean);

  const sections = [];
  if (clubParts.length) sections.push(`(RecordType = 'Club' AND ${clubParts.join(" AND ")})`);
  if (trailParts.length) sections.push(`(RecordType = 'Trail' AND ${trailParts.join(" AND ")})`);
  if (locationParts.length) sections.push(`(RecordType = 'Activity Location' AND ${locationParts.join(" AND ")})`);
  return sections.length ? sections.join(" OR ") : null;
};

const buildLayerFilter = (layer, selections, advanced, advancedMode = false) => {
  if (advancedMode) return buildAdvancedFilter(layer, advanced);
  const definitions = selections.map(name => sqlFilters[name]).filter(Boolean);
  if (!definitions.length) return null;

  const isTrailRouteLayer = /^trails$/i.test(layer.title || "");
  const clauses = definitions.flatMap(definition => {
    if (isTrailRouteLayer) {
      return definition.kind === "trail"
        ? [`Activity IN (${definition.values.map(sqlString).join(", ")})`]
        : [];
    }
    if (definition.kind === "club") {
      return [`(RecordType = 'Club' AND Category LIKE '%${definition.value.replaceAll("'", "''")}%')`];
    }
    if (definition.kind === "trail") {
      return [`(RecordType = 'Trail' AND Activity IN (${definition.values.map(sqlString).join(", ")}))`];
    }
    return [`(RecordType = 'Activity Location' AND LocationType IN (${definition.values.map(sqlString).join(", ")}))`];
  });

  return clauses.length ? clauses.join(" OR ") : "1 = 0";
};

const fallbackResults = [
  { title: "12 O'Clock Hills Looped Walks", activity: "Walking", county: "Clare", group: "Trails to explore" },
  { title: "Phoenix Park Cycle Loop", activity: "Cycling", county: "Dublin", group: "Trails to explore" },
  { title: "Killarney National Park", activity: "Outdoor adventure", county: "Kerry", group: "Places to be active" },
  { title: "Salthill Promenade Swim", activity: "Open water swimming", county: "Galway", group: "Trails to explore" },
];

const fieldValue = (attrs, candidates) => {
  const key = Object.keys(attrs || {}).find(k => candidates.some(c => k.toLowerCase().includes(c)));
  return key ? attrs[key] : "";
};

function Header({ page }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return <header className="topbar">
    <a className="brand" href="#home" aria-label="Get Ireland Active home">
      <span className="brand-pin"><span /></span>
      <span><strong>Éirigh Gníomhach in Éirinn</strong><small>Get Ireland Active</small></span>
    </a>
    <nav className={menuOpen ? "open" : ""} onClick={() => setMenuOpen(false)}><a className={page === "home" ? "active" : ""} href="#home">Home</a><a className={page === "explore" ? "active" : ""} href="#explore">Explore map</a><a className={page === "about" ? "active" : ""} href="#about">About</a><a className={page === "info" ? "active" : ""} href="#info">More information</a></nav>
    <button className="menu" onClick={() => setMenuOpen(value => !value)} aria-expanded={menuOpen} aria-label={menuOpen ? "Close menu" : "Open menu"}>{menuOpen ? "×" : "☰"}</button>
  </header>;
}

function MultiFilter({ label, options, values, onChange }) {
  const toggle = value => onChange(values.includes(value) ? values.filter(item => item !== value) : [...values, value]);
  return <div className="advanced-field">
    <span className="advanced-label">{label}</span>
    <details>
      <summary>{values.length ? `${values.length} selected` : "Choose options"}<span>⌄</span></summary>
      <div className="advanced-menu">
        {options.map(option => <label key={option}><input type="checkbox" checked={values.includes(option)} onChange={() => toggle(option)} /><span>{option}</span></label>)}
      </div>
    </details>
  </div>;
}

function AdvancedFilters({ filters, setFilters, onBack, onClose }) {
  const set = (key, value) => setFilters(current => ({ ...current, [key]: value }));
  const activeCount = Object.values(filters).reduce((count, value) => {
    if (Array.isArray(value)) return count + value.length;
    if (typeof value === "boolean") return count + (value ? 1 : 0);
    return count + (value !== "" ? 1 : 0);
  }, 0);
  return <div className="advanced-view">
    <div className="advanced-top"><button onClick={onBack}>← Basic filters</button><button onClick={() => setFilters(emptyAdvancedFilters())} disabled={!activeCount}>Clear all</button><button className="advanced-mobile-close" onClick={onClose} aria-label="Close filters">×</button></div>
    <div className="panel-heading"><div><span>Refine results</span><h1>Advanced filters</h1></div></div>
    <section className="advanced-section"><h2>Clubs & groups</h2>
      <MultiFilter label="Sports & activities" options={advancedOptions.activities} values={filters.activities} onChange={value => set("activities", value)} />
      <span className="advanced-label">Membership</span>
      <div className="toggle-list">
        {[["disabilityCharter", "Sport Inclusion Disability Charter"], ["under18", "Accepts under 18s"], ["masters", "Masters / older adults"]].map(([key, label]) => <label key={key}><input type="checkbox" checked={filters[key]} onChange={event => set(key, event.target.checked)} /><span>{label}</span></label>)}
      </div>
    </section>
    <section className="advanced-section"><h2>Trails</h2>
      <MultiFilter label="Difficulty" options={advancedOptions.difficulties} values={filters.difficulties} onChange={value => set("difficulties", value)} />
      <MultiFilter label="Format" options={advancedOptions.formats} values={filters.formats} onChange={value => set("formats", value)} />
      <MultiFilter label="Trail type" options={advancedOptions.trailTypes} values={filters.trailTypes} onChange={value => set("trailTypes", value)} />
      <div className="toggle-list"><label><input type="checkbox" checked={filters.dogsAllowed} onChange={event => set("dogsAllowed", event.target.checked)} /><span>Dogs allowed</span></label></div>
      <span className="advanced-label">Length (km)</span>
      <div className="range-fields"><input type="number" min="0" placeholder="Min" value={filters.minLength} onChange={event => set("minLength", event.target.value)} /><span>to</span><input type="number" min="0" placeholder="Max" value={filters.maxLength} onChange={event => set("maxLength", event.target.value)} /></div>
    </section>
    <section className="advanced-section"><h2>Locations</h2>
      <MultiFilter label="Facilities" options={advancedOptions.facilities} values={filters.facilities} onChange={value => set("facilities", value)} />
      <MultiFilter label="Amenities" options={advancedOptions.amenities} values={filters.amenities} onChange={value => set("amenities", value)} />
      <MultiFilter label="Accessibility" options={advancedOptions.accessibility} values={filters.accessibility} onChange={value => set("accessibility", value)} />
    </section>
  </div>;
}

function Filters({ selected, onToggle, open, onClose, collapsed, onCollapse, advancedMode, setAdvancedMode, advanced, setAdvanced }) {
  return <aside className={`filters ${open ? "open" : ""} ${collapsed ? "collapsed" : ""}`}>
    <button className="panel-collapse left" onClick={onCollapse} aria-label={collapsed ? "Expand filters" : "Collapse filters"} title={collapsed ? "Expand filters" : "Collapse filters"}>{collapsed ? "›" : "‹"}</button>
    <div className="filter-inner">
    {advancedMode ? <AdvancedFilters filters={advanced} setFilters={setAdvanced} onBack={() => setAdvancedMode(false)} onClose={onClose} /> : <>
    <div className="panel-heading"><div><span>Discover</span><h1>Find your way to move</h1></div><button onClick={onClose} aria-label="Close filters">×</button></div>
    <p className="intro">Choose an activity, trail or place and start exploring what’s nearby.</p>
    {groups.map(group => <section className="filter-group" key={group.title} style={{"--accent": group.color}}>
      <h2><span>{group.icon}</span>{group.title}</h2>
      <div className="chip-grid">
        {group.items.map(([name, icon]) => <button key={name} className={selected.includes(name) ? "selected" : ""} onClick={() => onToggle(name)} aria-pressed={selected.includes(name)} title={name}>
          <span className="chip-icon">{icon}</span><span>{name}</span>
        </button>)}
      </div>
    </section>)}
    <button className="advanced" onClick={() => setAdvancedMode(true)}>Advanced filters <span>＋</span></button>
    </>}
    </div>
  </aside>;
}

function ResultCard({ item, onClick }) {
  return <button className="result-card" onClick={onClick}>
    {item.imageUrl
      ? <img className="result-image" src={item.imageUrl} alt="" loading="lazy" />
      : <span className="result-mark">{item.activity?.toLowerCase().includes("walk") ? "↟" : "●"}</span>}
    <span className="result-copy"><strong>{item.title}</strong><span>{item.activity || "Get active"} · {item.county || "Ireland"}</span></span>
    <span className="arrow">→</span>
  </button>;
}

function ExplorePage() {
  const mapRef = useRef(null);
  const searchRef = useRef(null);
  const layerViewsRef = useRef([]);
  const refreshVisibleResultsRef = useRef(() => {});
  const filterStateRef = useRef({ selected: [], advanced: emptyAdvancedFilters(), advancedMode: false });
  const [selected, setSelected] = useState([]);
  const [advanced, setAdvanced] = useState(emptyAdvancedFilters);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [results, setResults] = useState([]);
  const [resultsReady, setResultsReady] = useState(false);
  const [sortDirection, setSortDirection] = useState("asc");
  const [view, setView] = useState("map");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);
  const [resultsCollapsed, setResultsCollapsed] = useState(false);

  useEffect(() => {
    const mapEl = mapRef.current;
    if (!mapEl) return;
    let stationaryHandle;
    let queryGeneration = 0;
    const ready = async () => {
      try {
        await mapEl.viewOnReady();
        const layers = mapEl.map?.allLayers?.filter(layer => layer.type === "feature")?.toArray?.() || [];
        await Promise.all(layers.map(layer => layer.load().catch(() => null)));
        layerViewsRef.current = (await Promise.all(layers.map(async layer => {
          try {
            const layerView = await mapEl.whenLayerView(layer);
            return { layerView, layer };
          } catch { return null; }
        }))).filter(Boolean);

        const searchEl = searchRef.current;
        if (searchEl) {
          await searchEl.componentOnReady();
          searchEl.sources = layers.map(layer => {
            const preferredFields = ["Name", "Trail_Name", "Activity", "County", "Address", "EircodePostcode"];
            const layerFieldNames = new Map((layer.fields || []).map(field => [field.name.toLowerCase(), field.name]));
            const searchFields = preferredFields
              .map(name => layerFieldNames.get(name.toLowerCase()))
              .filter(Boolean);
            const displayField = searchFields[0] || layer.objectIdField;
            return {
              layer,
              name: layer.title,
              placeholder: `Search ${layer.title.toLowerCase()}`,
              searchFields: searchFields.length ? searchFields : [displayField],
              displayField,
              outFields: ["*"],
              exactMatch: false,
              suggestionsEnabled: true,
              minSuggestCharacters: 2,
              maxResults: 8,
              maxSuggestions: 8,
              zoomScale: 12000,
            };
          });
          searchEl.activeSourceIndex = -1;
        }

        const refreshVisibleResults = async () => {
          if (!mapEl.extent) return;
          const generation = ++queryGeneration;
          const batches = await Promise.all(layerViewsRef.current.map(async ({ layerView, layer }) => {
            try {
              const withinScaleRange = (!layer.minScale || mapEl.scale <= layer.minScale)
                && (!layer.maxScale || mapEl.scale >= layer.maxScale);
              if (!layer.visible || !withinScaleRange) return [];
              const outFields = [...new Set([
                layer.objectIdField,
                ...(layer.fields || [])
                .filter(field => /name|title|club|trail|activity|sport|type|category|county|local_authority|location/i.test(field.name))
                .map(field => field.name),
              ].filter(Boolean))];
              const response = await layer.queryFeatures({
                where: buildLayerFilter(layer, filterStateRef.current.selected, filterStateRef.current.advanced, filterStateRef.current.advancedMode) || "1=1",
                geometry: mapEl.extent,
                spatialRelationship: "intersects",
                outFields,
                returnGeometry: true,
                num: 250,
              });
              const objectIds = response.features
                .map(graphic => graphic.attributes?.[layer.objectIdField])
                .filter(value => value != null);
              let attachments = {};
              if (objectIds.length && layer.capabilities?.data?.supportsAttachment) {
                try {
                  attachments = await layer.queryAttachments({
                    objectIds,
                    attachmentTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
                  });
                } catch { /* Some public services disable attachment queries. */ }
              }
              return response.features.map(graphic => {
                const a = graphic.attributes || {};
                const firstImage = attachments[a[layer.objectIdField]]?.[0];
                return {
                  title: String(fieldValue(a, ["name", "title", "club", "trail"]) || layer.title || "Activity location"),
                  activity: String(fieldValue(a, ["activity", "sport", "type", "category"]) || layer.title || "Activity"),
                  county: String(fieldValue(a, ["county", "local_authority", "location"]) || "Ireland"),
                  layer: layer.title,
                  imageUrl: firstImage?.url || "",
                  graphic,
                };
              });
            } catch (error) {
              console.error(`Unable to load visible results for ${layer.title}`, error);
              return [];
            }
          }));
          if (generation === queryGeneration) {
            setResults(batches.flat());
            setResultsReady(true);
          }
        };

        refreshVisibleResultsRef.current = refreshVisibleResults;
        const reactiveUtils = await window.$arcgis.import("@arcgis/core/core/reactiveUtils.js");
        stationaryHandle = reactiveUtils.watch(
          () => mapEl.stationary,
          stationary => { if (stationary) refreshVisibleResults(); },
          { initial: true },
        );
      } catch { /* The map component displays its own load or service errors. */ }
    };
    mapEl.addEventListener("arcgisViewReadyChange", ready, { once: true });
    return () => {
      mapEl.removeEventListener("arcgisViewReadyChange", ready);
      stationaryHandle?.remove();
    };
  }, []);

  useEffect(() => {
    filterStateRef.current = { selected, advanced, advancedMode };
    layerViewsRef.current.forEach(({ layerView, layer }) => {
      const where = buildLayerFilter(layer, selected, advanced, advancedMode);
      if (!where) {
        layerView.filter = null;
        return;
      }
      layerView.filter = { where };
    });
    window.setTimeout(() => refreshVisibleResultsRef.current(), 0);
  }, [selected, advanced, advancedMode]);

  const shown = useMemo(() => {
    const source = resultsReady ? results : fallbackResults;
    return [...source]
      .sort((a, b) => a.title.localeCompare(b.title, "en", { sensitivity: "base", numeric: true }) * (sortDirection === "asc" ? 1 : -1))
      .slice(0, 50);
  }, [results, resultsReady, sortDirection]);

  const selectResult = async item => {
    if (!item.graphic || !mapRef.current) return;
    await mapRef.current.goTo({ target: item.graphic.geometry, zoom: 14 });
    mapRef.current.openPopup({ features: [item.graphic], location: item.graphic.geometry });
    setView("map");
  };

  return <main className={filtersCollapsed ? "left-collapsed" : ""}>
      <Filters selected={selected} onToggle={name => setSelected(values => values.includes(name) ? values.filter(value => value !== name) : [...values, name])} open={filtersOpen} onClose={() => setFiltersOpen(false)} collapsed={filtersCollapsed} onCollapse={() => setFiltersCollapsed(value => !value)} advancedMode={advancedMode} setAdvancedMode={setAdvancedMode} advanced={advanced} setAdvanced={setAdvanced} />
      <section className="workspace">
        <div className="toolbar">
          <button className="filter-trigger" onClick={() => setFiltersOpen(true)}>☷ Filters</button>
          <div className="tabs"><button className={view === "map" ? "active" : ""} onClick={() => setView("map")}>Map</button><button className={view === "list" ? "active" : ""} onClick={() => setView("list")}>List</button></div>
          <div className="search-component">
            <arcgis-search
              ref={searchRef}
              reference-element="activity-map"
              all-placeholder="Search addresses, clubs or trails"
              active-source-index="-1"
              max-results="8"
              max-suggestions="8"
            ></arcgis-search>
          </div>
        </div>
        {!advancedMode && !!selected.length && <div className="active-filter">
          <div className="active-filter-list">{selected.map(name => <button key={name} onClick={() => setSelected(values => values.filter(value => value !== name))}>{name} <span>×</span></button>)}</div>
          <button className="clear-filters" onClick={() => setSelected([])}>Clear all</button>
        </div>}
        {advancedMode && buildAdvancedFilter({ title: "All Data" }, advanced) && <div className="active-filter"><span>Advanced filters applied</span><button className="clear-filters" onClick={() => setAdvanced(emptyAdvancedFilters())}>Clear all</button></div>}
        <div className={`content ${view === "list" ? "list-mode" : ""} ${resultsCollapsed ? "results-collapsed" : ""}`}>
          <div className="map-wrap">
            <arcgis-map id="activity-map" ref={mapRef} item-id={WEBMAP_ID} portal-url={PORTAL_URL} popup-component-enabled="true">
              <arcgis-zoom slot="top-left"></arcgis-zoom>
              <arcgis-home slot="top-left"></arcgis-home>
              <arcgis-locate slot="top-left"></arcgis-locate>
              <arcgis-expand slot="bottom-left" expand-tooltip="Legend"><arcgis-legend></arcgis-legend></arcgis-expand>
              <arcgis-expand slot="bottom-left" expand-tooltip="Layers"><arcgis-layer-list></arcgis-layer-list></arcgis-expand>
            </arcgis-map>
          </div>
          <aside className="results">
            <button className="panel-collapse right" onClick={() => setResultsCollapsed(value => !value)} aria-label={resultsCollapsed ? "Expand results" : "Collapse results"} title={resultsCollapsed ? "Expand results" : "Collapse results"}>{resultsCollapsed ? "‹" : "›"}</button>
            <div className="results-inner">
              <div className="results-head"><div><span>Explore Ireland</span><h2>{shown.length} places to get active</h2></div><button className="sort-button" onClick={() => setSortDirection(direction => direction === "asc" ? "desc" : "asc")} aria-label={sortDirection === "asc" ? "Sort results Z to A" : "Sort results A to Z"} title={sortDirection === "asc" ? "Currently A–Z. Sort Z–A" : "Currently Z–A. Sort A–Z"}><span>{sortDirection === "asc" ? "A" : "Z"}</span><b>↓</b><span>{sortDirection === "asc" ? "Z" : "A"}</span></button></div>
              <div className="cards">{shown.map((item, i) => <ResultCard key={`${item.title}-${i}`} item={item} onClick={() => selectResult(item)} />)}{!shown.length && <div className="empty"><b>No exact matches</b><span>Try clearing a filter or using a broader search.</span></div>}</div>
            </div>
          </aside>
        </div>
      </section>
  </main>;
}

const themes = [
  ["Accessible Activities", "Explore inclusive options for all ages and abilities.", "https://getirelandactive.ie/cdn/7/resources/images/widget_1854/1684739269890.jpeg"],
  ["Family Friendly", "Trails and venues with family-friendly features.", "https://getirelandactive.ie/cdn/7/resources/images/widget_1873/1684739333018.png"],
  ["Walking", "Where to enjoy Ireland's most popular physical activity.", "https://getirelandactive.ie/cdn/7/resources/images/widget_1881/1684739506625.jpeg"],
  ["Get Outdoors", "Outdoor clubs, trails and locations.", "https://getirelandactive.ie/cdn/7/resources/images/widget_1864/1684739575544.jpeg"],
  ["Dog Friendly", "Trails and places where dogs are welcome.", "https://getirelandactive.ie/cdn/7/resources/images/widget_1868/1684739630216.png"],
  ["Work Out", "Gyms, leisure centres and swimming pools.", "https://getirelandactive.ie/cdn/7/resources/images/widget_1877/1684739691099.JPG"],
];

function HomePage() {
  return <main className="site-page home-page">
    <section className="home-hero">
      <img src="https://getirelandactive.ie/cdn/7/resources/images/widget_3143/1751013467846.png" alt="Two parents and two small children running along a trail path in a forest" />
      <div className="home-hero-copy"><span>Get Ireland Active</span><h1>Get active your way.</h1><p>Ireland is an island full of sport, recreation and adventure. With Get Ireland Active, discovering where is made easy. Explore thousands of opportunities, from casual to competitive, and find what suits you best.</p><p>Take control of your own activity journey. Explore trails, clubs, facilities and public places across the country—all in one place.</p><a className="primary-link" href="#explore">Explore the map <b>→</b></a></div>
    </section>
    <section className="home-intro"><span>Find your next activity</span><h2>Whatever your level, wherever you are</h2><p>Find an activity that works for you and where you can do it. Search and filter thousands of trails, clubs and places to be active.</p><a className="primary-link" href="#explore">Find activities <b>→</b></a></section>
    <section className="themes-section"><span>Explore by theme</span><h2>More ways to get moving</h2><div className="theme-grid">{themes.map(([title, description, image]) => <a href="#explore" className="theme-card" key={title}><img src={image} alt="" loading="lazy" /><div><h3>{title}</h3><p>{description}</p><b>Explore →</b></div></a>)}</div></section>
    <section className="involved"><div><span>Get involved</span><h2>Help shape Get Ireland Active</h2><p>Share feedback on the website and mobile app, and help us make it easier for everyone to find ways to move.</p><a href="https://survey123.arcgis.com/share/4511b13d3cd24ec2851f5c76c25ecddf" target="_blank" rel="noreferrer" className="light-link">Give feedback →</a></div><div><span>Download the app</span><h2>Find activities wherever you go</h2><div className="store-links"><a href="https://play.google.com/store/apps/details?id=ie.getirelandactive.android.app" target="_blank" rel="noreferrer">Google Play</a><a href="https://apps.apple.com/us/app/get-ireland-active/id6738063005" target="_blank" rel="noreferrer">App Store</a></div></div></section>
  </main>;
}

function AboutPage() {
  return <main className="site-page about-page">
    <section className="page-hero"><span>About</span><h1>One national hub for getting active</h1><p>Get Ireland Active has been built to give people control of their own activity journey—to help find the right activity, in the right place, at the right time and at the right level.</p></section>
    <section className="about-video-section">
      <div className="about-video-heading"><span>Get Ireland Active</span><h2>Get Ireland Active is now live</h2><p>Discover the national database for finding clubs, trails, amenities and more.</p></div>
      <div className="video-frame"><iframe title="Get Ireland Active is now live" src="https://www.youtube-nocookie.com/embed/g-6TYFt1-kQ" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /></div>
    </section>
    <section className="about-grid"><div><h2>Get Ireland Active</h2><p>The Get Ireland Active National Database is Ireland’s interactive activity, sport and recreation hub. It brings together resources from Government, Sport Ireland, local authorities, state agencies and national governing bodies of sport.</p><p>The easy-to-use interactive website unlocks opportunities on your doorstep and connects everyone who wants to move with the resources that can help them begin, improve or supercharge their activity journey.</p><a className="primary-link" href="#explore">Explore the map <b>→</b></a></div><aside><h3>The database includes</h3><ul><li>Sport and recreation</li><li>Public places</li><li>Trails</li><li>Amenities and information</li></ul></aside></section>
    <section className="aims"><span>Our national ambition</span><h2>Better information for healthier communities</h2><p>Get Ireland Active also improves how sport and recreational facilities are planned and managed, providing richer insights for future investment and evidence-based decisions.</p><div className="aim-grid">{["Improve lives across Ireland", "Promote higher physical activity", "Improve health and wellbeing", "Provide facilities where needed", "Transform planning and funding", "Strengthen stakeholder collaboration"].map((aim, index) => <div key={aim}><b>{String(index + 1).padStart(2, "0")}</b><span>{aim}</span></div>)}</div></section>
    <section className="about-video-section stakeholder-video">
      <div className="about-video-heading"><span>Working together</span><h2>Get Ireland Active stakeholders</h2><p>See how national and local partners are working together to support active communities throughout Ireland.</p></div>
      <div className="video-frame"><iframe title="Get Ireland Active stakeholders" src="https://player.vimeo.com/video/896120727?dnt=1" loading="lazy" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen /></div>
    </section>
  </main>;
}

function MoreInfoPage() {
  return <main className="story-page"><iframe title="Get Ireland Active More Information" src="https://storymaps.arcgis.com/collections/8065e0fe0dd04ec4a3bf6eb38585ee6a" allow="fullscreen" /></main>;
}

const pageFromHash = () => {
  const page = window.location.hash.replace("#", "");
  return ["home", "explore", "about", "info"].includes(page) ? page : "home";
};

export default function App() {
  const [page, setPage] = useState(pageFromHash);
  useEffect(() => {
    const updatePage = () => setPage(pageFromHash());
    window.addEventListener("hashchange", updatePage);
    return () => window.removeEventListener("hashchange", updatePage);
  }, []);

  return <div className={`app-shell ${page !== "explore" ? "content-page-shell" : ""}`}>
    <Header page={page} />
    {page === "home" && <HomePage />}
    {page === "explore" && <ExplorePage />}
    {page === "about" && <AboutPage />}
    {page === "info" && <MoreInfoPage />}
  </div>;
}
