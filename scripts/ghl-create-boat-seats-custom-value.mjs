#!/usr/bin/env node
/**
 * Creates the GHL location custom value used for boat seat inventory.
 *
 * Required Private Integration scopes:
 *   - locations/customValues.write  (POST)
 *   - locations/customValues.readonly (GET — optional, for verification)
 *
 * GHL: Settings → Integrations → Private Integrations → your integration →
 * enable the "Locations / Custom Values" scopes, save, then regenerate the
 * token if prompted and update GHL_API_KEY in .env.local.
 *
 * Usage (from website/):
 *   node scripts/ghl-create-boat-seats-custom-value.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

function loadGhlEnv() {
  for (const name of [".env.local", ".env"]) {
    const p = path.join(ROOT, name);
    if (!fs.existsSync(p)) continue;
    const text = fs.readFileSync(p, "utf8");
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (key === "GHL_API_KEY" || key === "GHL_LOCATION_ID") {
        process.env[key] = val;
      }
    }
  }
}

const GHL_API_BASE = "https://services.leadconnectorhq.com";
const GHL_VERSION = "2021-07-28";

const NAME = "HTNS Book Party — Boat Seats Remaining";
const INITIAL_VALUE = "96";

async function main() {
  loadGhlEnv();
  const apiKey = process.env.GHL_API_KEY?.trim();
  const locationId = process.env.GHL_LOCATION_ID?.trim();

  if (!apiKey || !locationId) {
    console.error(
      "Missing GHL_API_KEY or GHL_LOCATION_ID in .env.local or .env",
    );
    process.exit(1);
  }

  const url = `${GHL_API_BASE}/locations/${locationId}/customValues`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${apiKey}`,
      Version: GHL_VERSION,
    },
    body: JSON.stringify({ name: NAME, value: INITIAL_VALUE }),
  });

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    console.error("Non-JSON response:", text.slice(0, 500));
    process.exit(1);
  }

  if (!res.ok) {
    console.error("Request failed:", res.status, json);
    if (res.status === 401 && json?.message?.includes("scope")) {
      console.error(`
Your Private Integration token needs the scope: locations/customValues.write

In GoHighLevel: Settings → Integrations → Private Integrations →
edit your integration → add Custom Values (Locations) write access →
save → update GHL_API_KEY if a new token is shown.
`);
    }
    process.exit(1);
  }

  const id =
    json.customValue?.id ?? json.id ?? json.customValueId ?? null;
  if (!id) {
    console.error("Unexpected response (no id):", JSON.stringify(json, null, 2));
    process.exit(1);
  }

  console.log("Created custom value.");
  console.log("");
  console.log(`  GHL_CUSTOM_VALUE_BOAT_SEATS_ID=${id}`);
  console.log("");
  console.log(
    "Add that line to website/.env.local and production env (Vercel, etc.).",
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
