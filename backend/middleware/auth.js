import jwt from "jsonwebtoken";

// Middleware to authenticate JWT token
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  let token = authHeader && authHeader.split(' ')[1];

  // Allow token to be supplied via query param for certain client flows (e.g., opening PDF links)
  if (!token) {
    token = req.query?.access_token || req.query?.token || null;
  }

  if (!token) {
    return res.status(401).json({ error: "Access token is missing" });
  }

  jwt.verify(token, process.env.JWT_SECRET || "tailorx_secret", (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
};

// Middleware to restrict access to Admins only
export const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Access denied. Admin role required." });
  }
  next();
};
