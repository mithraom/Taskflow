"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
const ACCESS_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
router.post("/signup", async (req, res) => {
    try {
        const { email, password, name } = req.body;
        if (!email || !password || !name) {
            return res.status(400).json({ error: "Missing required fields" });
        }
        const normalizedEmail = email.trim().toLowerCase();
        const existingUser = await User_1.default.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(409).json({ error: "User already exists" });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const user = await User_1.default.create({ email: normalizedEmail, password: hashedPassword, name });
        const accessToken = jsonwebtoken_1.default.sign({ userId: user._id }, ACCESS_SECRET, { expiresIn: "15m" });
        const refreshToken = jsonwebtoken_1.default.sign({ userId: user._id }, REFRESH_SECRET, { expiresIn: "7d" });
        res.status(201).json({
            user: { id: user._id, email: user.email, name: user.name },
            accessToken,
            refreshToken,
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Something went wrong" });
    }
});
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = email.trim().toLowerCase();
        const user = await User_1.default.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        const validPassword = await bcryptjs_1.default.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        const accessToken = jsonwebtoken_1.default.sign({ userId: user._id }, ACCESS_SECRET, { expiresIn: "15m" });
        const refreshToken = jsonwebtoken_1.default.sign({ userId: user._id }, REFRESH_SECRET, { expiresIn: "7d" });
        res.json({
            user: { id: user._id, email: user.email, name: user.name },
            accessToken,
            refreshToken,
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Something went wrong" });
    }
});
router.post("/refresh", async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(401).json({ error: "Refresh token required" });
        }
        const payload = jsonwebtoken_1.default.verify(refreshToken, REFRESH_SECRET);
        const accessToken = jsonwebtoken_1.default.sign({ userId: payload.userId }, ACCESS_SECRET, { expiresIn: "15m" });
        res.json({ accessToken });
    }
    catch (err) {
        res.status(403).json({ error: "Invalid or expired refresh token" });
    }
});
// GET current user profile
router.get("/me", auth_1.authenticate, async (req, res) => {
    try {
        if (!req.userId)
            return res.status(401).json({ error: "Unauthorized" });
        const user = await User_1.default.findById(req.userId).select("-password");
        if (!user)
            return res.status(404).json({ error: "User not found" });
        res.json(user);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Something went wrong" });
    }
});
// UPDATE profile (name, email)
router.put("/me", auth_1.authenticate, async (req, res) => {
    try {
        if (!req.userId)
            return res.status(401).json({ error: "Unauthorized" });
        const { name, email } = req.body;
        const normalizedEmail = email ? email.trim().toLowerCase() : undefined;
        if (normalizedEmail) {
            const existing = await User_1.default.findOne({ email: normalizedEmail, _id: { $ne: req.userId } });
            if (existing)
                return res.status(409).json({ error: "Email already in use" });
        }
        const update = {};
        if (name !== undefined)
            update.name = name;
        if (normalizedEmail !== undefined)
            update.email = normalizedEmail;
        const user = await User_1.default.findByIdAndUpdate(req.userId, update, { new: true }).select("-password");
        if (!user)
            return res.status(404).json({ error: "User not found" });
        res.json(user);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Something went wrong" });
    }
});
// CHANGE password
router.put("/me/password", auth_1.authenticate, async (req, res) => {
    try {
        if (!req.userId)
            return res.status(401).json({ error: "Unauthorized" });
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: "Current and new password are required" });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ error: "New password must be at least 6 characters" });
        }
        const user = await User_1.default.findById(req.userId);
        if (!user)
            return res.status(404).json({ error: "User not found" });
        const validPassword = await bcryptjs_1.default.compare(currentPassword, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: "Current password is incorrect" });
        }
        user.password = await bcryptjs_1.default.hash(newPassword, 10);
        await user.save();
        res.json({ message: "Password updated successfully" });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Something went wrong" });
    }
});
exports.default = router;
