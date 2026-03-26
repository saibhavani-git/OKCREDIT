import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "../../../lib/db";
import { verifyAuth } from "../../../lib/auth";
import User from "../../../models/user";
import Transaction from "../../../models/transaction";
import CreditCard from "../../../models/cards";

function parseMonthKey(monthKey) {
  const raw = String(monthKey || "").trim();
  const m = /^(\d{4})-(\d{2})$/.exec(raw);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) return null;
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
  return { year, month, start, end, key: `${year}-${String(month).padStart(2, "0")}` };
}

export async function GET(request) {
  try {
    await dbConnect();

    const token = request.cookies.get("authToken")?.value;
    if (!token) {
      return NextResponse.json(
        { message: "Please log in to view your analysis" },
        { status: 401 }
      );
    }

    const verified = await verifyAuth(token);
    const userId = verified?.userId;
    if (!userId) {
      return NextResponse.json(
        { message: "Invalid or expired session. Please log in again." },
        { status: 401 }
      );
    }

    const userObjId = mongoose.Types.ObjectId.isValid(userId)
      ? new mongoose.Types.ObjectId(userId)
      : userId;
    const { searchParams } = new URL(request.url);
    const monthKey = searchParams.get("month");
    const period = parseMonthKey(monthKey);
    const matchFilter = { user: userObjId };
    const scopedMatchFilter = period
      ? { ...matchFilter, createdAt: { $gte: period.start, $lt: period.end } }
      : matchFilter;

    // Aggregate monthly spend & savings for this user (or guest)
    const pipeline = [
      { $match: matchFilter },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          totalSpend: { $sum: "$amount" },
          totalSavings: { $sum: "$totalBenefit" },
          cashback: { $sum: "$cashback" },
          rewardsValue: { $sum: "$rewardsValue" },
          perksValue: { $sum: "$perksValue" },
        },
      },
      {
        $project: {
          _id: 0,
          year: "$_id.year",
          month: "$_id.month",
          totalSpend: 1,
          totalSavings: 1,
          cashback: 1,
          rewardsValue: 1,
          perksValue: 1,
        },
      },
      { $sort: { year: -1, month: -1 } },
    ];

    const raw = await Transaction.aggregate(pipeline);

    const months = raw.map((m) => ({
      year: m.year,
      month: m.month,
      label: new Date(m.year, m.month - 1, 1).toLocaleString("en-IN", {
        month: "short",
        year: "2-digit",
      }),
      totalSpend: m.totalSpend,
      totalSavings: m.totalSavings,
      cashback: m.cashback,
      rewardsValue: m.rewardsValue,
      perksValue: m.perksValue,
    }));

    // Simple derived credit score-style number (purely illustrative)
    const lifetimeSpend = months.reduce((s, m) => s + (m.totalSpend || 0), 0);
    const lifetimeSavings = months.reduce((s, m) => s + (m.totalSavings || 0), 0);
    const savingsRate = lifetimeSpend > 0 ? lifetimeSavings / lifetimeSpend : 0;

    const scopedTotalsAgg = await Transaction.aggregate([
      { $match: scopedMatchFilter },
      {
        $group: {
          _id: null,
          totalSpend: { $sum: "$amount" },
          totalSavings: { $sum: "$totalBenefit" },
        },
      },
    ]);
    const scopedTotalSpend = Number(scopedTotalsAgg?.[0]?.totalSpend) || 0;
    const scopedTotalSavings = Number(scopedTotalsAgg?.[0]?.totalSavings) || 0;
    const scopedSavingsRate = scopedTotalSpend > 0 ? scopedTotalSavings / scopedTotalSpend : 0;

    // Base 650, reward responsible savings up to 100 points
    const creditScoreEstimate = Math.round(
      650 + Math.min(100, savingsRate * 1000)
    );
    const scopedCreditScoreEstimate = Math.round(
      650 + Math.min(100, scopedSavingsRate * 1000)
    );

    // Per-card totals: spend and savings (for view analysis)
    const perCardTotalsAgg = await Transaction.aggregate([
      { $match: scopedMatchFilter },
      {
        $group: {
          _id: "$card",
          totalSpend: { $sum: "$amount" },
          totalSavings: {
            $sum: {
              $ifNull: [
                "$totalBenefit",
                { $add: [{ $ifNull: ["$cashback", 0] }, { $ifNull: ["$rewardsValue", 0] }, { $ifNull: ["$perksValue", 0] }] },
              ],
            },
          },
        },
      },
    ]);
    const perCardTotals = perCardTotalsAgg.reduce((acc, row) => {
      acc[String(row._id)] = {
        totalSpend: row.totalSpend || 0,
        totalSavings: row.totalSavings || 0,
      };
      return acc;
    }, {});

    // Spend by card and category (lifetime)
    const cardCategoryAgg = await Transaction.aggregate([
      { $match: scopedMatchFilter },
      {
        $group: {
          _id: { card: "$card", category: "$resolvedCategory" },
          totalSpend: { $sum: "$amount" },
        },
      },
    ]);

    const cardIds = [...new Set(cardCategoryAgg.map((c) => c._id.card).filter(Boolean))];
    const cards = cardIds.length
      ? await CreditCard.find(
          { _id: { $in: cardIds } },
          { bank: 1, cardName: 1, "limits.max": 1 }
        ).lean()
      : [];
    const cardMap = new Map(cards.map((c) => [String(c._id), c]));

    const perCardCategory = cardCategoryAgg.map((row) => {
      const cardId = String(row._id.card);
      const meta = cardMap.get(cardId);
      return {
        cardId,
        bank: meta?.bank ?? "",
        cardName: meta?.cardName ?? "Card",
        limitMax: meta?.limits?.max ?? 0,
        category: row._id.category || "shopping",
        totalSpend: row.totalSpend,
      };
    });

    // Fetch all user's cards for left sidebar
    const userDoc = await User.findById(userId).populate("cards", "bank cardName limits").lean();
    const userCards = (userDoc?.cards || []).map((c) => ({
      _id: String(c._id),
      bank: c.bank || "",
      cardName: c.cardName || "Card",
      limitMax: c.limits?.max ?? 0,
    }));

    return NextResponse.json({
      months,
      selectedMonth: period?.key || null,
      userCards,
      perCardTotals,
      lifetime: {
        totalSpend: lifetimeSpend,
        totalSavings: lifetimeSavings,
        savingsRate,
        creditScoreEstimate,
      },
      periodTotals: {
        totalSpend: scopedTotalSpend,
        totalSavings: scopedTotalSavings,
        savingsRate: scopedSavingsRate,
        creditScoreEstimate: scopedCreditScoreEstimate,
      },
      perCardCategory,
    });
  } catch (error) {
    console.error("Error loading monthly summary:", error);
    return NextResponse.json(
      { message: "Failed to load monthly summary" },
      { status: 500 }
    );
  }
}

