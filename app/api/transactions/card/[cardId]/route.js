import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "../../../../lib/db";
import { verifyAuth } from "../../../../lib/auth";
import Transaction from "../../../../models/transaction";

export async function GET(request, { params }) {
  try {
    await dbConnect();

    const token = request.cookies.get("authToken")?.value;
    if (!token) {
      return NextResponse.json(
        { message: "Please log in to view transactions" },
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

    const { cardId } = await (typeof params?.then === "function" ? params : Promise.resolve(params || {}));
    if (!cardId) {
      return NextResponse.json(
        { message: "Card id is required", transactions: [] },
        { status: 400 }
      );
    }

    const userObjId = new mongoose.Types.ObjectId(userId);

    const txns = await Transaction.find(
      { user: userObjId, card: cardId },
      {
        amount: 1,
        intent: 1,
        resolvedCategory: 1,
        cashback: 1,
        rewardsValue: 1,
        perksValue: 1,
        totalBenefit: 1,
        createdAt: 1,
      }
    )
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ transactions: txns });
  } catch (error) {
    console.error("Error loading card transactions", error);
    return NextResponse.json(
      { message: "Failed to load card transactions" },
      { status: 500 }
    );
  }
}

