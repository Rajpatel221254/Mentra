import express from "express";
import cookieParser from 'cookie-parser'
import cors from 'cors'

const app = express();

app.use(express.json())
app.use(cookieParser())

// import Router
import authRouter from "./routes/auth.routes.js";

// Router mapping
app.use('/api/auth', authRouter)

export default app;