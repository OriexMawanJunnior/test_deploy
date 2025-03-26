import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";

// Define the user schema
const UserSchema = z.object({
  sub: z.string(),
  email: z.string().email()
});

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user: z.infer<typeof UserSchema>;
    }
  }
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ message: "No token provided" });
      return;
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      res.status(401).json({ message: "No token provided" });
      return;
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
    
    // Validate user data with Zod
    const user = UserSchema.parse(decoded);
    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ message: "Invalid token" });
      return;
    }
    if (error instanceof z.ZodError) {
      res.status(401).json({ message: "Invalid user data" });
      return;
    }
    console.error("Error in authMiddleware:", error);
    res.status(500).json({ message: "Internal server error" });
    return;
  }
}; 