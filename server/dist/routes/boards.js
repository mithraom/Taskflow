"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const Board_1 = __importDefault(require("../models/Board"));
const socket_1 = require("../socket");
const router = express_1.default.Router();
router.use(auth_1.authenticate);
router.post("/", async (req, res) => {
    try {
        const { title, workspaceId } = req.body;
        if (!title || !workspaceId) {
            return res.status(400).json({ error: "title and workspaceId are required" });
        }
        const board = await Board_1.default.create({ title, workspace: workspaceId });
        (0, socket_1.getIO)().emit("board:created", board);
        res.status(201).json(board);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Something went wrong" });
    }
});
router.get("/workspace/:workspaceId", async (req, res) => {
    try {
        const boards = await Board_1.default.find({ workspace: String(req.params.workspaceId) });
        res.json(boards);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Something went wrong" });
    }
});
router.get("/:id", async (req, res) => {
    try {
        const board = await Board_1.default.findById(req.params.id);
        if (!board)
            return res.status(404).json({ error: "Board not found" });
        res.json(board);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Something went wrong" });
    }
});
router.put("/:id", async (req, res) => {
    try {
        const { title } = req.body;
        const board = await Board_1.default.findByIdAndUpdate(req.params.id, { title }, { new: true });
        if (!board)
            return res.status(404).json({ error: "Board not found" });
        (0, socket_1.getIO)().emit("board:updated", board);
        res.json(board);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Something went wrong" });
    }
});
router.delete("/:id", async (req, res) => {
    try {
        const board = await Board_1.default.findByIdAndDelete(req.params.id);
        if (!board)
            return res.status(404).json({ error: "Board not found" });
        (0, socket_1.getIO)().emit("board:deleted", { id: req.params.id });
        res.json({ message: "Board deleted" });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Something went wrong" });
    }
});
exports.default = router;
