import { readFile, writeFile } from "node:fs/promises";

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath) {
  throw new Error("Usage: node generate-contribution-svg.mjs input.json output.svg");
}

const response = JSON.parse(await readFile(inputPath, "utf8"));
const calendar = response.data?.user?.contributionsCollection?.contributionCalendar;
if (!calendar?.weeks) throw new Error("GitHub did not return a contribution calendar.");

const square = 11;
const gap = 4;
const gridX = 52;
const gridY = 45;
const dividerY = 154;
const width = gridX + calendar.weeks.length * (square + gap) + 16;
const height = 180;
const colors = ["#0b2239", "#075985", "#0284c7", "#0ea5e9", "#67e8f9"];

function colorFor(count) {
  if (count === 0) return colors[0];
  if (count <= 2) return colors[1];
  if (count <= 5) return colors[2];
  if (count <= 9) return colors[3];
  return colors[4];
}

const cells = calendar.weeks.flatMap((week, column) =>
  week.contributionDays.map((day, row) => {
    const x = gridX + column * (square + gap);
    const y = gridY + row * (square + gap);
    return `<rect x="${x}" y="${y}" width="${square}" height="${square}" rx="2" fill="${colorFor(day.contributionCount)}"><title>${day.date}: ${day.contributionCount} contributions</title></rect>`;
  }),
).join("");

// Kept inline so the generated SVG remains a single, portable README asset.
const cat = `
  <g>
    <animateTransform
      attributeName="transform"
      type="translate"
      values="-42 ${dividerY - 7}; ${width + 8} ${dividerY - 7}"
      dur="20s"
      repeatCount="indefinite"
    />

    <!-- walking bounce -->
    <g>
      <animateTransform
        attributeName="transform"
        type="translate"
        values="0 0; 0 -2; 0 0"
        dur="0.8s"
        repeatCount="indefinite"
      />

      <!-- tail -->
      <path
        fill="none"
        stroke="#38bdf8"
        stroke-width="3"
        stroke-linecap="square"
        d="M9 24H5v-6H1"
      >
        <animate
          attributeName="d"
          values="
            M9 24H5v-6H1;
            M9 24H5v-9H1;
            M9 24H5v-6H1;
          "
          dur="0.8s"
          repeatCount="indefinite"
        />
      </path>

      <!-- cat body -->
      <path
        fill="#0ea5e9"
        d="
          M10 12
          H13 V6
          H18 V10
          H27 V6
          H32 V12
          H36 V28
          H8 V12 Z
        "
      />

      <!-- face -->
      <rect x="13" y="14" width="18" height="10" fill="#38bdf8"/>

      <!-- eyes -->
      <rect x="16" y="17" width="3" height="3" fill="#082f49"/>
      <rect x="25" y="17" width="3" height="3" fill="#082f49"/>

      <!-- nose -->
      <rect x="24" y="20" width="3" height="2" fill="#a78bfa"/>

      <!-- legs -->
      <g fill="#0284c7">
        <rect x="10" y="27" width="7" height="5">
          <animate
            attributeName="y"
            values="27;29;27"
            dur="0.8s"
            repeatCount="indefinite"
          />
        </rect>

        <rect x="27" y="27" width="7" height="5">
          <animate
            attributeName="y"
            values="29;27;29"
            dur="0.8s"
            repeatCount="indefinite"
          />
        </rect>
      </g>
    </g>
  </g>`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
  <title id="title">GitHub contribution activity</title>
  <desc id="desc">${calendar.totalContributions} public contributions in the last year, with a small cyan pixel cat walking underneath.</desc>
  <rect width="100%" height="100%" rx="10" fill="#010409"/>
  <rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="9.5" fill="none" stroke="#1f3b57"/>
  <text x="18" y="26" fill="#c9d1d9" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="13" font-weight="700">CONTRIBUTION ACTIVITY</text>
  <text x="18" y="42" fill="#7d8590" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="10">${calendar.totalContributions} contributions in the last year</text>
  <g fill="#7d8590" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="9"><text x="18" y="63">Mon</text><text x="18" y="91">Wed</text><text x="18" y="119">Fri</text></g>
  ${cells}
  <path d="M18 ${dividerY}H${width - 18}" stroke="#1f3b57" stroke-width="1"/>
  ${cat}
</svg>`;

await writeFile(outputPath, svg);
