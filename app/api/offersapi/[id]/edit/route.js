import { NextResponse } from "next/server";
import dbConnect from "@/app/lib/db";
import Offer from "@/app/models/offers";

export async function PUT(request, { params }) {
    const { id } = await params;
  
    try {
        await dbConnect();
      const data = await request.json();
  
      const offer = await Offer.findByIdAndUpdate(
        id,
        data,
        { new: true, runValidators: true }
      );
  
      if (!offer) {
        return NextResponse.json(
          { message: "offer not found" },
          { status: 404 }
        );
        }
  
      return NextResponse.json({ message: "updated successfully" }, { status: 200 });
    } catch (e) {
      return NextResponse.json(
        { message: "error in updating offer" },
        { status: 500 }
      );
    }
}
  