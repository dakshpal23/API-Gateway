import jwt from 'jsonwebtoken'
import 'dotenv/config'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret'

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded // { userId, email, iat, exp }

    // Forward user identity to downstream services via header
    req.headers['x-user-id'] = String(decoded.userId)
    req.headers['x-user-email'] = decoded.email

    next()
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' })
  }
}