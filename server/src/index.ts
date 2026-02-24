import { app } from './app.js'
import dotenv from 'dotenv'

dotenv.config({ path: '../.env' })

const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
  console.log(`DepScan server running on port ${PORT}`)
})
