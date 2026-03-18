import { NextResponse } from "next/server";
import dbConnect from "../../lib/db";
import CreditCard from "../../models/cards";

const CATEGORIES = ["shopping", "travel", "fuel", "dining", "groceries"];

const REWARD_LABELS = { cashback: "Cashback", points: "Reward points", miles: "Miles (travel)" };

const SPEND_OPTIONS = [
  { value: "under_10k", label: "Under ₹10,000/month" },
  { value: "10k_30k", label: "₹10,000 – ₹30,000/month" },
  { value: "30k_50k", label: "₹30,000 – ₹50,000/month" },
  { value: "50k_plus", label: "₹50,000+/month" },
];

/**
 * GET: Returns quiz questions with options derived from card database.
 * Questions map to card schema fields so answers can filter/rank cards.
 */
export async function GET() {
  try {
    await dbConnect();
    const cards = await CreditCard.find().select("rewardType").lean();
    const rewardTypes = [...new Set(cards.map((c) => c.rewardType).filter(Boolean))];

    const questions = [
      {
        id: "rewardType",
        field: "rewardType",
        label: "What type of rewards do you want?",
        description: "We'll show cards that match.",
        options: rewardTypes.length
          ? rewardTypes.map((v) => ({ value: v, label: REWARD_LABELS[v] || v }))
          : Object.entries(REWARD_LABELS).map(([value, label]) => ({ value, label })),
      },
      {
        id: "topCategory",
        field: "topCategory",
        label: "Where do you spend the most?",
        description: "We'll prioritize rewards in this category.",
        options: [
          ...CATEGORIES.map((c) => ({ value: c, label: c.charAt(0).toUpperCase() + c.slice(1) })),
          { value: "spread", label: "Spread evenly" },
        ],
      },
      {
        id: "spendBucket",
        field: "spendBucket",
        label: "How much do you typically spend per month?",
        description: "Used to estimate rewards and fees. No impact on credit score.",
        options: SPEND_OPTIONS,
      },
    ];

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("card-to-buy-quiz:", error);
    return NextResponse.json({ message: "Failed to load quiz" }, { status: 500 });
  }
}
