import express from "express";
import cors from 'cors'
import dotenv from 'dotenv'
import { connectDB } from "./config/db.js";
import userRouter from './routes/user.js'
import movieRouter from './routes/movie.js'
import { errHandler } from "./middlewares/errorMiddleware.js";

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json({ limit: '10mb' }))

// Connect DB
connectDB()

// Main route
app.get('/', (req, res) => {
    res.send("API is running...")
})

//  Other routes
app.use("/api/users", userRouter)
app.use("/api/movies", movieRouter)

//  Error handling middlewares
app.use(errHandler)

const PORT = process.env.PORT || 4000

app.listen(PORT, () => {
    console.log(`Server running in http://localhost:${PORT}`)
})