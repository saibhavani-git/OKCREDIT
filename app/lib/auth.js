import jwt from "jsonwebtoken";

export function verifyAuth(request) {
  const token = request.cookies.get("authToken")?.value;

  // If token does not exist, throw error
  if (!token) {
    throw new Error("Unauthorized: No token provided");
  }

  try {
    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // decoded.userId is ALWAYS a string because:
    // 1. user._id is ObjectId in MongoDB
    // 2. JWT.sign() converts ObjectId → string (JSON can't store ObjectId)
    // 3. JWT.verify() returns string (not ObjectId)
    // So we can safely assume it's always a string
    return { userId: decoded.userId }; // This is always a string
  } catch (err) {
    // If token invalid or expired
    return NextResponse.json({ message: "Unauthorized: Invalid or expired token" }, { status: 401 });
  }
}

