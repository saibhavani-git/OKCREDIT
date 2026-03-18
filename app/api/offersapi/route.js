import { NextResponse } from "next/server";
import dbConnect from "@/app/lib/db";
import Offer from '../../models/offers'

export async function GET(){
    try{
        await dbConnect();
        const now = new Date();
        // Delete expired offers automatically (validTill has passed)
        await Offer.deleteMany({ validTill: { $lt: now } });
        // Return only offers that are still valid (validTill >= now, validFrom <= now)
        const allOffers = await Offer.find({
            validFrom: { $lte: now },
            validTill: { $gte: now },
        }).sort({ validTill: 1 });
        if(!allOffers || allOffers.length === 0){
            return NextResponse.json([], { status: 200 });
        }
        return NextResponse.json(allOffers);
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

