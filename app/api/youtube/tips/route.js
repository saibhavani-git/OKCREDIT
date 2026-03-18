import { NextResponse } from "next/server";
import dbConnect from "../../../lib/db";
import Tip from "../../../models/Tip";

export const dynamic = "force-dynamic";

/** GET: Return stored credit card tips from the tips collection (no RAG run). */
export async function GET() {
  try {
    await dbConnect();
    const tips = await Tip.find({ source: "youtube" })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();
    return NextResponse.json({
      tips: tips.map((t) => ({ category: t.category, tip: t.tip, source: t.source })),
    });
  } catch (error) {
    console.error("[youtube/tips]", error);
    return NextResponse.json({ message: "Failed to load tips", tips: [] }, { status: 500 });
  }
}
