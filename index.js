const express = require('express')
const path = require('path')
const app = express()
const containerRoutes = require('./routes/containerRoutes')
require('dotenv').config()

app.use('/container', containerRoutes)

const PORT = process.env.PORT || 6000

app.use(express.static(path.join(__dirname, 'front')))

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'front', 'index.html'))
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
