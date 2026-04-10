import jwt from 'jsonwebtoken'

export const verifyToken = (req, res, next) => {
    const authHeader = req.headers["authorization"]
    // token format: Bearer <token>
    if (!authHeader) {
        return res.status(401).json({ error: "No token provided" });
  }
    const token = authHeader.split(" ")[1]
    try {
    const decoded = jwt.verify(token, "secretkey");
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid token" });
  }
}