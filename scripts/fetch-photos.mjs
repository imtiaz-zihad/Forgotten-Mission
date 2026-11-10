// Run on your own computer (Node 18+, internet):
//   node scripts/fetch-photos.mjs                 -> all objects
//   node scripts/fetch-photos.mjs apollo12 spirit -> only these ids (other photos stay as they are)
//   node scripts/fetch-photos.mjs --list apollo12 -> print the top 8 search hits (id | title), download nothing
//   node scripts/fetch-photos.mjs --list apollo16 "--q=Apollo 16 Duke" -> try your own search words
//   node scripts/fetch-photos.mjs apollo12=as12-48-7133 -> use this exact NASA image id
// Downloads one NASA Image Library photo per object into public/img and updates src/photos.json.
// If a PIN id fails, the search query is used instead. Check the printed titles.
import fs from "node:fs/promises";
const Q = {
  apollo11: "Apollo 11 lunar module Eagle on the Moon", apollo12: "Apollo 12 Surveyor 3",
  apollo14: "Apollo 14 Antares lunar module Fra Mauro", apollo15: "Apollo 15 lunar rover Falcon Hadley",
  apollo16: "Apollo 16 rover",
  apollo17: "Apollo 17 Challenger lunar module Taurus-Littrow",
  viking1: "Viking 1 lander Mars", viking2: "Viking 2 lander Utopia Planitia",
  sojourner: "Sojourner rover Mars",
  spirit: "Spirit rover Mars", opportunity: "Opportunity rover Mars",
  phoenix: "Phoenix Mars Lander on Martian surface arctic", mpl: "Mars Polar Lander",
};
const PIN = { apollo12: "as12-48-7133", apollo15: "as15-88-11866" }; // exact NASA image ids (tried first)
const list = process.argv.includes("--list");
const video = process.argv.includes("--video"); // video mode: NASA clips (mp4) into public/video
const QV = {
  apollo11: "Apollo 11 launch Saturn V liftoff", apollo15: "Apollo 15 lunar rover driving on the Moon",
  apollo17: "Apollo 17 lunar module liftoff Moon", sojourner: "Sojourner rover Mars Pathfinder animation",
  spirit: "Mars Exploration Rover Spirit animation driving", opportunity: "Opportunity rover driving Mars animation",
};
let customQ = "";
const only = [];
for (const a of process.argv.slice(2)) { if (a === "--list" || a === "--video") continue;
  if (a.startsWith("--q=")) { customQ = a.slice(4); continue; } const [k, id] = a.split("="); only.push(k); if (id) PIN[k] = id; }
const get = async (u) => { const r = await fetch(u); if (!r.ok) throw new Error(r.status + " " + u); return r.json(); };
const save = async (k, id) => {
  const items = (await get("https://images-api.nasa.gov/asset/" + encodeURIComponent(id))).collection.items;
  if (video) {
    const pickV = ["~mobile.mp4", "~small.mp4", "~medium.mp4"].map((x) => items.find((i) => i.href.endsWith(x))).find(Boolean);
    if (!pickV) throw new Error("no mp4 found for " + id);
    const b = Buffer.from(await (await fetch(pickV.href.replace("http://", "https://"))).arrayBuffer());
    await fs.mkdir("public/video", { recursive: true });
    await fs.writeFile(`public/video/${k}.mp4`, b);
    console.log("   size:", (b.length / 1e6).toFixed(1), "MB", b.length > 15e6 ? "(big: trim it, see README)" : "");
    return { video: `/video/${k}.mp4`, videoId: id };
  }
  const pick = items.find((i) => /~large\.jpg$/.test(i.href)) || items.find((i) => /~medium\.jpg$/.test(i.href)) || items[0];
  const buf = Buffer.from(await (await fetch(pick.href.replace("http://", "https://"))).arrayBuffer());
  await fs.writeFile(`public/img/${k}.jpg`, buf);
  return { photo: `/img/${k}.jpg`, photoId: id };
};
await fs.mkdir("public/img", { recursive: true });
let out = {};
try { out = JSON.parse(await fs.readFile("src/photos.json", "utf8")); } catch {}
for (const [k, q0] of Object.entries(video ? QV : Q)) {
  const q = customQ || q0;
  if (only.length && !only.includes(k)) continue;
  if (list) {
    const r = await get("https://images-api.nasa.gov/search?media_type=" + (video ? "video" : "image") + "&q=" + encodeURIComponent(q));
    console.log("\n" + k + ": " + q);
    if (!r.collection.items.length) console.log("   (no results, try shorter words with --q=...)");
    r.collection.items.slice(0, 8).forEach((i) => console.log("  ", i.data[0].nasa_id, "|", i.data[0].title));
    continue;
  }
  try {
    let done = false;
    if (PIN[k]) { try { out[k] = { ...out[k], ...(await save(k, PIN[k])) }; console.log(k.padEnd(12), PIN[k], "| (pinned)"); done = true; } catch (e) { console.log(k, "pin failed, searching:", e.message); } }
    if (!done) {
      const r = await get("https://images-api.nasa.gov/search?media_type=" + (video ? "video" : "image") + "&q=" + encodeURIComponent(q));
      if (!r.collection.items.length) throw new Error("no results for: " + q);
      const d = r.collection.items[0].data[0];
      out[k] = { ...out[k], ...(await save(k, d.nasa_id)) };
      console.log(k.padEnd(12), d.nasa_id, "|", d.title);
    }
  } catch (e) { console.log(k.padEnd(12), "FAILED:", e.message); }
}
await fs.writeFile("src/photos.json", JSON.stringify(out, null, 2));
