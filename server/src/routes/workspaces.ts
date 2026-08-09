import express, { Response } from "express";
import { authenticate, AuthRequest } from "../middleware/auth";
import Workspace from "../models/Workspace";
import { getIO } from "../socket";

const router = express.Router();

router.use(authenticate);

router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required" });

    const workspace = await Workspace.create({
      name,
      members: [{ user: req.userId, role: "OWNER" }],
    });

    getIO().emit("workspace:created", workspace);

    res.status(201).json(workspace);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const workspaces = await Workspace.find({ "members.user": req.userId });
    res.json(workspaces);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

router.get("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) return res.status(404).json({ error: "Workspace not found" });
    res.json(workspace);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

router.put("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const { name } = req.body;
    const workspace = await Workspace.findByIdAndUpdate(
      req.params.id,
      { name },
      { new: true }
    );
    if (!workspace) return res.status(404).json({ error: "Workspace not found" });

    getIO().emit("workspace:updated", workspace);

    res.json(workspace);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

router.delete("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const workspace = await Workspace.findByIdAndDelete(req.params.id);
    if (!workspace) return res.status(404).json({ error: "Workspace not found" });

    getIO().emit("workspace:deleted", { id: req.params.id });

    res.json({ message: "Workspace deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

export default router;