import express from 'express'

const app = express()

app.use(express.json())
const PORT = process.env.PORT || 3001;


app.post('/login', (req, res) => {
    const {email, password} = req.body

    console.log(email , password)

    res.json({
        message: 'Login success',
        token: 'fake-tokenabc123'
    })
})

app.listen(PORT, () => {
    console.log(`Auth service running on port ${PORT}`)
})