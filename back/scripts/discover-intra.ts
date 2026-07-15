/**
 * Script de découverte des endpoints JSON accessibles sur intra.epitech.eu.
 * Usage : INTRA_COOKIE=<valeur_cookie_user> bun run scripts/discover-intra.ts
 */

const BASE = "https://intra.epitech.eu";
const COOKIE = process.env["INTRA_COOKIE"] ?? "";
const LOCATION = "FR/NCE";
const YEAR = 2025;
const PROMO = "tek1";
const LOGIN = process.env["INTRA_LOGIN"] ?? "aryan1.bhotey@epitech.eu";

if (!COOKIE) {
  console.error("Manque INTRA_COOKIE=<valeur> en variable d'env");
  process.exit(1);
}

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

async function probe(label: string, path: string) {
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { Cookie: `user=${COOKIE}`, "User-Agent": UA },
      redirect: "follow",
    });
    if (!res.ok) {
      console.log(`❌ [${res.status}] ${label} — ${path}`);
      return;
    }
    const text = await res.text();
    let parsed: unknown;
    try { parsed = JSON.parse(text); } catch {
      console.log(`⚠️  [${res.status} HTML] ${label} — ${path}`);
      return;
    }
    const preview = JSON.stringify(parsed).slice(0, 120);
    console.log(`✅ [${res.status}] ${label}\n   ${path}\n   ${preview}\n`);
  } catch (err) {
    console.log(`💥 [ERR] ${label} — ${path} : ${err}`);
  }
}

const endpoints: [string, string][] = [
  // User filter (découverts)
  ["Filter — promos",   `/user/filter/promo?format=json&location=${LOCATION}&year=${YEAR}&active=true`],
  ["Filter — courses",  `/user/filter/course?format=json&location=${LOCATION}&year=${YEAR}&active=true`],
  ["Filter — years",    `/user/filter/year?format=json&location=${LOCATION}&active=true`],
  ["Filter — locations",`/user/filter/location?format=json&active=true`],
  ["Filter — groups",   `/user/filter/groups?format=json&location=${LOCATION}&year=${YEAR}&active=true`],
  ["Filter — users",    `/user/filter/user?format=json&location=${LOCATION}&year=${YEAR}&active=true&promo=${PROMO}&offset=0`],

  // Profil utilisateur
  ["User — profil self",   `/user/${LOGIN}/?format=json`],
  ["User — netsoul",       `/user/${LOGIN}/netsoul?format=json`],
  ["User — notes",         `/user/${LOGIN}/notes?format=json`],
  ["User — binomes",       `/user/${LOGIN}/binome?format=json`],
  ["User — projets",       `/user/${LOGIN}/projets?format=json`],
  ["User — flags",         `/user/${LOGIN}/flags?format=json`],
  ["User — clustermap",    `/user/${LOGIN}/clustermap?format=json`],
  ["User — timeline",      `/user/${LOGIN}/timeline?format=json`],

  // Planning
  ["Planning — load",      `/planning/load?format=json&start=${YEAR}-09-01&end=${YEAR + 1}-06-30`],

  // Modules (exemples connus)
  ["Module — search",      `/module/search?format=json&location=${LOCATION}&scolaryear=${YEAR}`],
  ["Module — list",        `/module/?format=json&location=${LOCATION}&scolaryear=${YEAR}`],

  // Flags / absences
  ["Flags — list",         `/flag/?format=json`],
  ["Admin — absences",     `/admin/absence/?format=json`],

  // Dashboard / misc
  ["Dashboard",            `/?format=json`],
  ["Preferences",          `/user/prefered?format=json`],
  ["Notifications",        `/user/notification/?format=json`],
  ["Alert",                `/user/alert?format=json`],
];

console.log(`\n🔍 Découverte intra.epitech.eu — ${endpoints.length} endpoints\n${"─".repeat(60)}\n`);

for (const [label, path] of endpoints) {
  await probe(label, path);
  await Bun.sleep(150); // évite le rate-limiting
}

console.log("\n✓ Terminé");
