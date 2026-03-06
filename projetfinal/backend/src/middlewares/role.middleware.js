export const requireRole = (role) => {
  return (req, res, next) => {
    // req.user vient de authMiddleware (JWT)
    if (!req.user || !req.user.role) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // tolère admin / ADMIN
    const userRole = String(req.user.role).toLowerCase();
    const needed = String(role).toLowerCase();

    if (userRole !== needed) {
      return res.status(403).json({ error: "Forbidden" });
    }

    next();
  };
};
