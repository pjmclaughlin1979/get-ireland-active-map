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

const buildLayerFilter = (layer, selections) => {
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

function Header() {
  return <header className="topbar">
    <a className="brand" href="#" aria-label="Get Ireland Active home">
      <span className="brand-pin"><span /></span>
      <span><strong>Éirigh Gníomhach in Éirinn</strong><small>Get Ireland Active</small></span>
    </a>
    <nav><a href="#">Home</a><a className="active" href="#explore">Explore map</a><a href="#about">About</a><a href="#info">More information</a></nav>
    <button className="menu" aria-label="Open menu">☰</button>
  </header>;
}

function Filters({ selected, onToggle, open, onClose, collapsed, onCollapse }) {
  return <aside className={`filters ${open ? "open" : ""} ${collapsed ? "collapsed" : ""}`}>
    <button className="panel-collapse left" onClick={onCollapse} aria-label={collapsed ? "Expand filters" : "Collapse filters"} title={collapsed ? "Expand filters" : "Collapse filters"}>{collapsed ? "›" : "‹"}</button>
    <div className="filter-inner">
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
    <button className="advanced">Advanced filters <span>＋</span></button>
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

export default function App() {
  const mapRef = useRef(null);
  const searchRef = useRef(null);
  const layerViewsRef = useRef([]);
  const refreshVisibleResultsRef = useRef(() => {});
  const selectedRef = useRef([]);
  const [selected, setSelected] = useState([]);
  const [results, setResults] = useState([]);
  const [resultsReady, setResultsReady] = useState(false);
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
                where: buildLayerFilter(layer, selectedRef.current) || "1=1",
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
    selectedRef.current = selected;
    layerViewsRef.current.forEach(({ layerView, layer }) => {
      if (!selected.length) {
        layerView.filter = null;
        return;
      }
      layerView.filter = { where: buildLayerFilter(layer, selected) };
    });
    window.setTimeout(() => refreshVisibleResultsRef.current(), 0);
  }, [selected]);

  const shown = useMemo(() => {
    const source = resultsReady ? results : fallbackResults;
    return source.slice(0, 50);
  }, [results, resultsReady]);

  const selectResult = async item => {
    if (!item.graphic || !mapRef.current) return;
    await mapRef.current.goTo({ target: item.graphic.geometry, zoom: 14 });
    mapRef.current.openPopup({ features: [item.graphic], location: item.graphic.geometry });
    setView("map");
  };

  return <div className="app-shell">
    <Header />
    <main className={filtersCollapsed ? "left-collapsed" : ""}>
      <Filters selected={selected} onToggle={name => setSelected(values => values.includes(name) ? values.filter(value => value !== name) : [...values, name])} open={filtersOpen} onClose={() => setFiltersOpen(false)} collapsed={filtersCollapsed} onCollapse={() => setFiltersCollapsed(value => !value)} />
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
        {!!selected.length && <div className="active-filter">
          <div className="active-filter-list">{selected.map(name => <button key={name} onClick={() => setSelected(values => values.filter(value => value !== name))}>{name} <span>×</span></button>)}</div>
          <button className="clear-filters" onClick={() => setSelected([])}>Clear all</button>
        </div>}
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
              <div className="results-head"><div><span>Explore Ireland</span><h2>{shown.length} places to get active</h2></div><button aria-label="Sort results">↕</button></div>
              <div className="cards">{shown.map((item, i) => <ResultCard key={`${item.title}-${i}`} item={item} onClick={() => selectResult(item)} />)}{!shown.length && <div className="empty"><b>No exact matches</b><span>Try clearing a filter or using a broader search.</span></div>}</div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  </div>;
}
