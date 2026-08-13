"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const Comment_1 = __importDefault(require("../models/Comment"));
const socket_1 = require("../socket");
const router = express_1.default.Router();
router.use(auth_1.authenticate);
// GET all comments for a card
router.get("/card/:cardId", async (req, res) => {
    try {
        const comments = await Comment_1.default.find({ card: String(req.params.cardId) })
            .populate("author", "name email")
            .sort({ createdAt: 1 });
        res.json(comments);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Something went wrong" });
    }
});
// CREATE a comment
router.post("/", async (req, res) => {
    try {
        if (!req.userId)
            return res.status(401).json({ error: "Unauthorized" });
        const { content, cardId, boardId } = req.body;
        if (!content || !cardId) {
            return res.status(400).json({ error: "content and cardId are required" });
        }
        const comment = await Comment_1.default.create({
            content,
            card: cardId,
            author: req.userId,
        });
        const populated = await comment.populate("author", "name email");
        if (boardId) {
            (0, socket_1.getIO)().to(`board:${boardId}`).emit("comment:created", populated);
        }
        res.status(201).json(populated);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Something went wrong" });
    }
});
// DELETE a comment
router.delete("/:id", async (req, res) => {
    try {
        const boardId = req.query.boardId;
        const comment = await Comment_1.default.findByIdAndDelete(req.params.id);
        if (!comment)
            return res.status(404).json({ error: "Comment not found" });
        if (boardId) {
            (0, socket_1.getIO)().to(`board:${boardId}`).emit("comment:deleted", { id: req.params.id });
        }
        res.json({ message: "Comment deleted" });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Something went wrong" });
    }
});
exports.default = router;
