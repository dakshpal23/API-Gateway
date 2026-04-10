import express from 'express'

const app = express()
app.use(express.json())

app.get('/orders', (req, res) => {
    res.json([
        {
            id: 1,
            product: 'Laptop',
            amount: 2000
        },
        {
            id: 2,
            product: 'Mouse',
            amount: 50
        }
    ])
})

app.listen(3002, () => {
    console.log('Order service running on port 3002')
})