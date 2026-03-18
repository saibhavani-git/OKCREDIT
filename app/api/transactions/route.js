import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "../../lib/db";
import { verifyAuth } from "../../lib/auth";
import CreditCard from "../../models/cards";
import Transaction from "../../models/transaction";

/** GET: List all transactions for the logged-in user. Query: cardId (optional), limit (default 100). */
export async function GET(request) {
  try {
    await dbConnect();
    const token = request.cookies.get("authToken")?.value;
    if (!token) {
      return NextResponse.json({ message: "Please log in" }, { status: 401 });
    }
    const verified = await verifyAuth(token);
    const userId = verified?.userId;
    if (!userId) {
      return NextResponse.json({ message: "Invalid or expired session" }, { status: 401 });
    }
    const userObjId = mongoose.Types.ObjectId.isValid(userId)
      ? new mongoose.Types.ObjectId(userId)
      : userId;
    const { searchParams } = new URL(request.url);
    const cardId = searchParams.get("cardId") || null;
    const limit = Math.min(Number(searchParams.get("limit")) || 100, 500);
    const match = { user: userObjId };
    if (cardId && mongoose.Types.ObjectId.isValid(cardId)) {
      match.card = new mongoose.Types.ObjectId(cardId);
    }
    const transactions = await Transaction.find(match)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    return NextResponse.json({ transactions });
  } catch (error) {
    console.error("GET /api/transactions:", error);
    return NextResponse.json({ message: "Failed to load transactions" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();

    const token = request.cookies.get("authToken")?.value;
    if (!token) {
      return NextResponse.json(
        { message: "Please log in to record a transaction" },
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

    const body = await request.json();
    const {
      cardId,
      cardName: bodyCardName,
      amount,
      intent,
      resolvedCategory,
      cashback = 0,
      rewards = 0,
      rewardsValue = 0,
      perksValue = 0,
      totalBenefit = 0,
    } = body || {};

    if (!cardId || !amount || !intent) {
      return NextResponse.json(
        { message: "cardId, amount and intent are required" },
        { status: 400 }
      );
    }

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return NextResponse.json(
        { message: "Valid amount is required" },
        { status: 400 }
      );
    }

    const card = await CreditCard.findById(cardId).lean();
    if (!card) {
      return NextResponse.json(
        { message: "Card not found" },
        { status: 404 }
      );
    }

    const cardName = bodyCardName || card.cardName || "Unknown Card";
    const userObjId = mongoose.Types.ObjectId.isValid(userId)
      ? new mongoose.Types.ObjectId(userId)
      : userId;

    // Amount = card spent; cashback + rewardsValue + perksValue = card savings
    const cashbackNum = Number(cashback) || 0;
    const rewardsValueNum = Number(rewardsValue) || 0;
    const perksValueNum = Number(perksValue) || 0;
    const sumParts = cashbackNum + rewardsValueNum + perksValueNum;
    const fromRequest = Number(totalBenefit);
    const totalBenefitNum =
      Number.isFinite(fromRequest) && fromRequest > 0 ? fromRequest : sumParts;

    const txn = await Transaction.create({
      user: userObjId,
      card: cardId,
      cardName,
      amount: numericAmount,
      intent,
      resolvedCategory: resolvedCategory || "shopping",
      cashback: cashbackNum,
      rewards: Number(rewards) || 0,
      rewardsValue: rewardsValueNum,
      perksValue: perksValueNum,
      totalBenefit: totalBenefitNum,
    });

    // Attach this transaction to the card's transaction history array
    await CreditCard.findByIdAndUpdate(cardId, {
      $push: { transactions: txn._id },
    });

    return NextResponse.json(
      {
        message: "Transaction recorded successfully",
        transactionId: txn._id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error recording transaction:", error);
    return NextResponse.json(
      { message: "Failed to record transaction" },
      { status: 500 }
    );
  }
}

