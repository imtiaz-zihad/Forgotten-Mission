import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { objects, MAPS, LIFESPAN, plotLon } from "./data.js";

gsap.registerPlugin(ScrollTrigger);
const calm = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const lonTxt = (o) => (o.body === "mars" ? `${o.lon.toFixed(3)}°E` : `${Math.abs(o.lon).toFixed(3)}°${o.lon < 0 ? "W" : "E"}`);
const latTxt = (o) => `${Math.abs(o.lat).toFixed(3)}°${o.lat < 0 ? "S" : "N"}`;

function Clip({ src, poster }) {
  const v = useRef();
  useEffect(() => {
    if (calm()) return;
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? v.current.play().catch(() => {}) : v.current.pause()), { threshold: 0.4 });
    io.observe(v.current);
    return () => io.disconnect();
  }, []);
  return <video ref={v} className="photo" src={src} poster={poster} muted loop playsInline preload="metadata" aria-label="NASA footage" />;
}

function Chapter({ o, n, first, open }) {
  const root = useRef();
  const x = (plotLon(o) + 180) / 360, y = (90 - o.lat) / 180;
  useEffect(() => {
    if (calm()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(".zoom", { scale: 1 }, { scale: 1.25, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true } });
      gsap.from(".bubble", { opacity: 0, y: 40, duration: 0.8, scrollTrigger: { trigger: root.current, start: "top 55%" } });
      if (root.current.querySelector(".meter")) gsap.from(".meter b", { width: 0, duration: 1.4, stagger: 0.4, scrollTrigger: { trigger: ".meter", start: "top 90%" } });
    }, root);
    return () => ctx.revert();
  }, []);
  return (
    <section className="chapter" id={`ch-${o.id}`} ref={root}>
      {first && <p className="body-label">{o.body === "moon" ? "The Moon" : "Mars"}</p>}
      <h2>Chapter {n}: {o.mission}<small>{o.name}</small></h2>
      <div className="scene">
        <div className="zoom">
          {o.video ? <Clip src={o.video} poster={o.photo} /> : o.photo ? <img className="photo" src={o.photo} alt={o.name} />
            : <img className="terr" src={MAPS[o.body].url} alt="" style={{ "--x": x, "--y": y }} />}
        </div>
        {!o.photo && !o.video && <span className="pin" />}
        {(o.photo || o.video) && <small className="pcred">{o.video ? "Video" : "Photo"}: NASA Image Library ({o.videoId || o.photoId})</small>}
        <div className="bubble"><p>{o.story}</p></div>
        <button className="guide" onClick={() => open(o)}><span>🛰️</span> Click here for more information!</button>
      </div>
      <Meter id={o.id} />
      <div className="actions"><button onClick={() => window.dispatchEvent(new CustomEvent("flyto", { detail: o.id }))}>Show on map ↓</button></div>
    </section>
  );
}

function Meter({ id }) {
  const m = LIFESPAN[id];
  if (!m) return null;
  return (
    <div className="meter" role="img" aria-label={`Built to last ${m.planned} ${m.unit}, actually lasted ${m.actual} ${m.unit}`}>
      <div className="row"><span>Built to last</span><i><b className="plan" style={{ width: `${Math.max(2, (m.planned / m.actual) * 100)}%` }} /></i><em>{m.planned} {m.unit}</em></div>
      <div className="row"><span>Actually lasted</span><i><b className="act" style={{ width: "100%" }} /></i><em>{m.actual} {m.unit}</em></div>
    </div>
  );
}

function Rail() {
  const [on, setOn] = useState(objects[0].id), [p, setP] = useState(0);
  useEffect(() => {
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setOn(e.target.id.slice(3))), { threshold: 0.3 });
    document.querySelectorAll(".chapter").forEach((c) => io.observe(c));
    const sc = () => setP(window.scrollY / Math.max(1, document.documentElement.scrollHeight - window.innerHeight));
    window.addEventListener("scroll", sc, { passive: true });
    return () => { io.disconnect(); window.removeEventListener("scroll", sc); };
  }, []);
  return (
    <>
      <div className="bar" style={{ transform: `scaleX(${p})` }} />
      <nav className="rail" aria-label="Chapters">
        {objects.map((o, i) => <a key={o.id} href={`#ch-${o.id}`} className={on === o.id ? "on" : ""} title={`${i + 1}. ${o.mission}: ${o.name}`} aria-label={`Chapter ${i + 1}: ${o.mission}`} />)}
      </nav>
    </>
  );
}

function Log({ o, close }) {
  if (!o) return null;
  const read = () => { close(); setTimeout(() => document.getElementById(`ch-${o.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 60); };
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label="NASA data" onClick={close}>
      <div className="card" onClick={(e) => e.stopPropagation()}>
        <h3>NASA Data 🚀</h3>
        <h4>{o.mission}: {o.name}</h4>
        <dl>
          <dt>Location</dt><dd>{latTxt(o)}, {lonTxt(o)} (approx.)</dd>
          <dt>Left behind</dt><dd>{o.left}</dd>
          <dt>Last contact</dt><dd>{o.last}</dd>
        </dl>
        <p>{o.science}</p>
        <audio controls src={`/audio/${o.id}.mp3`} onError={(e) => (e.currentTarget.style.display = "none")} />
        <p className="cite">Source: <a href={o.src} target="_blank" rel="noreferrer">{o.dataset}</a></p>
        <button onClick={close}>Close and Continue Story</button>
        <button className="alt" onClick={read}>Read this chapter</button>
      </div>
    </div>
  );
}

function MapExplorer({ open }) {
  const [body, setBody] = useState("moon");
  const el = useRef(), map = useRef(), layer = useRef(), base = useRef(), pend = useRef(), cur = useRef("moon");
  const fly = (o) => map.current.flyTo([o.lat, plotLon(o)], 3, { duration: calm() ? 0 : 1.5 });
  useEffect(() => {
    const go = (e) => {
      const o = objects.find((x) => x.id === e.detail);
      el.current.scrollIntoView({ behavior: calm() ? "auto" : "smooth", block: "center" });
      if (o.body === cur.current) fly(o); else { pend.current = o; setBody(o.body); }
    };
    window.addEventListener("flyto", go);
    return () => window.removeEventListener("flyto", go);
  }, []);
  useEffect(() => {
    const m = L.map(el.current, { crs: L.CRS.EPSG4326, minZoom: 0, maxZoom: 4, zoomSnap: 0.5, maxBounds: [[-90, -180], [90, 180]] }).setView([0, 0], 1);
    m.createPane("base").style.zIndex = 250;
    layer.current = L.layerGroup().addTo(m);
    map.current = m;
    return () => m.remove();
  }, []);
  useEffect(() => {
    base.current?.remove();
    base.current = L.imageOverlay(MAPS[body].url, [[-90, -180], [90, 180]], { pane: "base" }).addTo(map.current);
    layer.current.clearLayers();
    objects.filter((o) => o.body === body).forEach((o) =>
      L.circleMarker([o.lat, plotLon(o)], { radius: 10, color: "#f7e1a0", weight: 2, fillColor: "#ff8a3d", fillOpacity: 0.9 })
        .bindTooltip(o.name).on("click", () => open(o)).addTo(layer.current));
    cur.current = body;
    if (pend.current) { fly(pend.current); pend.current = null; }
  }, [body]);
  return (
    <section className="explore">
      <h2>Explore every site</h2>
      <nav>
        {["moon", "mars"].map((b) => <button key={b} aria-pressed={body === b} onClick={() => setBody(b)}>{b === "moon" ? "Moon" : "Mars"}</button>)}
      </nav>
      <div className="map" ref={el} />
    </section>
  );
}

export default function App() {
  const [sel, setSel] = useState(null);
  useEffect(() => {
    const k = (e) => e.key === "Escape" && setSel(null);
    window.addEventListener("keydown", k);
    if (!calm()) gsap.from(".finale p", { opacity: 0, y: 30, stagger: 0.6, duration: 1, scrollTrigger: { trigger: ".finale", start: "top 60%" } });
    return () => window.removeEventListener("keydown", k);
  }, []);
  return (
    <>
      <Rail />
      <section className="hero">
        <h1>Forgotten Missions</h1>
        <p>The machines were left behind. Their stories weren't.</p>
        <span className="hint">Scroll to begin ↓</span>
      </section>
      {objects.map((o, i) => <Chapter key={o.id} o={o} n={i + 1} first={i === 0 || objects[i - 1].body !== o.body} open={setSel} />)}
      <section className="finale"><p>A story</p><p>The machines were left behind</p><p>Their stories weren't</p></section>
      <MapExplorer open={setSel} />
      <footer>Maps: NASA SVS CGI Moon Kit (LRO); NASA/USGS Viking color map. Facts: NASA NSSDCA and PDS. Built with AI assistance (see docs/AI_USE.md).</footer>
      <Log o={sel} close={() => setSel(null)} />
    </>
  );
}