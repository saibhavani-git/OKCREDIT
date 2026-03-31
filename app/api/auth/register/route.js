import { NextResponse } from "next/server";
import dbConnect from "../../../lib/db";
import User from "../../../models/user";
import bcrypt from "bcryptjs";
import generateToken from "../../../lib/generateToken";

export async function POST(request) {
  try {
    await dbConnect();
    const data = await request.json();
    const email = String(data?.email || "").trim().toLowerCase();
    const username = String(data?.username || "").trim();
    const password = data?.password;
    const rawRole = String(data?.role || "user").toLowerCase();
    const role = rawRole === "admin" ? "admin" : "user";

    if (!email || !username || !password) {
      return NextResponse.json(
        { message: "Username, email, and password are required" },
        { status: 400 }
      );
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json(
        { message: "You have already registered with this email" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      role,
    });

    const token = generateToken(newUser);
    const response = NextResponse.json(
      { message: "Registration successful", userRole: newUser.role },
      { status: 201 }
    );
    response.cookies.set("authToken", token, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 12,
      path: "/",
    });
    return response;
  } catch (e) {
    console.error("[auth/register]", e);
    const msg =
      e?.message?.includes("MONGODB_URI") || !process.env.MONGODB_URI
        ? "Database not configured: set MONGODB_URI in .env"
        : e.message || "Registration failed";
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}
