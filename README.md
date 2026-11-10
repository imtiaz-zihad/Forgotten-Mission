# Forgotten Missions
*The machines were left behind. Their stories weren't.*

Interactive map and story panel for NASA hardware left on the Moon and Mars (NASA Space Apps 2026: Abandoned but not Forgotten).

## Run
    npm install
    npm run dev      # development
    npm run build    # static files in dist/ (deploy to Netlify)

## Replace before submitting
- `public/maps/moon.png`, `mars.png`: placeholders. Use NASA Moon Trek / Mars Trek global images in equirectangular projection (360 x 180 degrees).
- `public/img/placeholder.svg`: add real NASA photos, set an `image` per object in `src/data.js` (the panel currently shows the placeholder), and credit them.
- `public/audio/<id>.mp3`: your recorded narration (ids: apollo11, apollo15, viking1, sojourner, opportunity). The player hides itself when a file is missing.
- `src/data.js`: verify every coordinate, date and source URL against NASA sources. Story text is English only; add Bangla by extending the data.
- Add an Apache-2.0 `LICENSE` file (GitHub: Add file > Create new file > LICENSE) and list every NASA source and AI tool used (`docs/AI_USE.md`).
