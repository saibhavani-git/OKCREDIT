import { NextResponse } from "next/server";
import dbConnect from "@/app/lib/db";
import Offer from '../../models/offers'

export async function GET(){
    try{
        await dbConnect();
        const allOffers = await Offer.find();
    if(!allOffers){
        return NextResponse.json({message:"offers are missing"},{status:400})
    }
    return NextResponse.json(allOffers)
    }
    catch(e){
        return NextResponse.json({message:"something went wrong", error: e.message},{status:500})
    }
}

export async function POST(request){
    try{
        await dbConnect();
        const data = await request.json();
        const offer = new Offer(data);
        await offer.save();
        return NextResponse.json({message:"offer created successfully", offer},{status:201})
    }
    catch(e){
        return NextResponse.json({message:"error in creating offer", error: e.message},{status:500})
    }
}

