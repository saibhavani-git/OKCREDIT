import { NextResponse } from "next/server";
import dbConnect from "../../lib/db";
import Transaction from "../../models/transaction";
import { verifyAuth } from "../../lib/auth";
import { buildIntentAmountModel, analyzeIntentAmountPatterns } from "../../lib/mlRecommender";

export async function GET(request) {
  try {
    await dbConnect();

    // Verify user is authenticated
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

    // Fetch user's transactions
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

    // Build ML model
    const mlModel = buildIntentAmountModel(transactions);

    // Analyze patterns
    const insights = analyzeIntentAmountPatterns(mlModel);

    return NextResponse.json(
      {
        message: "ML insights generated successfully",
        transactionCount: transactions.length,
        mlEnabled: true,
        insights,
        modelStats: {
          totalTransactions: mlModel.totalTransactions,
          uniqueIntents: Object.keys(mlModel.intentPatterns).length,
          uniqueAmountRanges: Object.keys(mlModel.amountPatterns).length,
          uniqueCards: Object.keys(mlModel.cardIntentMatrix).length,
          intentAmountCombinations: Object.keys(mlModel.intentAmountCardMap).length,
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
