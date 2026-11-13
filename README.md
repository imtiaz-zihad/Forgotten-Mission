# Forgotten Missions

*The machines were left behind. Their stories weren't.*

**Live site:** https://forgottenmission-kappa.vercel.app/ · 
**240s video:** https://youtu.be/R8SQQnK0Dn0 · 
**30s video:** [YouTube link]

Forgotten Missions is an interactive scroll-story website that lets 13 NASA machines left on the Moon and Mars tell their own stories. Team Dark Matter built it for the NASA Space Apps Challenge 2026 (Bangladesh), for the challenge **Abandoned but not Forgotten: Storytelling about NASA's Discarded Equipment on the Moon and Mars**.

## What it does

- **Scroll story:** 13 chapters (Apollo 11, 12, 14, 15, 16, 17; Viking 1, Viking 2, Mars Pathfinder/Sojourner, Spirit, Opportunity, Phoenix, Mars Polar Lander). Each chapter pins a real NASA photo. After a short scroll, a text bubble and our recorded narration appear.
- **Learn more panel:** why the mission was built, what it found, a timeline and what happened to the equipment, in simple language for young students. An optional "Read this to me" button uses the browser's speech synthesis.
- **Built to last vs actually lasted:** animated bars for five Mars missions.
- **Explore every site:** a NASA Moon or Mars map with photo markers, a site list, a "left behind by year" slider, and links between the map and the chapters.
- **Navigation:** progress bar, chapter dots, reduced-motion support, keyboard-friendly buttons.

## Run it locally

Requires Node.js 18 or newer.

```bash
git clone https://github.com/imtiaz-zihad/Forgotten-Mission.git
cd Forgotten-Mission
npm install
npm run dev      # development server
npm run build    # production build in dist/
```

## Project structure

```
src/App.jsx            chapters, Learn more panel, map explorer, narration
src/data.js            missions: coordinates, dates, story text, sources, map URLs
src/learn.js           student-friendly details for the Learn more panel
src/photos.json        NASA photo IDs (written by the fetch script)
src/styles.css         styles
scripts/fetch-photos.mjs   downloads NASA photos and clips
public/audio/          narration, one file per chapter: <id>.mp3
public/img/            NASA photos
```

## Add or change a mission

1. Add an entry in `src/data.js` and `src/learn.js`.
2. List photo candidates, then download the one you choose:
   ```bash
   node scripts/fetch-photos.mjs --list <id>
   node scripts/fetch-photos.mjs <id>=<NASA image id>
   ```
3. Record the narration as `public/audio/<id>.mp3`.

Chapter ids: `apollo11`, `apollo12`, `apollo14`, `apollo15`, `apollo16`, `apollo17`, `viking1`, `viking2`, `sojourner`, `spirit`, `opportunity`, `phoenix`, `mpl`.

## Data and credits

| Data | Source | Used for |
|---|---|---|
| Moon color map | [NASA SVS CGI Moon Kit (LRO)](https://svs.gsfc.nasa.gov/4720) | Moon basemap and backdrops |
| Photos | [NASA Image and Video Library](https://images.nasa.gov) | One photo per chapter (IDs in `src/photos.json`, credited on screen) |
| Apollo coordinates | [NASA NSSDCA lunar sites](https://nssdc.gsfc.nasa.gov/planetary/lunar/lunar_sites.html) | Map markers |
| Mars coordinates | [NASA PDS Orbital Data Explorer](https://ode.rsl.wustl.edu/mars/pagehelp/Content/Missions_Instruments/Landing_Sites.htm) | Map markers |
| Mission facts | NASA mission pages and our source document `NASA.pdf` | Chapter text, timelines |
| Mars color map | NASA/USGS Viking color map, via [Solar Views](https://solarviews.com/cap/mars/marscyl1.htm) | Mars basemap |
| Mars Polar Lander site | [Planetary Society map](https://www.planetary.org/multimedia/space-images/charts/mars_landing_site_map_lakdawalla.html) | Approximate location |

Coordinates are approximate. Built with React, Vite, Leaflet and GSAP.

## Use of AI

We used Claude (Anthropic) as a coding and writing assistant: for the website code, the photo download script, simple-language rewrites of facts from our own source document, and drafts of our video scripts. AI did not create any image, map or video. The narration was recorded by our team and voice-over speakers. The only synthetic voice is the optional "Read this to me" button. Our team chose the story, checked the facts and tested the site.

## License

Apache-2.0 (see `LICENSE`). NASA imagery is used under NASA's media usage guidelines and credited on screen.

## Team Dark Matter

- Imtiaz Hossen: team lead and story developer
- Ashraf Ullah: data analyst
- MD Jobayer Rahman: graphic designer
- Naymul Hossain Nahian: AI researcher
- MD Rifat Hasan: game developer
- Asmaul Husna: UI and UX designer

Voice-over: MD Rifat Hasan and Asmaul Husna Urbi

## Acknowledgments

NASA, NASA SVS, USGS, the NASA Space Apps Challenge Bangladesh organizers and mentors.