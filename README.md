# Piękne Ciała — website

Static multi-page site for the music project **Piękne Ciała**.

## Structure
- `index.html` — Home
- `music.html` — song catalogue
- `archive.html` — Night Archive
- `about.html` — The Man
- `song.html` — reusable song detail template
- `assets/songs.js` — canonical song data + Google Drive asset IDs
- `assets/lyrics.js` — verified 1:1 lyrics available in the project archive
- `assets/styles.css` — visual system
- `assets/app.js` — navigation, age gate, rendering, animation
- `scripts/build-lyrics.mjs` — deterministic archive-to-site lyrics generator
- `vercel.json` — clean song routes

## Source of truth
Visual assets are stored in the Google Drive folder **PIĘKNE CIAŁA – WEBSITE MASTER**. The website references the approved Drive assets by file ID.

## Visual DNA
One anonymous male narrator, 40+, short dark-blond hair. Women vary. Cinematic noir, sensual, mysterious, premium, black / burgundy / amber / neon.

## Content status
- 15 visual chapters are live.
- 9 full lyrics are connected as verified 1:1 archive records.
- 6 lyrics remain explicitly marked for source recovery; they are not reconstructed.
- Audio files are not yet connected. The player activates automatically after an `audio` URL is added to a song record.
