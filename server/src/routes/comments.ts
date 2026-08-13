import express, { Response } from "express";
import { authenticate, AuthRequest } from "../middleware/auth";
import Comment from "../models/Comment";
import { getIO } from "../socket";

const router = express.Router();

router.use(authenticate);

// GET all comments for a card
router.get("/card/:cardId", async (req: AuthRequest, res: Response) => {
  try {
    const comments = await Comment.find({ card: String(req.params.cardId) })
      .populate("author", "name email")
      .sort({ createdAt: 1 });
    res.json(comments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// CREATE a comment
router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "Unauthorized" });
    const { content, cardId, boardId } = req.body;
    if (!content || !cardId) {
      return res.status(400).json({ error: "content and cardId are required" });
    }

    const comment = await Comment.create({
      content,
      card: cardId,
      author: req.userId,
    });

    const populated = await comment.populate("author", "name email");

    if (boardId) {
      getIO().to(`board:${boardId}`).emit("comment:created", populated);
    }

    res.status(201).json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// DELETE a comment
router.delete("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const boardId = req.query.boardId as string | undefined;
    const comment = await Comment.findByIdAndDelete(req.params.id);
    if (!comment) return res.status(404).json({ error: "Comment not found" });

    if (boardId) {
      getIO().to(`board:${boardId}`).emit("comment:deleted", { id: req.params.id });
    }

    res.json({ message: "Comment deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

export default router;