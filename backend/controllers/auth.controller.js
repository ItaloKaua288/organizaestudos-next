import User from '../models/user.model.js';
import crypto from 'crypto';
import bcryptjs from 'bcryptjs';
import { generateTokenAndSetCookie } from '../utils/genereteTokenAndSetCookie.js';
import { sendPasswordResetEmail, sendResetPasswordconfirmationEmail, sendWelcomeEmail } from '../mailtrap/emails.js';


export const checkAuth = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select("-password");
        if (!user) {
            return res.status(401).json({ success: false, message: "Unauthorized - user not found" });
        }

        res.status(200).json({
            success: true,
            message: "Authenticated",
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                isVerified: user.isVerified,
                lastLogin: user.lastLogin,
                createdAt: user.createdAt,
                isAdmin: user.isAdmin,
                quickLinks: user.quickLinks
            }
        });

    } catch (error) {
        console.log("error in checkAuth ", error);
        return res.status(500).json({ success: false, message: "Server error" });

    }
}


export const signup = async (req, res) => {
    const { email, password, name } = req.body;

    try {

        if (!email || !password || !name) {
            throw new Error("All fields are required");
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, message: "User already exists" });
        }

        const hashedPassword = await bcryptjs.hash(password, 10);

        const user = new User({
            email,
            password: hashedPassword,
            name,
            isVerified: true
        });

        await user.save();

        //jwt
        generateTokenAndSetCookie(res, user._id);

        // await sendVerificationEmail(user.email, user.verificationToken);


        res.status(201).json({
            success: true,
            message: "User created successfully",
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                isAdmin: user.isAdmin,
                quickLinks: user.quickLinks

            }
        });

    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}

export const verifyEmail = async (req, res) => {
    const { code } = req.body;
    try {
        const user = await User.findOne({
            verificationToken: code,
            verificationExpiresAt: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid or expired verification code" });
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationExpiresAt = undefined;
        await user.save();

        await sendWelcomeEmail(user.name, user.email);


        res.status(200).json({
            success: true,
            message: "Email verified successfully",
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                isVerified: user.isVerified
            }
        });

    } catch (error) {
        console.log("error in verifyEmail ", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
}

export const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid credentials" });
        }

        const isPasswordValid = await bcryptjs.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(400).json({ success: false, message: "Invalid credentials" });
        }

        generateTokenAndSetCookie(res, user._id);
        user.lastLogin = Date.now();
        await user.save();


        res.status(200).json({
            success: true,
            message: "Logged in successfully",
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                lastLogin: user.lastLogin,
                isVerified: user.isVerified,
                isAdmin: user.isAdmin,
                quickLinks: user.quickLinks
            },
        });

    } catch (error) {
        console.log("error in login ", error);
        res.status(400).json({ success: false, message: error.message });
    }
}

export const forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const resetToken = crypto.randomBytes(20).toString("hex");
        const resetTokenExpiresAt = Date.now() + 60 * 60 * 1000; //1 hora

        user.resetPasswordtoken = resetToken;
        user.resetPasswordexpiresAt = resetTokenExpiresAt;
        await user.save();

        await sendPasswordResetEmail(user.email, `${process.env.CLIENT_URL}/reset-password/${resetToken}`);

        res.status(200).json({ success: true, message: "Password reset email sent successfully" });

    } catch (error) {
        console.log("error in forgotPassword ", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
}

export const resetPassword = async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;


    try {
        const user = await User.findOne({
            resetPasswordtoken: token,
            resetPasswordexpiresAt: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid or expired token" });
        }

        if (!password) {
            return res.status(400).json({ success: false, message: "Password is required" });
        }
        const isSamePassword = await bcryptjs.compare(password, user.password);
        if (isSamePassword) {
            return res.status(400).json({ success: false, message: "New password must be different from the old one" });
        }

        const hashedPassword = await bcryptjs.hash(password, 10);
        user.password = hashedPassword;
        user.resetPasswordtoken = undefined;
        user.resetPasswordexpiresAt = undefined;
        await user.save();

        await sendResetPasswordconfirmationEmail(user.email);

        res.status(200).json({ success: true, message: "Password reset successfully" });

    } catch (error) {
        console.log("error in resetPassword ", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
}


export const logout = async (req, res) => {
    res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        path: "/"
    });
    res.status(200).json({ success: true, message: "Logged out successfully" });
}


export const checkResetToken = async (req, res) => {
    const { token } = req.params;

    try {
        const user = await User.findOne({
            resetPasswordtoken: token,
            resetPasswordexpiresAt: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid or expired token" });
        }

        res.status(200).json({ success: true, message: "Token is valid" });

    } catch (error) {
        console.log("error in checkResetToken ", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
}
