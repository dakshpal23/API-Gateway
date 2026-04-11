import express from 'express'
import jwt from 'jsonwebtoken'
import 'dotenv/config'

const app = express()
app.use(express.json())

const PORT = process.env.PORT || 3001
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret'

// Hardcoded demo user — replace with DB lookup when ready
const DEMO_USER = { id: 1, email: 'user@example.com', password: 'password123' }

app.post('/login', (req, res) => {
  const { email, password } = req.body

  if (email !== DEMO_USER.email || password !== DEMO_USER.password) {
    return res.status(401).json({ message: 'Invalid credentials' })
  }

  const token = jwt.sign(
    { userId: DEMO_USER.id, email: DEMO_USER.email },
    JWT_SECRET,
    { expiresIn: '1h' }
  )

  res.json({
    message: "Login successful",
    token: token
   })
})

app.listen(PORT, () => {
  console.log(`Auth service running on port ${PORT}`)
})