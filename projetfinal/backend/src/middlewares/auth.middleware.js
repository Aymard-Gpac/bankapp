import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/jwt.js";

export const verifyToken = (req, res, next) => {

  const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Token manquant" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: Number(decoded.id), role: decoded.role };
    return next();
  } catch (e) {
    console.log("JWT ERROR:", e.message); // DEBUG
    return res.status(401).json({ error: "Token invalide" });
  }
};


export const authMiddleware = (req, res, next) => {
  const header = req.headers.authorization;
  const bearer = header?.startsWith("Bearer ") ? header.slice(7) : null;

  const cookieToken = req.cookies?.token;

  const token = bearer || cookieToken;

  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload
    next();
  } catch (e) {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

export const requireRoles = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: "Non authentifié" });
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: "Accès refusé" });
  }
  next();
};