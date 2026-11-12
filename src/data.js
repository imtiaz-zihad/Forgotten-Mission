import photos from "./photos.json";
// Sources: Moon coordinates NSSDCA lunar_sites (LRO-based); Mars coordinates NASA PDS ODE landing-site page
// (Folkner 1997, Arvidson 2004/2006, Smith 2009), Mars Polar Lander from Planetary Society map (HiRISE team).
// Apollo 14/15/16 coordinates and some dates are from memory: verify against NSSDCA before submitting.
// Moon longitudes are -180..180 E. Mars longitudes are 0..360 E (as published); plotLon converts them.
const MOON = "https://nssdc.gsfc.nasa.gov/planetary/lunar/lunar_sites.html";
const MARS = "https://ode.rsl.wustl.edu/mars/pagehelp/Content/Missions_Instruments/Landing_Sites.htm";

export const MAPS = {
  moon: { url: "https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/lroc_color_2k.jpg", shift: 0,
    credit: "Map: NASA SVS CGI Moon Kit (LRO)." },
  // If Mars markers look shifted by half a map, change shift to 180 (depends on the map's centre longitude).
  mars: { url: "https://solarviews.com/raw/mars/marscyl1.jpg", shift: 0, credit: "Map: NASA/USGS Viking color map." },
};
export const plotLon = (o) => ((((o.lon + MAPS[o.body].shift + 180) % 360) + 360) % 360) - 180;

const moon = (id, mission, name, lat, lon, left, story, science) =>
  ({ id, body: "moon", mission, name, lat, lon, left, last: left, story, science, credit: "NASA", dataset: "NASA NSSDCA lunar sites", src: MOON });
const mars = (id, mission, name, lat, lon, left, last, story, science, dataset = "NASA PDS ODE landing sites", src = MARS) =>
  ({ id, body: "mars", mission, name, lat, lon, left, last, story, science, credit: "NASA", dataset, src });

const base = [
  moon("apollo11", "Apollo 11", "Eagle descent stage", 0.67416, 23.47314, "1969-07-21",
    "I carried two people to the Moon. Then my top half lifted off, and I stayed behind in the Sea of Tranquility.",
    "A laser reflector and a seismometer set up beside me kept working after the crew left."),
  moon("apollo12", "Apollo 12", "Intrepid descent stage", -3.01239, -23.42157, "1969-11-20",
    "I landed within walking distance of Surveyor 3, a robot that had waited on the Moon for about 31 months.",
    "The crew visited Surveyor 3 and brought parts home, so engineers could study how materials age on the Moon."),
  moon("apollo14", "Apollo 14", "Antares descent stage", -3.645, -17.471, "1971-02-06",
    "I carried Alan Shepard and Edgar Mitchell to Fra Mauro. Before leaving, Shepard hit two golf balls with a makeshift club.",
    "A surface science station stayed behind to listen for moonquakes."),
  moon("apollo15", "Apollo 15", "Falcon descent stage and rover", 26.132, 3.634, "1971-08-02",
    "The crew drove a rover across Hadley Rille and up the Apennine mountains. When they flew home, the rover stayed parked.",
    "A camera on the rover sent live pictures of the crew's launch from the Moon."),
  moon("apollo16", "Apollo 16", "Orion descent stage", -8.973, 15.5, "1972-04-24",
    "I landed in the Descartes highlands with John Young and Charlie Duke, who left a family photo on the surface.",
    "Their ultraviolet camera photographed Earth's atmosphere from the Moon."),
  moon("apollo17", "Apollo 17", "Challenger descent stage", 20.188, 30.775, "1972-12-14",
    "I was the last. Eugene Cernan was the last person to leave the Moon, and no one has returned since.",
    "Harrison Schmitt, the only geologist to walk on the Moon, collected samples beside me."),
  mars("viking1", "Viking 1", "Viking 1 lander", 22.269, 312.049, "1976-07-20", "1982-11-11",
    "I was built for a short mission. I operated for 2,245 sols, more than six years, long after anyone expected it.",
    "My soil experiments searched for signs of life and found no definitive evidence."),
  mars("viking2", "Viking 2", "Viking 2 lander", 47.668, 134.28, "1976-09-03", "1980-04-12",
    "I landed far to the north, on Utopia Planitia, and operated for 1,281 sols before my signal ended.",
    "I sent back some of the first color pictures of frost on the Martian surface."),
  mars("sojourner", "Mars Pathfinder", "Sojourner rover and lander", 19.095, 326.747, "1997-07-04", "1997-09-27",
    "I was planned for 7 days. I rolled across another world for 83, the first rover to do it.",
    "I measured rocks and soil in Ares Vallis and showed that a small rover could do real science."),
  mars("spirit", "Mars Exploration Rover", "Spirit rover", -14.571892, 175.47848, "2004-01-03", "2010-03-22",
    "In 2009 I got stuck in soft sand. I could not tilt my panels toward the winter sun, and my last signal came in March 2010.",
    "I found silica-rich soil that points to past hot water at Gusev crater."),
  mars("opportunity", "Mars Exploration Rover", "Opportunity rover", -1.9462, 354.4734, "2004-01-24", "2018-06-10",
    "I was planned for 90 Martian days and worked for about 14 years. In June 2018 a dust storm hid the sun, and I went silent. NASA declared my mission over on 13 February 2019.",
    "I found hematite and other evidence that water once shaped the surface of Mars.",
    "Arvidson et al., Science 2004 (via NASA PDS ODE)"),
  mars("phoenix", "Phoenix", "Phoenix lander", 68.22, 234.25, "2008-05-25", "2008-11-02",
    "I landed near the north pole. As the polar winter darkness came, my solar panels stopped working, and my last signal came in November 2008.",
    "I confirmed that water ice lies just under the soil."),
  mars("mpl", "Mars Polar Lander", "Mars Polar Lander (lost)", -76.57, 165.2, "1999-12-03", "1999-12-03",
    "I was lost during landing and never sent a signal. I am still near the south pole, and my story is about what we learned from losing me.",
    "The failure review led engineers to change how landers are tested before they fly.",
    "Planetary Society Mars landing site map (HiRISE team)", "https://www.planetary.org/multimedia/space-images/charts/mars_landing_site_map_lakdawalla.html"),
];

export const objects = base.map((o) => ({ ...o, ...(photos[o.id] || {}) }));

// Planned vs actual operating time. Verify against NASA mission pages: prime missions of Viking, Spirit and Opportunity were about 90 sols; Sojourner was planned for 7 sols.
export const LIFESPAN = {
  viking1: { planned: 90, actual: 2245, unit: "sols" }, viking2: { planned: 90, actual: 1281, unit: "sols" },
  sojourner: { planned: 7, actual: 83, unit: "sols" }, spirit: { planned: 90, actual: 2210, unit: "sols" },
  opportunity: { planned: 90, actual: 5111, unit: "sols" },
};

export const strings = {
  en: { title: "Forgotten Missions", tagline: "The machines were left behind. Their stories weren't.", begin: "Begin",
    moon: "Moon", mars: "Mars", left: "Left behind", last: "Last contact", science: "What it made possible",
    source: "Source", pick: "Pick a marker on the map to hear its story.", year: "Show objects left behind up to",
    note: "Coordinates are approximate.", credit: "Image credit" },
};