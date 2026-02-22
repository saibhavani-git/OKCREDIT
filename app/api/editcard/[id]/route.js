import { NextResponse } from "next/server";
import dbConnect from "@/app/lib/db";
import CreditCard from "@/app/models/cards";

export async function GET(request, { params }) {
  const { id } = await params;

  try {
    await dbConnect();

    const card = await CreditCard.findById(id);

    if (!card) {
      return NextResponse.json(
        { message: "Card not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(card, { status: 200 });

  } catch (error) {
    return NextResponse.json(
      { message: "Error finding card", error: error.message },
      { status: 500 }
    );
  }
}


export async function PUT(request,{params}){
   
    const { id } = await params;

    try{
          await dbConnect();
           const data = await request.json();
          const card = await CreditCard.findByIdAndUpdate(id,data);

          if (!card) {
            return NextResponse.json(
              { message: "Card not found" },
              { status: 404 }
            );
          }
          
          return NextResponse.json({message:"updated successfully"},{status : 200})
        
    }
    catch(e){
        return NextResponse.json({message:"error in updating"},{status:500})
    }
}