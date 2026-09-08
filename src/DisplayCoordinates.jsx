import { useEffect, useRef, useState } from "react";
import { systems, toGrid, fromGrid, parseCoordinates } from "./coordinates.js";

export default function DisplayCoordinates({ mapRef }) {
  const expandRef = useRef(null);
  const runtime = useRef(null);
  const capture = useRef({ open:false, live:true, wkid:29902 });
  const selectedPoint = useRef(null);
  const [wkid, setWkid] = useState(29902);
  const [live, setLive] = useState(true);
  const [xy, setXY] = useState({ x:"", y:"" });
  const [grid, setGrid] = useState("");
  const [status, setStatus] = useState("Loading coordinate tools…");
  const [ready, setReady] = useState(false);
  const system = systems.find(item => item.wkid === wkid);
  const setLiveMode = value => { capture.current.live = value; setLive(value); };
  const display = point => {
    const api = runtime.current;
    const config = systems.find(item => item.wkid === capture.current.wkid);
    const projected = api.project.execute(point, new api.SpatialReference({ wkid:config.wkid }));
    if (!projected || !Number.isFinite(projected.x) || !Number.isFinite(projected.y)) throw new Error("This location cannot be converted to the selected coordinate system.");
    selectedPoint.current = point;
    setXY({ x:projected.x.toFixed(config.places), y:projected.y.toFixed(config.places) });
    setGrid(config.grid ? toGrid(projected.x, projected.y) : "");
    setStatus("");
  };
  const pin = point => {
    const api = runtime.current;
    api.marker.geometry = point;
    if (!api.view.graphics.includes(api.marker)) api.view.graphics.add(api.marker);
  };
  useEffect(() => {
    let disposed = false;
    const handles = [];
    const expand = expandRef.current;
    const onExpanded = () => { capture.current.open = expand.expanded; };
    expand.addEventListener("arcgisPropertyChange", onExpanded);
    (async () => {
      try {
        await customElements.whenDefined("arcgis-map");
        await mapRef.current.viewOnReady();
        const [Point, SpatialReference, Graphic, project] = await Promise.all([
          "@arcgis/core/geometry/Point.js", "@arcgis/core/geometry/SpatialReference.js",
          "@arcgis/core/Graphic.js", "@arcgis/core/geometry/operators/projectOperator.js",
        ].map(path => window.$arcgis.import(path)));
        await project.load();
        if (disposed) return;
        const view = mapRef.current.view;
        const marker = new Graphic({ symbol:{ type:"simple-marker", style:"cross", size:18, color:"#126c59", outline:{ color:"#126c59", width:3 } } });
        runtime.current = { Point, SpatialReference, project, view, marker };
        handles.push(view.on("pointer-move", event => {
          if (!capture.current.open || !capture.current.live) return;
          const point = view.toMap({ x:event.x, y:event.y });
          if (point) { try { display(point); } catch (error) { setStatus(error.message); } }
        }));
        handles.push(view.on("immediate-click", event => {
          if (!capture.current.open) return;
          event.stopPropagation();
          if (!event.mapPoint) return;
          try { display(event.mapPoint); pin(event.mapPoint); setLiveMode(false); } catch (error) { setStatus(error.message); }
        }));
        handles.push(view.on("click", event => {
          if (capture.current.open) event.stopPropagation();
        }));
        setReady(true);
        setStatus("");
      } catch { if (!disposed) setStatus("Coordinate tools could not load. Reload the page to try again."); }
    })();
    return () => {
      disposed = true;
      expand.removeEventListener("arcgisPropertyChange", onExpanded);
      handles.forEach(handle => handle.remove());
      const api = runtime.current;
      if (api) api.view.graphics.remove(api.marker);
      runtime.current = null;
    };
  }, [mapRef]);
  const locate = async event => {
    event.preventDefault();
    try {
      const api = runtime.current;
      const values = parseCoordinates(xy.x, xy.y, wkid);
      const point = new api.Point({ ...values, spatialReference:{ wkid } });
      const target = api.project.execute(point, api.view.spatialReference);
      if (!target || !Number.isFinite(target.x) || !Number.isFinite(target.y)) throw new Error("These coordinates cannot be displayed on the map.");
      setLiveMode(false);
      display(point);
      pin(target);
      await api.view.goTo({ target, scale:5000 });
    } catch (error) { if (error.name !== "AbortError") setStatus(error.message); }
  };
  return <arcgis-expand ref={expandRef} slot="bottom-left" mode="floating" expand-icon="map-pin" expand-tooltip="Display coordinates" collapse-tooltip="Hide coordinates">
    <section className="coordinate-panel" aria-label="Display coordinates">
      <h2>Display coordinates</h2>
      <p>Move over the map for live coordinates. Click to pin a location, or enter coordinates and select Locate.</p>
      <form onSubmit={locate}>
        <label>Coordinate system<select value={wkid} disabled={!ready} onChange={event => {
          const next = Number(event.target.value);
          capture.current.wkid = next; setWkid(next);
          if (selectedPoint.current) { try { display(selectedPoint.current); } catch (error) { setStatus(error.message); } }
          else { setXY({ x:"", y:"" }); setGrid(""); }
        }}>{systems.map(item => <option key={item.wkid} value={item.wkid}>{item.label}</option>)}</select></label>
        <label>{wkid === 4326 ? "Longitude (°)" : "Easting (m)"}<input value={xy.x} disabled={!ready} inputMode="decimal" onFocus={() => setLiveMode(false)} onChange={event => { setXY(value => ({ ...value, x:event.target.value })); setGrid(""); selectedPoint.current = null; }} /></label>
        <label>{wkid === 4326 ? "Latitude (°)" : "Northing (m)"}<input value={xy.y} disabled={!ready} inputMode="decimal" onFocus={() => setLiveMode(false)} onChange={event => { setXY(value => ({ ...value, y:event.target.value })); setGrid(""); selectedPoint.current = null; }} /></label>
        {system.grid && <label>Irish grid reference<input value={grid} disabled={!ready} placeholder="J 33800 74000" onFocus={() => setLiveMode(false)} onChange={event => {
          setGrid(event.target.value); selectedPoint.current = null;
          try { const point = fromGrid(event.target.value); setXY({ x:String(point.x), y:String(point.y) }); setStatus(""); }
          catch (error) { setXY({ x:"", y:"" }); setStatus(error.message); }
        }} /></label>}
        <label className="coordinate-live"><input type="checkbox" checked={live} disabled={!ready} onChange={event => setLiveMode(event.target.checked)} />Live capture</label>
        <div className="coordinate-actions"><button type="submit" disabled={!ready || !xy.x || !xy.y}>Locate</button><button type="button" disabled={!ready} onClick={() => {
          setLiveMode(false); setXY({ x:"", y:"" }); setGrid(""); setStatus(""); selectedPoint.current = null;
          const api = runtime.current; api.view.graphics.remove(api.marker);
        }}>Clear</button></div>
        <button className="coordinate-copy" type="button" disabled={!ready || !xy.x || !xy.y} onClick={async () => {
          try {
            parseCoordinates(xy.x, xy.y, wkid);
            await navigator.clipboard.writeText(`${system.label}: ${xy.x}, ${xy.y}${grid ? ` (${grid})` : ""}`);
            setStatus("Coordinates copied.");
          } catch { setStatus("Unable to copy. Select the coordinate values and copy them manually."); }
        }}>Copy coordinates</button>
      </form>
      <div className="coordinate-status" role="status">{status}</div>
    </section>
  </arcgis-expand>;
}
