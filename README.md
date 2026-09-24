# Piękne Ciała — website

Static multi-page site for the music project **Piękne Ciała**.

## Structure
- `index.html` — Home
- `music.html` — song catalogue
- `playlist.html` — temporary in-browser queue with sequential playback
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
- 10 audio masters are connected to their visual chapters through the project audio folder in Google Drive.
- The playlist is intentionally session-only: it is not written to local storage and resets after refresh or closing the page.
- Track 16, **Samotność w wielkim mieście**, is staged in the audio folder and awaits its visual chapter.
