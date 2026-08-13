import express, { Response } from "express";
import { authenticate, AuthRequest } from "../middleware/auth";
import Card from "../models/Card";
import { getIO } from "../socket";

const router = express.Router();

router.use(authenticate);

// CREATE card
router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const { title, listId, position, description, boardId, dueDate } = req.body;
    if (!title || !listId || !boardId) {
      return res.status(400).json({ error: "title, listId, and boardId are required" });
    }

    const card = await Card.create({
      title,
      list: listId,
      position: position ?? 0,
      description,
      dueDate,
    });

    getIO().to(`board:${boardId}`).emit("card:created", card);

    res.status(201).json(card);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// SEARCH cards by title
router.get("/search", async (req: AuthRequest, res: Response) => {
  try {
    const query = req.query.q as string | undefined;
    if (!query || !query.trim()) return res.json([]);

    const cards = await Card.find({
      title: { $regex: query, $options: "i" },
    })
      .populate({
        path: "list",
        select: "title board",
        populate: { path: "board", select: "title workspace" },
      })
      .limit(30);

    res.json(cards);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// GET all cards for a list
router.get("/list/:listId", async (req: AuthRequest, res: Response) => {
  try {
    const cards = await Card.find({ list: String(req.params.listId) }).sort({ position: 1 });
    res.json(cards);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// UPDATE card (title, description, dueDate, position, list — for drag-and-drop moves, assignee)
router.put("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, position, listId, assignee, boardId, dueDate } = req.body;
    const update: any = {};
    if (title !== undefined) update.title = title;
    if (description !== undefined) update.description = description;
    if (position !== undefined) update.position = position;
    if (listId !== undefined) update.list = listId;
    if (assignee !== undefined) update.assignee = assignee;
    if (dueDate !== undefined) update.dueDate = dueDate;

    const card = await Card.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!card) return res.status(404).json({ error: "Card not found" });

    if (boardId) {
      getIO().to(`board:${boardId}`).emit("card:updated", card);
    }

    res.json(card);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// DELETE card
router.delete("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const boardId = req.query.boardId as string | undefined;
    const card = await Card.findByIdAndDelete(req.params.id);
    if (!card) return res.status(404).json({ error: "Card not found" });

    if (boardId) {
      getIO().to(`board:${boardId}`).emit("card:deleted", { id: req.params.id });
    }

    res.json({ message: "Card deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

export default router;