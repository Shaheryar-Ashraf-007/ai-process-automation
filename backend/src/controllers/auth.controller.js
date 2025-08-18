import { PrismaClient } from '@prisma/client'; // Ensure you're importing PrismaClient
const prisma = new PrismaClient(); // Create an instance of PrismaClient
import Jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export async function signup(req, res) {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (password.length < 6) { // Fixed typo from 'lenght' to 'length'
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        
        const existingUser = await prisma.user.findUnique({ where: { email } }); // Use the correct function

        if (existingUser) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10); 

        // Assuming you have a userId after user creation
        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password :hashedPassword,
            },
        })

        const token = Jwt.sign({ userId: newUser._id }, process.env.JWT_KEY, { expiresIn: '7d' });

        res.cookie("jwt", token, {
            maxAge: 7 * 24 * 60 * 60 * 1000,
            httpOnly: true,
            sameSite: "strict",
            secure: process.env.NODE_ENV === "production",
        });

        res.status(201).json({ success: true, user:{
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            password: newUser.password, 
            createdAt: newUser.createdAt,
            updatedAt: newUser.updatedAt,
        } } );

    } catch (error) {
        console.error("Error during signup:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

export async function login(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // Compare the provided password with the stored hashed password
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // Generate a JWT token
        const token = Jwt.sign({ userId: user.id }, process.env.JWT_KEY, {
            expiresIn: "7d",
        });

        res.cookie("jwt", token, {
            maxAge: 7 * 24 * 60 * 60 * 1000,
            httpOnly: true, // prevent XSS attacks
            sameSite: "strict", // prevent CSRF attacks
            secure: process.env.NODE_ENV === "production",
        });

        res.status(200).json({ success: true, user: { id: user.id, name: user.name, email: user.email } });
    } catch (error) {
        console.log("Error in login controller", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

export async function logout(req, res) {

    res.clearCookie("jwt");
    res.status(200).json({ success: true, message: "Logout successful" });
    } 