/**
 * Synthetic rows: random monthly spends × each DB card → rule-engine yearly reward (training labels).
 * Run: npm run synthetic-module2  (needs MONGODB_URI + npm run seed)
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

async function loadAppModule(rel) {
  return import(pathToFileURL(path.join(root, ...rel.split("/"))).href);
}

function monthlyRewardFromCard(card, spending) {
  const cats = ["shopping", "travel", "dining", "fuel", "groceries"];
  let monthly = 0;
  for (const cat of cats) {
    const spend = Number(spending[cat]) || 0;
    const raw = card?.categories?.[cat];
    let rate = Number(card?.baseRewardRate) || 0;
    let cap = null;
    if (raw && typeof raw === "object" && raw.rate !== undefined) rate = Number(raw.rate) || rate;
    else if (typeof raw === "number") rate = raw;
    if (raw && typeof raw === "object" && raw.maxCap !== undefined) {
      const c = Number(raw.maxCap);
      if (Number.isFinite(c) && c > 0) cap = c;
    }
    let part = spend * (rate / 100);
    if (cap != null) part = Math.min(part, cap);
    monthly += part;
  }
  const type = String(card?.rewardType || "cashback").toLowerCase();
  const pv = Number(card?.pointValueInr);
  const pointValue = Number.isFinite(pv) && pv > 0 ? pv : 0.25;
  if (type !== "cashback") monthly *= pointValue;
  return monthly;
}

async function main() {
  const { default: dbConnect } = await loadAppModule("app/lib/db.js");
  const { default: CreditCard } = await loadAppModule("app/models/cards.js");

  await dbConnect();
  const cards = await CreditCard.find({}).lean();
  if (!cards.length) {
    console.error("No cards. Run: npm run seed");
    process.exit(1);
  }

  const sorted = [...cards].sort((a, b) => String(a._id).localeCompare(String(b._id)));
  const n = sorted.length;
  const randInt = (max) => Math.floor(Math.random() * (max + 1));
  const NUM_USERS = Number(process.env.MODULE2_SYNTHETIC_USERS || 1200);
  const outDir = path.join(root, "ml_models");
  const outPath = path.join(outDir, "module2_synthetic.csv");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const lines = ["shopping,travel,dining,fuel,groceries,cardNorm,reward"];
  for (let u = 0; u < NUM_USERS; u += 1) {
    const spending = {
      shopping: randInt(50000),
      travel: randInt(50000),
      dining: randInt(20000),
      fuel: randInt(10000),
      groceries: randInt(10000),
    };
    sorted.forEach((card, cardIndex) => {
      const denom = Math.max(1, n - 1);
      const cardNorm = n <= 1 ? 0 : cardIndex / denom;
      const monthly = monthlyRewardFromCard(card, spending);
      const reward = Number((monthly * 12).toFixed(2));
      lines.push(
        [spending.shopping, spending.travel, spending.dining, spending.fuel, spending.groceries, cardNorm.toFixed(6), reward.toFixed(2)].join(",")
      );
    });
  }
  fs.writeFileSync(outPath, `${lines.join("\n")}\n`, "utf8");
  console.log("Wrote", outPath, "rows:", lines.length - 1);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
