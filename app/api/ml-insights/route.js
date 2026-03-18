import { NextResponse } from "next/server";
import dbConnect from "../../lib/db";
import Transaction from "../../models/transaction";
import { verifyAuth } from "../../lib/auth";
import { buildUserProfile } from "../../lib/mlRecommender";

export async function GET(request) {
  try {
    await dbConnect();

    const token = request.cookies.get("authToken")?.value;
    if (!token) {
      return NextResponse.json(
        { message: "Please log in to view insights" },
        { status: 401 }
      );
    }

    const verified = await verifyAuth(token);
    const userId = verified?.userId;
    if (!userId) {
      return NextResponse.json(
        { message: "Invalid or expired session" },
        { status: 401 }
      );
    }

    const transactions = await Transaction.find({ user: userId }).lean();

    if (!transactions || transactions.length < 5) {
      return NextResponse.json(
        {
          message: `Need at least 5 transactions to generate insights. You have ${transactions?.length || 0}.`,
          transactionCount: transactions?.length || 0,
          mlEnabled: false,
          insights: null,
        },
        { status: 200 }
      );
    }

    const profile = await buildUserProfile(transactions);
    if (!profile) {
      return NextResponse.json(
        {
          message: "Could not build profile from transactions",
          transactionCount: transactions.length,
          mlEnabled: false,
          insights: null,
        },
        { status: 200 }
      );
    }

    // Derive insights from user profile
    const insights = {
      preferredCategories: profile.preferredCategories || [],
      categoryBreakdown: profile.categoryPreferences
        ? Object.entries(profile.categoryPreferences).map(([cat, data]) => ({
            category: cat,
            count: data.count,
            totalSpend: data.totalSpend,
            avgBenefit: data.avgBenefit,
          }))
        : [],
      amountRanges: profile.amountRanges || {},
      topCardsByUsage: profile.cardPerformance
        ? Object.entries(profile.cardPerformance)
            .sort((a, b) => (b[1].usageCount || 0) - (a[1].usageCount || 0))
            .slice(0, 5)
            .map(([cardId, data]) => ({
              cardId,
              usageCount: data.usageCount,
              totalBenefit: data.totalBenefit,
              avgBenefit: data.avgBenefit,
            }))
        : [],
      timePatterns: profile.timePatterns || {},
      avgTransactionAmount: profile.avgTransactionAmount || 0,
    };

    return NextResponse.json(
      {
        message: "ML insights generated successfully",
        transactionCount: transactions.length,
        mlEnabled: true,
        insights,
        modelStats: {
          totalTransactions: profile.totalTransactions,
          uniqueCategories: Object.keys(profile.categoryPreferences || {}).length,
          uniqueAmountRanges: Object.keys(profile.amountRanges || {}).length,
          uniqueCards: Object.keys(profile.cardPerformance || {}).length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error generating ML insights:", error);
    return NextResponse.json(
      { message: "Failed to generate insights" },
      { status: 500 }
    );
  }
}
