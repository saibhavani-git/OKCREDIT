import User from "../../models/user";
import CreditCard from "../../models/cards";
import { NextResponse } from "next/server";
import dbConnect from "../../lib/db";
import { verifyAuth } from "../../lib/auth";

export async function GET(request) {
  try {
    await dbConnect();
    
    const token = request.cookies.get("authToken")?.value;
    const userData = verifyAuth(token);
    if (!userData) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }
    const { userId } = userData;
    const user = await User.findById(userId)
      .populate('cards')
      .lean();
    
    if (!user) {
      return NextResponse.json([], { status: 200 });
    }
    
    return NextResponse.json(user.cards || []);
  } catch (e) {
    console.error("Error in userCards route:", e);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    
    const token = request.cookies.get("authToken")?.value;
    const userData = verifyAuth(token);
    if (!userData) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }
    const { userId } = userData;
    
    // Get cardId from request body
    const { cardId } = await request.json();
    
    if (!cardId) {
      return NextResponse.json(
        { message: "Card ID is required" },
        { status: 400 }
      );
    }
    
    // Check if card exists
    const card = await CreditCard.findById(cardId);
    if (!card) {
      return NextResponse.json(
        { message: "Card not found" },
        { status: 404 }
      );
    }
    
    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }
    
    // Check if user already has this card
    if (user.cards.includes(cardId)) {
      return NextResponse.json(
        { message: "Card already added" },
        { status: 400 }
      );
    }
    
    // Add card to user
    user.cards.push(cardId);
    await user.save();
    
    return NextResponse.json(
      { message: "Card added successfully" },
      { status: 200 }
    );
  } catch (e) {
    console.error("Error adding card:", e);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

