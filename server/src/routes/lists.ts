import express, { Response } from "express";
import { authenticate, AuthRequest } from "../middleware/auth";
import List from "../models/List";
import { getIO } from "../socket";

const router = express.Router();

router.use(authenticate);

router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const { title, boardId, position } = req.body;
    if (!title || !boardId) {
      return res.status(400).json({ error: "title and boardId are required" });
    }

    const list = await List.create({ title, board: boardId, position: position ?? 0 });

    getIO().to(`board:${boardId}`).emit("list:created", list);

    res.status(201).json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

router.get("/board/:boardId", async (req: AuthRequest, res: Response) => {
  try {
    const lists = await List.find({ board: String(req.params.boardId) }).sort({ position: 1 });
    res.json(lists);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

router.put("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const { title, position, boardId } = req.body;
    const list = await List.findByIdAndUpdate(
      req.params.id,
      { ...(title !== undefined && { title }), ...(position !== undefined && { position }) },
      { new: true }
    );
    if (!list) return res.status(404).json({ error: "List not found" });

    if (boardId) {
      getIO().to(`board:${boardId}`).emit("list:updated", list);
    }

    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

router.delete("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const boardId = req.query.boardId as string | undefined;
    const list = await List.findByIdAndDelete(req.params.id);
    if (!list) return res.status(404).json({ error: "List not found" });

    if (boardId) {
      getIO().to(`board:${boardId}`).emit("list:deleted", { id: req.params.id });
    }

    res.json({ message: "List deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

export default router;