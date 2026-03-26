#!/usr/bin/env node
/**
 * Export app/data/creditCards.js → ml_service/data/cards.json for Python ML scripts.
 */
import { writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import creditCards from "../app/data/creditCards.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "ml_service", "data");
const outPath = join(outDir, "cards.json");

mkdirSync(outDir, { recursive: true });
writeFileSync(outPath, JSON.stringify(creditCards, null, 2), "utf8");
console.log(`Wrote ${outPath} (${creditCards.length} cards)`);
