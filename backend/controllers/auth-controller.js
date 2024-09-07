import { generateTokenAndSetCookie } from "../lib/utils/generateToken.js";
import User from "../models/userModel.js";
import bcrypt from "bcryptjs";

// Signup
export const signup = async (req, res) => {
    try {
        const {fullName, username, email, password} = req.body;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: "Invalid email format"});
        }
        
        // Find if username already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: "Username is already taken"});
        }


        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({ error: "Email is already registered"});
        }

        if (password.length < 6) {
            return res.status(400).json({ error: "Password must be atleast 6 characters long"})
        }

        // Hash Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            fullName,
            username,
            email,
            password: hashedPassword
        });

        if (newUser) {
            generateTokenAndSetCookie(newUser._id, res)
            await newUser.save();

            res.status(201).json({message: "User created succcessfully"});
        } else {
            res.status(400).json({error: "Invalid user data"});
        }
    } catch (error) {
        console.log("Error in signup controller", error.message);
        res.status(500).json({error: "Internal Server Error"});
    }
}

// Login
export const login = async (req, res) => {
    try {
        
        const { username, password} = req.body;
        const user = await User.findOne({username});
        const isPasswordCorrect = await bcrypt.compare(password, user?.password || "");

        if (!user || !isPasswordCorrect) {
            return res.status(400).json({ error: "Invalid username or password"})
        }

        generateTokenAndSetCookie(user._id, res);

        res.status(200).json(user);

    } catch (error) {
        console.log("Error in login controller", error.message);
        res.status(500).json({error: "Internal Server Error"});
    }
}

// Logout
export const logout = async (req, res) => {
    try {
        res.cookie("jwt","",{maxAge:0})
        res.status(200).json({message: "Logged out successfully"})
    } catch (error) {
        console.log("Error in logout controller", error.message);
        res.status(500).json({error: "Internal Server Error"});
    }
}


// To check if user is authenticated or not
export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("-password");
        res.status(200).json(user);
    } catch (error) {
        console.log("Error in getME conteoller", error.message);
        res.status(500).json({error: "Internal Server Error"});
    }
}
