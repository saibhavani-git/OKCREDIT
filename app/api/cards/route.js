import CreditCard from "../../models/cards";
import { NextResponse } from "next/server";
import dbConnect from "../../lib/db";

export async function GET() {
  try {
    await dbConnect();
    
    // Get all cards from database
    const cards = await CreditCard.find({}).lean();
    
    return NextResponse.json(cards);
  } catch (e) {
    console.error("Error in cards route:", e);
    return NextResponse.json(
      { message: e.message || "Internal server error" },
      { status: 500 }
    );
  }
}

