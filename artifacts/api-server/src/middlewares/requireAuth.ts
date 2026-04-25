import type { Request, Response, NextFunction } from "express";
import { activeSessions } from "../routes/auth";

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token || !activeSessions.has(token)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  (req as unknown as Record<string, unknown>).userId = "owner";
  next();
};
