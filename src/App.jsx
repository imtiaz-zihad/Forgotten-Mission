import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { objects, MAPS, LIFESPAN, plotLon } from "./data.js";
import { LEARN } from "./learn.js";

gsap.registerPlugin(ScrollTrigger);
const calm = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const SILENT = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";
const narr = new Audio();
let soundOn = true, curId = null, blockedId = null;
const block = (id) => { blockedId = id; };
const playNarration = (id) => { curId = id; if (!soundOn) return; narr.src = `/audio/${id}.mp3`; narr.play().catch(() => block(id)); };
const stopNarration = (id) => { if (curId === id) { curId = null; blockedId = null; narr.pause(); window.speechSynthesis?.cancel(); } };
const resumeBlocked = () => { const id = blockedId; blockedId = null; if (id && soundOn && curId === id) playNarration(id); };
const setSound = (on) => { soundOn = on; if (!on) { narr.pause(); window.speechSynthesis?.cancel(); } else if (curId) playNarration(curId); };
const unlock = () => { narr.src = SILENT; narr.play().catch(() => {}); };
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
    const b = root.current.querySelector(".bubble");
    if (calm()) { gsap.set(b, { opacity: 1, y: 0 }); return; }
    const show = () => { gsap.to(b, { opacity: 1, y: 0, duration: 1.4, ease: "power2.out" }); playNarration(o.id); };
    const hide = () => { gsap.to(b, { opacity: 0, y: 40, duration: 0.4 }); stopNarration(o.id); };
    const ctx = gsap.context(() => {
      gsap.fromTo(".zoom", { scale: 1 }, { scale: 1.25, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true } });
      ScrollTrigger.create({ trigger: ".scene", start: "top 18%", end: "+=70%", pin: window.innerWidth > 800, anticipatePin: 1,
        onUpdate: (self) => (self.progress > 0.2 ? show() : hide()), onLeave: hide, onLeaveBack: hide });
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
      <div className="actions"><button onClick={() => open(o)}>Learn more</button><button onClick={() => window.dispatchEvent(new CustomEvent("flyto", { detail: o.id }))}>Show on map ↓</button></div>
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
  useEffect(() => () => window.speechSynthesis?.cancel(), [o]);
  if (!o) return null;
  const info = LEARN[o.id];
  const read = () => { close(); setTimeout(() => document.getElementById(`ch-${o.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 60); };
  const say = () => {
    const ss = window.speechSynthesis;
    if (!ss) return;
    narr.pause(); ss.cancel();
    const t = [`${o.mission}. ${o.name}.`, `Why was it built? ${info.why}`, `What did it find? ${info.found.join(" ")}`,
      `Timeline. ${info.time.map(([d, e]) => `${d}: ${e}.`).join(" ")}`, `What happened to it? ${info.after}`].join(" ");
    const u = new SpeechSynthesisUtterance(t); u.lang = "en-US"; u.rate = 0.95; ss.speak(u);
  };
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label="Learn more" onClick={close}>
      <div className="card" onClick={(e) => e.stopPropagation()}>
        <h3>Learn more 🚀</h3>
        <h4>{o.mission}: {o.name}</h4>
        {info && <button className="say" onClick={say}>🔊 Read this to me</button>}
        {info && (
          <>
            <h5>🎯 Why was it built?</h5><p>{info.why}</p>
            <h5>🔎 What did it find?</h5><ul>{info.found.map((f) => <li key={f}>{f}</li>)}</ul>
            <h5>🗓 Timeline</h5><ol className="tl">{info.time.map(([d, e]) => <li key={d + e}><b>{d}</b>{e}</li>)}</ol>
            <h5>🛰 What happened to it?</h5><p>{info.after}</p>
          </>
        )}
        <h5>📍 Where is it?</h5>
        <dl>
          <dt>Location</dt><dd>{latTxt(o)}, {lonTxt(o)} (approx.)</dd>
          <dt>Left behind</dt><dd>{o.left}</dd>
          <dt>Last contact</dt><dd>{o.last}</dd>
        </dl>
        <audio controls onPlay={() => narr.pause()} src={`/audio/${o.id}.mp3`} onError={(e) => (e.currentTarget.style.display = "none")} />
        <p className="cite">Source: <a href={o.src} target="_blank" rel="noreferrer">{o.dataset}</a> and NASA mission pages</p>
        <button onClick={close}>Close and Continue Story</button>
        <button className="alt" onClick={read}>Read this chapter</button>
      </div>
    </div>
  );
}

function MapExplorer({ open }) {
  const [body, setBody] = useState("moon");
  const [year, setYear] = useState(2020);
  const [act, setAct] = useState(null);
  const el = useRef(), map = useRef(), layer = useRef(), base = useRef(), marks = useRef({}), pend = useRef(), cur = useRef("moon");
  const list = objects.filter((o) => o.body === body && +o.left.slice(0, 4) <= year);
  const fly = (o) => map.current.flyTo([o.lat, plotLon(o)], 3, { duration: calm() ? 0 : 1.5 });
  const pick = (o) => { setAct(o.id); fly(o); document.getElementById(`site-${o.id}`)?.scrollIntoView({ block: "nearest", behavior: "smooth" }); };
  const hot = (id, on) => marks.current[id]?.getElement()?.classList.toggle("hot", on);
  const read = (o) => document.getElementById(`ch-${o.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  useEffect(() => {
    const m = L.map(el.current, { crs: L.CRS.EPSG4326, zoomSnap: 0.25, maxZoom: 3.5, maxBounds: [[-90, -180], [90, 180]], maxBoundsViscosity: 1 });
    m.createPane("base").style.zIndex = 250;
    layer.current = L.layerGroup().addTo(m);
    m.fitBounds([[-90, -180], [90, 180]]);
    m.setMinZoom(m.getZoom());
    m.on("zoomend", () => el.current.classList.toggle("z2", m.getZoom() >= 2));
    map.current = m;
    return () => m.remove();
  }, []);
  useEffect(() => {
    const go = (e) => {
      const o = objects.find((x) => x.id === e.detail);
      el.current.scrollIntoView({ behavior: calm() ? "auto" : "smooth", block: "center" });
      setYear(2020);
      if (o.body === cur.current) pick(o); else { pend.current = o; setBody(o.body); }
    };
    window.addEventListener("flyto", go);
    return () => window.removeEventListener("flyto", go);
  }, []);
  useEffect(() => {
    base.current?.remove();
    base.current = L.imageOverlay(MAPS[body].url, [[-90, -180], [90, 180]], { pane: "base" }).addTo(map.current);
    setAct(null);
  }, [body]);
  useEffect(() => {
    layer.current.clearLayers();
    marks.current = {};
    list.forEach((o) => {
      const icon = L.divIcon({ className: "pin2" + (act === o.id ? " on" : ""), iconSize: [40, 40], iconAnchor: [20, 20],
        html: `<span style="${o.photo ? `background-image:url(${o.photo})` : ""}"></span><em>${o.mission}</em>` });
      marks.current[o.id] = L.marker([o.lat, plotLon(o)], { icon, title: o.name }).on("click", () => pick(o)).addTo(layer.current);
    });
    cur.current = body;
    if (pend.current) { pick(pend.current); pend.current = null; }
  }, [body, year, act]);
  return (
    <section className="explore">
      <h2>Explore every site</h2>
      <nav>
        {["moon", "mars"].map((b) => <button key={b} aria-pressed={body === b} onClick={() => setBody(b)}>{b === "moon" ? "Moon" : "Mars"}</button>)}
      </nav>
      <div className="xwrap">
        <div className="map" ref={el} />
        <div className="sitescol">
          <div className="sites">
            {list.map((o) => (
              <div key={o.id} id={`site-${o.id}`} className={"site" + (act === o.id ? " open" : "")} onMouseEnter={() => hot(o.id, true)} onMouseLeave={() => hot(o.id, false)}>
                <button onClick={() => pick(o)} aria-expanded={act === o.id}>
                  <span className="thumb" style={o.photo ? { backgroundImage: `url(${o.photo})` } : undefined} />
                  <b>{o.mission}</b><small>{o.name} · {o.left.slice(0, 4)}</small>
                </button>
                {act === o.id && (
                  <div className="more">
                    <p>{o.story}</p>
                    <div><button onClick={() => open(o)}>Mission log</button><button onClick={() => read(o)}>Read chapter</button></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <label className="years">Left behind by <b>{year}</b>
        <input type="range" min="1969" max="2020" value={year} onChange={(e) => setYear(+e.target.value)} />
      </label>
    </section>
  );
}

export default function App() {
  const [sel, setSel] = useState(null);
  const [sound, setS] = useState(true);
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
  }, []);
  useEffect(() => { document.documentElement.style.overflow = entered ? "" : "hidden"; }, [entered]);
  const start = (on) => {
    document.documentElement.style.overflow = "";
    setEntered(true);
    setTimeout(() => ScrollTrigger.refresh(), 60);
    if (on) unlock();
    setSound(on); setS(on);
    document.getElementById("ch-apollo11")?.scrollIntoView({ behavior: calm() ? "auto" : "smooth" });
  };
  useEffect(() => {
    const k = (e) => e.key === "Escape" && setSel(null);
    window.addEventListener("keydown", k);
    const resume = () => resumeBlocked();
    window.addEventListener("pointerup", resume);
    window.addEventListener("keydown", resume);
    if (!calm()) gsap.from(".finale p", { opacity: 0, y: 30, stagger: 0.6, duration: 1, scrollTrigger: { trigger: ".finale", start: "top 60%" } });
    return () => { window.removeEventListener("keydown", k); window.removeEventListener("pointerup", resume); window.removeEventListener("keydown", resume); };
  }, []);
  return (
    <>
      {entered && <Rail />}
      <button className="sound" hidden={!entered} aria-pressed={sound} aria-label={sound ? "Mute narration" : "Play narration"} onClick={() => { if (sound) { setSound(false); setS(false); } else { unlock(); setSound(true); setS(true); } }}>{sound ? "🔊" : "🔇"}</button>
      <section className="hero">
        <h1>Forgotten Missions</h1>
        <p>The machines were left behind. Their stories weren't.</p>
        <div className="start"><button onClick={() => start(true)}>Start with sound 🔊</button><button className="ghost" onClick={() => start(false)}>Start silent</button></div>
        <span className="hint">Choose one to enter. The story is narrated as you scroll.</span>
      </section>
      {objects.map((o, i) => <Chapter key={o.id} o={o} n={i + 1} first={i === 0 || objects[i - 1].body !== o.body} open={setSel} />)}
      <section className="finale"><p>A story</p><p>The machines were left behind</p><p>Their stories weren't</p></section>
      <MapExplorer open={setSel} />
      <footer>Maps: NASA SVS CGI Moon Kit (LRO); NASA/USGS Viking color map. Facts: NASA NSSDCA and PDS. Built with AI assistance (see docs/AI_USE.md).</footer>
      <Log o={sel} close={() => setSel(null)} />
    </>
  );
}