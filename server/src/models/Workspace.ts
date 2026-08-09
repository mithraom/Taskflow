import mongoose, { Schema, Document } from "mongoose";

export interface IWorkspaceMember {
  user: mongoose.Types.ObjectId;
  role: "OWNER" | "MEMBER";
}

export interface IWorkspace extends Document {
  name: string;
  members: IWorkspaceMember[];
  createdAt: Date;
}

const workspaceSchema = new Schema<IWorkspace>({
  name: { type: String, required: true },
  members: [
    {
      user: { type: Schema.Types.ObjectId, ref: "User", required: true },
      role: { type: String, enum: ["OWNER", "MEMBER"], default: "MEMBER" },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IWorkspace>("Workspace", workspaceSchema);