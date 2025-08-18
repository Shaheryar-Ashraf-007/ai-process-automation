import dotenv from 'dotenv';
import express from 'express';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.route.js';

const app = express()

dotenv.config()

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes)

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);

    
})


