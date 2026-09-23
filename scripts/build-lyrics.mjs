import fs from "node:fs";
import path from "node:path";

const input = process.argv[2];
const output = process.argv[3] || "assets/lyrics.js";

if (!input) {
  console.error("Usage: node scripts/build-lyrics.mjs <archive.txt> [output.js]");
  process.exit(1);
}

const source = fs.readFileSync(input, "utf8").replace(/\r\n/g, "\n");
const headings = [...source.matchAll(/^([0-9]{2})\. ([^\n]+)$/gm)];
const sections = new Map();

for (let index = 0; index < headings.length; index += 1) {
  const match = headings[index];
  const start = match.index + match[0].length;
  const end = headings[index + 1]?.index ?? source.length;
  const raw = source.slice(start, end).trim();
  const firstLyricLine = raw.search(/^\[/m);

  sections.set(Number(match[1]), {
    archiveTitle: match[2].trim(),
    text: firstLyricLine >= 0 ? raw.slice(firstLyricLine).trim() : "",
  });
}

const selected = {
  "piekne-ciala": 1,
  "na-co-dzien": 2,
  "po-polnocy": 5,
  prezent: 9,
  "swipe-w-prawo": 11,
  "american-girl": 7,
  "mam-zone": 19,
  "bez-obraczki": 20,
  "christmas-party": 21,
};

const lyrics = Object.fromEntries(
  Object.entries(selected).map(([slug, number]) => {
    const section = sections.get(number);
    if (!section?.text) throw new Error(`Missing archive section ${number} for ${slug}`);
    return [slug, { ...section, archiveNumber: number }];
  }),
);

const banner = "// Generated from the verified Piękne Ciała lyrics archive. Do not hand-edit.\n";
const result = `${banner}window.PC_LYRICS = ${JSON.stringify(lyrics, null, 2)};\n`;

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, result, "utf8");
console.log(`Wrote ${Object.keys(lyrics).length} verified lyrics to ${output}`);
