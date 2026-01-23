import jwt from "jsonwebtoken";

// Unified function to verify JWT token
// Returns { userId, userRole } if valid, null if invalid or missing
export function verifyAuth(token) {
  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return { userId: decoded.userId, userRole: decoded.userRole };
  } catch {
    return null;
  }
}

