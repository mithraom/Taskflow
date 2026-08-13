import express, { Response } from "express";
import { authenticate, AuthRequest } from "../middleware/auth";
import Workspace from "../models/Workspace";
import User from "../models/User";
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

// GET members of a workspace (populated with user details)
router.get("/:id/members", async (req: AuthRequest, res: Response) => {
  try {
    const workspace = await Workspace.findById(req.params.id).populate(
      "members.user",
      "name email"
    );
    if (!workspace) return res.status(404).json({ error: "Workspace not found" });
    res.json(workspace.members);
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

// INVITE a user to a workspace by email
router.post("/:id/invite", async (req: AuthRequest, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const normalizedEmail = email.trim().toLowerCase();
    const invitedUser = await User.findOne({ email: normalizedEmail });
    if (!invitedUser) {
      return res.status(404).json({ error: "No user found with that email" });
    }

    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) return res.status(404).json({ error: "Workspace not found" });

    const alreadyMember = workspace.members.some(
      (m) => m.user.toString() === invitedUser._id.toString()
    );
    if (alreadyMember) {
      return res.status(409).json({ error: "User is already a member of this workspace" });
    }

    workspace.members.push({ user: invitedUser._id, role: "MEMBER" });
    await workspace.save();

    getIO().emit("workspace:updated", workspace);

    res.status(200).json(workspace);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// REMOVE a member from a workspace
router.delete("/:id/members/:userId", async (req: AuthRequest, res: Response) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) return res.status(404).json({ error: "Workspace not found" });

    workspace.members = workspace.members.filter(
      (m) => m.user.toString() !== req.params.userId
    ) as typeof workspace.members;
    await workspace.save();

    getIO().emit("workspace:updated", workspace);

    res.json({ message: "Member removed" });
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