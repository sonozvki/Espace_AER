/**
 * Crawl l'intra.epitech.eu avec un vrai browser pour découvrir tous les endpoints JSON.
 * Usage : INTRA_COOKIE=<valeur_cookie_user> bun run scripts/crawl-intra.ts
 */

import { chromium } from "playwright";

const COOKIE_VALUE = process.env["INTRA_COOKIE"] ?? "";
const BASE = "https://intra.epitech.eu";

if (!COOKIE_VALUE) {
  console.error("Manque INTRA_COOKIE=<valeur>");
  process.exit(1);
}

// Pages à visiter pour maximiser la découverte d'endpoints
const PAGES_TO_VISIT = [
  "/",
  "/user/",
  "/user/browser/",
  "/planning/",
  "/module/",
  "/note/",
  "/admin/",
  "/admin/absence/",
];

const discovered = new Map<string, { status: number; preview: string }>();

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();

// Injecter le cookie d'auth
await context.addCookies([{
  name: "user",
  value: COOKIE_VALUE,
  domain: "intra.epitech.eu",
  path: "/",
  secure: true,
  httpOnly: false,
}]);

// Intercepter toutes les requêtes réseau
context.on("response", async (response) => {
  const url = response.url();
  if (!url.startsWith(BASE)) return;

  const contentType = response.headers()["content-type"] ?? "";
  if (!contentType.includes("application/json")) return;

  const path = url.replace(BASE, "");
  if (discovered.has(path)) return;

  try {
    const body = await response.text();
    const parsed = JSON.parse(body);
    const preview = JSON.stringify(parsed).slice(0, 100);
    discovered.set(path, { status: response.status(), preview });
    console.log(`✅ [${response.status()}] ${path}\n   ${preview}\n`);
  } catch {
    // ignore
  }
});

const page = await context.newPage();

for (const route of PAGES_TO_VISIT) {
  try {
    console.log(`\n📄 Navigation → ${route}`);
    await page.goto(`${BASE}${route}`, { waitUntil: "networkidle", timeout: 15000 });
    await page.waitForTimeout(2000);

    // Scroll pour déclencher le lazy loading
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
  } catch (err) {
    console.log(`   ⚠️  Timeout ou erreur sur ${route}`);
  }
}

await browser.close();

console.log(`\n${"═".repeat(60)}`);
console.log(`✓ ${discovered.size} endpoints JSON découverts :\n`);
for (const [path] of [...discovered.entries()].sort()) {
  console.log(`  ${BASE}${path}`);
}
