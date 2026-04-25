import { Router } from "express";
import crypto from "crypto";

const router = Router();

const activeSessions = new Set<string>();

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

router.post("/auth/login", (req, res) => {
  const { password } = req.body as { password: string };
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    res.status(500).json({ error: "ADMIN_PASSWORD not configured" });
    return;
  }

  if (!password || password !== adminPassword) {
    res.status(401).json({ error: "Wrong password" });
    return;
  }

  const token = generateToken();
  activeSessions.add(token);
  res.json({ token });
});

router.get("/auth/verify", (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (token && activeSessions.has(token)) {
    res.json({ valid: true });
  } else {
    res.status(401).json({ valid: false });
  }
});

router.post("/auth/logout", (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (token) activeSessions.delete(token);
  res.json({ ok: true });
});

export { activeSessions };
export default router;
