import User from "../../models/user";
import CreditCard from "../../models/cards";
import { NextResponse } from "next/server";
import dbConnect from "../../lib/db";
import { verifyAuth } from "../../lib/auth";

export async function GET(request) {
  try {
    await dbConnect();
    
    // Use verifyAuth to get userId
    // Note: userId from JWT is ALWAYS a string (JWT converts ObjectId → string)
    const { userId } = verifyAuth(request);
    
    // Mongoose findById() accepts strings directly, no conversion needed!
    const user = await User.findById(userId)
      .populate('cards')
      .lean(); // Use lean() AFTER populate to get plain objects
    
    if (!user) {
      return NextResponse.json([], { status: 200 });
    }
    
    // Return populated cards (or empty array if none)
    return NextResponse.json(user.cards || []);
  } catch (e) {
    console.error("Error in userCards route:", e);
    if (e.message.includes("Unauthorized")) {
      return NextResponse.json(
        { message: e.message },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { message: e.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    
    // Use verifyAuth to get userId
    const { userId } = verifyAuth(request);
    
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
    if (e.message.includes("Unauthorized")) {
      return NextResponse.json(
        { message: e.message },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { message: e.message || "Internal server error" },
      { status: 500 }
    );
  }
}

