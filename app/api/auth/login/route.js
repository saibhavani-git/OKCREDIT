import { NextResponse } from "next/server";
import dbConnect from "../../../lib/db";
import User from "../../../models/user";
import bcrypt from "bcryptjs";
import generateToken from "../../../lib/generateToken";

export async function POST(request) {
  try {
    await dbConnect();
   // console.log("MONGO URI:", process.env.MONGODB_URI);

    const body = await request.json();
    const email = String(body?.email || "").trim().toLowerCase();
    const password = body?.password;
    const accountType = String(body?.accountType || "")
      .toLowerCase()
      .trim();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // ✅ THIS IS THE FIX
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return NextResponse.json(
        { message: "Invalid password" },
        { status: 401 }
      );
    }

    if (accountType === "admin" && user.role !== "admin") {
      return NextResponse.json(
        { message: "This account is not an admin. Sign in as user instead." },
        { status: 403 }
      );
    }
    if (accountType === "user" && user.role !== "user") {
      return NextResponse.json(
        { message: "This account is an admin. Use admin sign-in instead." },
        { status: 403 }
      );
    }

      const token = generateToken(user)
     // console.log(token)
     const response =NextResponse.json({message:'SuccessFull',userRole:user.role})
      response.cookies.set('authToken',token,{
        httpOnly: true,
        //secure: process.env.NODE_ENV === 'production', // Enable HTTPS in the production environment
        sameSite: 'lax', // Prevent CSRF attacks
        maxAge: 60*60*12,
        path: '/'
      });
      return response
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}
