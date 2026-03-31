import { NextResponse } from "next/server";
import dbConnect from "../../lib/db";
import CreditCard from "../../models/cards";

const CATEGORIES = ["shopping", "travel", "fuel", "dining", "groceries"];

const REWARD_LABELS = { cashback: "Cashback", points: "Reward points", miles: "Miles (travel)" };
const CARD_TYPE_OPTIONS = [
  { value: "Cashback", label: "Cashback card" },
  { value: "Travel", label: "Travel card" },
  { value: "Fuel", label: "Fuel card" },
  { value: "Lifestyle", label: "Lifestyle card" },
  { value: "Shopping", label: "Shopping card" },
  { value: "Basic", label: "Basic/Starter card" },
];
const NETWORK_OPTIONS = [
  { value: "Visa", label: "Visa" },
  { value: "Mastercard", label: "Mastercard" },
  { value: "RuPay", label: "RuPay" },
  { value: "Amex", label: "Amex" },
];

const INCOME_OPTIONS = [
  { value: "under_3l", label: "Under ₹3L/year" },
  { value: "3l_6l", label: "₹3L – ₹6L/year" },
  { value: "6l_12l", label: "₹6L – ₹12L/year" },
  { value: "12l_plus", label: "₹12L+/year" },
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
        id: "cardType",
        field: "cardType",
        label: "Which card style do you prefer?",
        description: "Helps us align recommendations with your usage goal.",
        options: CARD_TYPE_OPTIONS,
      },
      {
        id: "preferredNetwork",
        field: "preferredNetwork",
        label: "Do you have a preferred card network?",
        description: "Optional preference for Visa, Mastercard, RuPay, or Amex.",
        options: [{ value: "", label: "No preference" }, ...NETWORK_OPTIONS],
      },
      {
        id: "incomeBucket",
        field: "incomeBucket",
        label: "What is your annual income range?",
        description: "Used to score eligibility fit and improve Smart Match %. ",
        options: INCOME_OPTIONS,
      },
      {
        id: "monthlySpend",
        field: "monthlySpend",
        label: "How much do you spend per month (₹)?",
        description: "Enter your actual monthly expense so recommendations are calculated from it.",
        inputType: "number",
        min: 1000,
        max: 200000,
        placeholder: "e.g. 25000",
      },
    ];

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("card-to-buy-quiz:", error);
    return NextResponse.json({ message: "Failed to load quiz" }, { status: 500 });
  }
}
