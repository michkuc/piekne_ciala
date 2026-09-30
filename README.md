# Piękne Ciała — website

Static multi-page site for the music project **Piękne Ciała**.

## Structure
- `index.html` — Home
- `music.html` — catalogue of all stories
- `playlist.html` — session-only in-browser queue with sequential playback
- `series.html` — reusable series page
- `archive.html` — Night Archive with one filterable gallery and fullscreen lightbox
- `about.html` — The Man
- `song.html` — reusable story / song detail template
- `assets/songs.js` — canonical song, series, audio and visual mapping
- `assets/lyrics.js` — verified lyrics recovered from the project archive
- `assets/styles.css` — visual system
- `assets/app.js` — rendering, navigation, age gate, playlist and lightbox logic
- `api/audio.js` — allow-listed audio proxy for Google Drive masters
- `vercel.json` — clean routes, media rewrite and security headers

## Current production model
- Repository: `michkuc/piekne_ciala`
- Default branch: `main`
- Production: `https://piekne-ciala.vercel.app/`
- Vercel deploys from GitHub.
- Large audio/video files remain in Google Drive; they are not stored in the Git repository.

## Content status
- **22 stories are live.**
- **3 active series:** Piękne Ciała, Ciała świata, Za blisko.
- **22 audio masters** are mapped through the project audio folder / `api/audio.js`.
- **17 lyrics records are verified.**
- **5 lyrics remain intentionally marked for source recovery:** Dubai, Tokyo, Dotyk Nocy, Poranek, Ona Tańczy. Do not reconstruct them from memory.
- **Młode Boginie** has a native site video player; `/media/mlode-boginie.mp4` is rewritten by Vercel to the approved Drive video.
- The playlist is intentionally session-only and resets after refresh / closing the page.

## Active visual workflow
The approved visual library is organized in Google Drive under `Grafiki/01_ACTIVE_SITE` with separate `COVERS` and `HEROES` folders.

Rules:
- one anonymous male narrator, 40+, short dark-blond hair;
- women vary between stories;
- for one story, cover and 16:9 hero should show the **same woman / same visual identity**;
- cover may contain only the song title;
- 16:9 hero has no text;
- sensuality comes from gaze, situation, light and body language rather than repetitive pin-up posing;
- Night Archive is one filterable gallery; Home, Night Archive and The Man should not duplicate the same image set without a reason.

Latest synchronized cover + hero pairs:
- Dotyk Nocy
- Po Północy
- Prezent
- Poranek
- Ona Tańczy
- Siłownia i Lustra

`Swipe w Prawo` remains unchanged until a matching 16:9 scene is approved for the new cover candidates.

## Visual DNA
One narrator. External control, internal chaos. Cinematic noir / premium editorial look with black, burgundy, amber and selective neon. The site should feel like a coherent story universe, not a catalogue of images or MP3 files.
