import express, { Response } from "express";
import { authenticate, AuthRequest } from "../middleware/auth";
import Board from "../models/Board";
import { getIO } from "../socket";

const router = express.Router();

router.use(authenticate);

router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const { title, workspaceId } = req.body;
    if (!title || !workspaceId) {
      return res.status(400).json({ error: "title and workspaceId are required" });
    }

    const board = await Board.create({ title, workspace: workspaceId });

    getIO().emit("board:created", board);

    res.status(201).json(board);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

router.get("/workspace/:workspaceId", async (req: AuthRequest, res: Response) => {
  try {
    const boards = await Board.find({ workspace: String(req.params.workspaceId) });
    res.json(boards);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

router.get("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ error: "Board not found" });
    res.json(board);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

router.put("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const { title } = req.body;
    const board = await Board.findByIdAndUpdate(req.params.id, { title }, { new: true });
    if (!board) return res.status(404).json({ error: "Board not found" });

    getIO().emit("board:updated", board);

    res.json(board);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

router.delete("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const board = await Board.findByIdAndDelete(req.params.id);
    if (!board) return res.status(404).json({ error: "Board not found" });

    getIO().emit("board:deleted", { id: req.params.id });

    res.json({ message: "Board deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

export default router;