"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const List_1 = __importDefault(require("../models/List"));
const socket_1 = require("../socket");
const router = express_1.default.Router();
router.use(auth_1.authenticate);
router.post("/", async (req, res) => {
    try {
        const { title, boardId, position } = req.body;
        if (!title || !boardId) {
            return res.status(400).json({ error: "title and boardId are required" });
        }
        const list = await List_1.default.create({ title, board: boardId, position: position ?? 0 });
        (0, socket_1.getIO)().to(`board:${boardId}`).emit("list:created", list);
        res.status(201).json(list);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Something went wrong" });
    }
});
router.get("/board/:boardId", async (req, res) => {
    try {
        const lists = await List_1.default.find({ board: String(req.params.boardId) }).sort({ position: 1 });
        res.json(lists);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Something went wrong" });
    }
});
router.put("/:id", async (req, res) => {
    try {
        const { title, position, boardId } = req.body;
        const list = await List_1.default.findByIdAndUpdate(req.params.id, { ...(title !== undefined && { title }), ...(position !== undefined && { position }) }, { new: true });
        if (!list)
            return res.status(404).json({ error: "List not found" });
        if (boardId) {
            (0, socket_1.getIO)().to(`board:${boardId}`).emit("list:updated", list);
        }
        res.json(list);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Something went wrong" });
    }
});
router.delete("/:id", async (req, res) => {
    try {
        const boardId = req.query.boardId;
        const list = await List_1.default.findByIdAndDelete(req.params.id);
        if (!list)
            return res.status(404).json({ error: "List not found" });
        if (boardId) {
            (0, socket_1.getIO)().to(`board:${boardId}`).emit("list:deleted", { id: req.params.id });
        }
        res.json({ message: "List deleted" });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Something went wrong" });
    }
});
exports.default = router;
