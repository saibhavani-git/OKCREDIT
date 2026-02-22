import { NextResponse } from "next/server";
import dbConnect from "../../lib/db";
import User from "../../models/user";

export async function GET(request){
    await dbConnect();
    try{
        const allUsers = await User.find().lean();
        if(!allUsers){
            return NextResponse.json({message:"no users found"},{status:500})
        }
        return NextResponse.json(allUsers)
    }
    catch(e){
        return NextResponse.json({message: e.message},{status:500})
    }
}
