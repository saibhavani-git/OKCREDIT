import { NextResponse } from "next/server";
import dbConnect from "../../../lib/db";
import User from "../../../models/user";
import bcrypt from "bcryptjs";
import generateToken from "../../../lib/generateToken";

export async function POST(request) {
  try {
    await dbConnect();

    const { email, password } = await request.json();

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { message: "Invalid password" },
        { status: 401 }
      );
    }

    const token = generateToken(user);
    const response = NextResponse.json({ 
      message: 'SuccessFull',
      userRole: user.role 
    });
    response.cookies.set('authToken', token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 12,
      path: '/'
    });
    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}
